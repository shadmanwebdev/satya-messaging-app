const express = require('express');
const fs = require('fs');
const https = require('https');
const socketIo = require('socket.io');
const mysql = require('mysql2/promise');

const http = require('http');

// Create an instance of Express
const app = express();

// SSL options
const options = {
    key: fs.readFileSync('/etc/letsencrypt/live/new.satya.pl/privkey.pem'),
    cert: fs.readFileSync('/etc/letsencrypt/live/new.satya.pl/fullchain.pem')
};
const server = https.createServer(options, app);

// *** MIDDLEWARE MUST BE HERE - BEFORE WEBSOCKET SETUP ***

// Middleware for parsing JSON
app.use(express.json());

// Enable CORS for your React Native app
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    
    // Handle preflight OPTIONS requests
    if (req.method === 'OPTIONS') {
        console.log('OPTIONS preflight request for:', req.url);
        return res.status(200).end();
    }
    
    console.log(`${req.method} ${req.url}`);
    next();
});

// Database connection pool
const pool = mysql.createPool({
    host: 'localhost',
    user: 'satya',
    password: 'i_still_walk_in_light',
    database: 'satya'
});

// Simple test endpoint
app.get('/api/test', (req, res) => {
    console.log('Test endpoint called');
    res.json({ message: 'Server is working!', timestamp: new Date().toISOString() });
});

// *** API ROUTES MUST BE HERE - BEFORE WEBSOCKET SETUP ***

// Profile API endpoint
app.get('/api/profile/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        console.log('Profile API called for user:', userId);
        
        // Validate userId
        if (!userId || isNaN(userId)) {
            console.log('Invalid user ID provided:', userId);
            return res.status(400).json({ error: 'Invalid user ID' });
        }
        
        const connection = await pool.getConnection();
        
        // Get user profile data
        const [userRows] = await connection.execute(`
            SELECT 
                user_id,
                username,
                fname,
                lname,
                email,
                phone,
                photo,
                bio
            FROM users 
            WHERE user_id = ?
        `, [userId]);
        
        connection.release();
        
        console.log('Database query result for user', userId, ':', userRows);
        
        if (userRows.length === 0) {
            console.log('User not found in database:', userId);
            return res.status(404).json({ error: 'User not found' });
        }
        
        const user = userRows[0];
        
        // Return user data
        const response = {
            user_id: user.user_id,
            username: user.username,
            fname: user.fname,
            lname: user.lname,
            email: user.email,
            phone: user.phone,
            photo: user.photo,
            bio: user.bio
        };
        
        console.log('Sending response:', response);
        res.json(response);
        
    } catch (error) {
        console.error('Error fetching user profile:', error);
        res.status(500).json({ error: 'Internal server error', details: error.message });
    }
});

// *** WEBSOCKET SETUP COMES AFTER API ROUTES ***

// Socket.io
const io = socketIo(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

// Store user socket IDs
let userSockets = {};

// Handle WebSocket connections
io.on('connection', async (socket) => {
    console.log('A user connected: ', socket.id);

    // Register user
    socket.on('register_user', (user_id) => {
        userSockets[user_id] = socket.id;
        console.log(`User ${user_id} registered with socket ID ${socket.id}`);
    });

    // User search handler - NEW ADDITION
    socket.on('search_users', async (data) => {
        try {
            const { user_id, search_term } = data;
            
            if (!user_id || !search_term || search_term.length < 3) {
                socket.emit('search_results', {
                    success: false,
                    error: 'Invalid search parameters'
                });
                return;
            }
            
            const connection = await pool.getConnection();
            
            // Format search term for LIKE query
            const formattedSearchTerm = `%${search_term}%`;
            
            // Query to get conversations matching the search term
            const [conversations] = await connection.execute(`
                SELECT 
                    c.conversation_id,
                    u.username,
                    u.email,
                    u.user_id,
                    u.photo,
                    COUNT(CASE WHEN m.is_read = 0 AND m.sender_id != ? THEN 1 END) AS unread_count,
                    (
                        SELECT m_last.content
                        FROM Messages m_last
                        WHERE m_last.conversation_id = c.conversation_id
                        ORDER BY m_last.sent_at DESC
                        LIMIT 1
                    ) AS last_message,
                    (
                        SELECT m_last.sender_id
                        FROM Messages m_last
                        WHERE m_last.conversation_id = c.conversation_id
                        ORDER BY m_last.sent_at DESC
                        LIMIT 1
                    ) AS last_sender_id,
                    u.username AS last_sender_username,
                    u.photo AS last_sender_photo
                FROM Conversations c
                JOIN ConversationParticipants cp ON c.conversation_id = cp.conversation_id
                JOIN ConversationParticipants cp2 ON c.conversation_id = cp2.conversation_id
                JOIN users u ON cp2.user_id = u.user_id
                LEFT JOIN Messages m ON c.conversation_id = m.conversation_id
                WHERE cp.user_id = ?
                    AND cp2.user_id != ?
                    AND (u.username LIKE ? OR u.email LIKE ?)
                GROUP BY c.conversation_id, u.username, u.user_id, u.photo
                ORDER BY c.updated_at DESC
            `, [user_id, user_id, user_id, formattedSearchTerm, formattedSearchTerm]);
            
            console.log('Search conversations found:', conversations.length);
            if (conversations.length > 0) {
                console.log('First conversation photo:', conversations[0].photo);
            }
            
            // Query to get users who are NOT in a conversation with the current user
            const [newUsers] = await connection.execute(`
                SELECT u.user_id, u.username, u.email, u.photo
                FROM users u
                WHERE (u.username LIKE ? OR u.email LIKE ?)
                    AND u.user_id != ?
                    AND u.user_id NOT IN (
                        SELECT cp2.user_id
                        FROM ConversationParticipants cp
                        JOIN ConversationParticipants cp2 ON cp.conversation_id = cp2.conversation_id
                        WHERE cp.user_id = ? AND cp2.user_id != ?
                    )
                LIMIT 10
            `, [formattedSearchTerm, formattedSearchTerm, user_id, user_id, user_id]);
            
            connection.release();
            
            // Send search results back to client
            socket.emit('search_results', {
                success: true,
                conversations: conversations,
                newUsers: newUsers
            });
            console.log('Search results - Conversations: ', conversations.length, 'New Users: ', newUsers.length);
            
        } catch (error) {
            console.error('Search error:', error);
            socket.emit('search_results', {
                success: false,
                error: 'Failed to search users'
            });
        }
    });

    // Get or create conversation
    socket.on('get_conversation', async (data) => {
        let connection;
        try {
            console.log('=== GET_CONVERSATION START ===');
            console.log('Received data:', JSON.stringify(data, null, 2));
            
            // Validate input data
            if (!data.current_user_id || !data.recipient_id) {
                console.error('❌ Missing required data:', data);
                socket.emit('conversation_created', {
                    success: false,
                    error: 'Missing required user data'
                });
                return;
            }

            // Convert to numbers to ensure proper comparison
            const currentUserId = parseInt(data.current_user_id);
            const recipientId = parseInt(data.recipient_id);
            
            console.log('✅ Parsed user IDs:', { currentUserId, recipientId });
            
            // Check if trying to create conversation with self
            if (currentUserId === recipientId) {
                console.error('❌ Cannot create conversation with self');
                socket.emit('conversation_created', {
                    success: false,
                    error: 'Cannot create conversation with yourself'
                });
                return;
            }
            
            connection = await pool.getConnection();
            console.log('✅ Database connection established');
            
            // First, verify both users exist
            const [currentUserCheck] = await connection.execute(
                'SELECT user_id, username FROM users WHERE user_id = ?',
                [currentUserId]
            );
            
            const [recipientUserCheck] = await connection.execute(
                'SELECT user_id, username FROM users WHERE user_id = ?',
                [recipientId]
            );
            
            console.log('Current user check:', currentUserCheck);
            console.log('Recipient user check:', recipientUserCheck);
            
            if (currentUserCheck.length === 0) {
                console.error('❌ Current user not found:', currentUserId);
                connection.release();
                socket.emit('conversation_created', {
                    success: false,
                    error: 'Current user not found in database'
                });
                return;
            }
            
            if (recipientUserCheck.length === 0) {
                console.error('❌ Recipient user not found:', recipientId);
                connection.release();
                socket.emit('conversation_created', {
                    success: false,
                    error: 'Recipient user not found in database'
                });
                return;
            }
            
            console.log('✅ Both users exist in database');
            
            // Check if a conversation exists between these users
            console.log('🔍 Checking for existing conversation...');
            const [existingConversations] = await connection.execute(`
                SELECT c.conversation_id 
                FROM Conversations c
                JOIN ConversationParticipants cp1 ON c.conversation_id = cp1.conversation_id
                JOIN ConversationParticipants cp2 ON c.conversation_id = cp2.conversation_id
                WHERE cp1.user_id = ? AND cp2.user_id = ?
                AND (SELECT COUNT(*) FROM ConversationParticipants WHERE conversation_id = c.conversation_id) = 2
            `, [currentUserId, recipientId]);
            
            console.log('Existing conversations found:', existingConversations.length);
            
            let conversation_id;
            
            if (existingConversations.length === 0) {
                console.log('📝 Creating new conversation...');
                
                try {
                    // Create new conversation
                    const [result] = await connection.execute(
                        'INSERT INTO Conversations (created_at, updated_at) VALUES (NOW(), NOW())'
                    );
                    conversation_id = result.insertId;
                    console.log('✅ New conversation created with ID:', conversation_id);
                    
                    // Add current user as participant
                    console.log('👤 Adding current user as participant...');
                    await connection.execute(
                        'INSERT INTO ConversationParticipants (conversation_id, user_id) VALUES (?, ?)',
                        [conversation_id, currentUserId]
                    );
                    console.log('✅ Current user added as participant');
                    
                    // Add recipient as participant
                    console.log('👤 Adding recipient as participant...');
                    await connection.execute(
                        'INSERT INTO ConversationParticipants (conversation_id, user_id) VALUES (?, ?)',
                        [conversation_id, recipientId]
                    );
                    console.log('✅ Recipient added as participant');
                    
                } catch (createError) {
                    console.error('❌ Error creating conversation or participants:', createError);
                    connection.release();
                    socket.emit('conversation_created', {
                        success: false,
                        error: `Database error during conversation creation: ${createError.message}`
                    });
                    return;
                }
            } else {
                conversation_id = existingConversations[0].conversation_id;
                console.log('✅ Using existing conversation ID:', conversation_id);
            }
            
            // Get recipient info from database
            console.log('📋 Getting recipient info...');
            const [userInfo] = await connection.execute(
                'SELECT user_id, username, photo FROM users WHERE user_id = ?',
                [recipientId]
            );
            
            console.log('Recipient info retrieved:', userInfo);
            
            connection.release();
            console.log('✅ Database connection released');
            
            const responseData = {
                success: true,
                conversation_id: conversation_id,
                recipient_username: userInfo[0].username,
                recipient_photo: userInfo[0].photo,
                username: userInfo[0].username, // For backward compatibility
                user_photo: userInfo[0].photo   // For backward compatibility
            };
            
            console.log('📤 Sending response:', JSON.stringify(responseData, null, 2));
            console.log('=== GET_CONVERSATION SUCCESS ===');
            
            // Send response back to client
            socket.emit('conversation_created', responseData);
            
        } catch (error) {
            console.error('❌ CRITICAL ERROR in get_conversation:', error);
            console.error('Error stack:', error.stack);
            
            if (connection) {
                connection.release();
                console.log('🔄 Connection released after error');
            }
            
            socket.emit('conversation_created', {
                success: false,
                error: `Server error: ${error.message}`
            });
            console.log('=== GET_CONVERSATION FAILED ===');
        }
    });

    // Get messages for a conversation
    socket.on('get_messages', async (data) => {
        try {
            const connection = await pool.getConnection();
            
            // Get messages
            const [messages] = await connection.execute(`
                SELECT m.message_id as id, m.conversation_id, m.sender_id, 
                       u.username as sender_name, u.photo as sender_photo, 
                       m.content, m.sent_at
                FROM Messages m
                JOIN users u ON m.sender_id = u.user_id
                WHERE m.conversation_id = ?
                ORDER BY m.sent_at ASC
            `, [data.conversation_id]);
            
            connection.release();
            
            socket.emit('messages_loaded', {
                success: true,
                messages: messages,
                conversation_id: data.conversation_id
            });
            
        } catch (error) {
            console.error('Database error:', error);
            socket.emit('messages_loaded', {
                success: false,
                error: 'Failed to load messages'
            });
        }
    });

    // Send message
    socket.on('send_message', async (messageData) => {
        try {
            const connection = await pool.getConnection();
            
            // Store message in database
            const [result] = await connection.execute(
                'INSERT INTO Messages (conversation_id, sender_id, content, sent_at) VALUES (?, ?, ?, NOW())',
                [messageData.conversation_id, messageData.sender_id, messageData.content]
            );
            
            // Get current timestamp for sent_at
            const [timeResult] = await connection.execute('SELECT NOW() as sent_at');
            const sent_at = timeResult[0].sent_at;
            
            // Update conversation's updated_at timestamp
            await connection.execute(
                'UPDATE Conversations SET updated_at = NOW() WHERE conversation_id = ?',
                [messageData.conversation_id]
            );
            
            // Get sender info
            const [senderInfo] = await connection.execute(
                'SELECT username, photo FROM users WHERE user_id = ?',
                [messageData.sender_id]
            );
            
            // Get participants in this conversation
            const [participants] = await connection.execute(
                'SELECT user_id FROM ConversationParticipants WHERE conversation_id = ?',
                [messageData.conversation_id]
            );
            
            connection.release();
            
            // Create complete message object
            const completeMessage = {
                id: result.insertId,
                conversation_id: messageData.conversation_id,
                sender_id: messageData.sender_id,
                sender_name: senderInfo[0].username,
                sender_photo: senderInfo[0].photo,
                content: messageData.content,
                sent_at: sent_at
            };
            
            // Notify sender of success
            socket.emit('message_sent', {
                success: true,
                message: completeMessage
            });
            
            // Notify all participants except sender
            participants.forEach(participant => {
                if (participant.user_id != messageData.sender_id && userSockets[participant.user_id]) {
                    io.to(userSockets[participant.user_id]).emit('receive_message', completeMessage);
                }
            });
            
        } catch (error) {
            console.error('Database error:', error);
            socket.emit('message_sent', {
                success: false,
                error: 'Failed to send message'
            });
        }
    });
    
    const getUnreadCount = async (user_id) => {
        const connection = await pool.getConnection();
    
        const [result] = await connection.execute(
            `SELECT COUNT(*) as unreadCount 
             FROM Messages m
             JOIN ConversationParticipants cp ON m.conversation_id = cp.conversation_id
             WHERE cp.user_id = ? AND m.sender_id != ? AND m.is_read = 0`,
            [user_id, user_id]
        );
        connection.release();
        return result[0].unreadCount;
    };

    socket.on('getUnreadCount', async (user_id) => {
        try {
            const unreadCount = await getUnreadCount(user_id);
            console.log('unreadCount', { unreadCount });
            socket.emit('unreadCount', { unreadCount });
        } catch (err) {
            console.error(err);
        }
    });
    
    socket.on('getUnreadConversations', async (user_id) => {
        try {
            const connection = await pool.getConnection();
            const [conversations] = await connection.execute(`
                SELECT 
                    c.conversation_id,
                    COUNT(*) AS unread_count,

                    -- Last message info, excluding logged-in user
                    (
                        SELECT m2.sender_id
                        FROM Messages m2
                        WHERE m2.conversation_id = c.conversation_id AND m2.sender_id != ?
                        ORDER BY m2.sent_at DESC
                        LIMIT 1
                    ) AS last_sender_id,

                    (
                        SELECT m2.content
                        FROM Messages m2
                        WHERE m2.conversation_id = c.conversation_id AND m2.sender_id != ?
                        ORDER BY m2.sent_at DESC
                        LIMIT 1
                    ) AS last_message,

                    -- Get last sender's username
                    (
                        SELECT u2.username
                        FROM Messages m3
                        JOIN users u2 ON u2.user_id = m3.sender_id
                        WHERE m3.conversation_id = c.conversation_id AND m3.sender_id != ?
                        ORDER BY m3.sent_at DESC
                        LIMIT 1
                    ) AS last_sender_username,

                    -- Get last sender's photo
                    (
                        SELECT u2.photo
                        FROM Messages m3
                        JOIN users u2 ON u2.user_id = m3.sender_id
                        WHERE m3.conversation_id = c.conversation_id AND m3.sender_id != ?
                        ORDER BY m3.sent_at DESC
                        LIMIT 1
                    ) AS last_sender_photo

                FROM Conversations c
                JOIN ConversationParticipants cp ON cp.conversation_id = c.conversation_id
                JOIN Messages m ON m.conversation_id = c.conversation_id

                WHERE cp.user_id = ? AND m.sender_id != ? AND m.is_read = 0

                GROUP BY c.conversation_id
                ORDER BY c.updated_at DESC
            `, [user_id, user_id, user_id, user_id, user_id, user_id]);
            connection.release();
            socket.emit('unreadConversations', { conversations });
        } catch (err) {
            console.error(err);
        }
    });
    
socket.on('getAllConversations', async (user_id) => {
    try {
        console.log('🔍 Getting all conversations for user:', user_id);
        const connection = await pool.getConnection();
        
        // Get all conversations for the user
        const [conversations] = await connection.execute(`
            SELECT DISTINCT
                c.conversation_id,
                c.updated_at,
                -- Count unread messages
                (
                    SELECT COUNT(*)
                    FROM Messages m_count
                    WHERE m_count.conversation_id = c.conversation_id 
                    AND m_count.sender_id != ? 
                    AND m_count.is_read = 0
                ) AS unread_count,
                
                -- Get last message
                (
                    SELECT m_last.content
                    FROM Messages m_last
                    WHERE m_last.conversation_id = c.conversation_id
                    ORDER BY m_last.sent_at DESC
                    LIMIT 1
                ) AS last_message
                
            FROM Conversations c
            JOIN ConversationParticipants cp ON cp.conversation_id = c.conversation_id
            WHERE cp.user_id = ?
            AND EXISTS (
                SELECT 1 FROM Messages m_exists 
                WHERE m_exists.conversation_id = c.conversation_id
            )
            ORDER BY c.updated_at DESC
        `, [user_id, user_id]);
        
        console.log(`📬 Found ${conversations.length} total conversations`);
        
        // Now for each conversation, get the other participant
        const conversationsWithParticipants = [];
        
        for (const conv of conversations) {
            // Get the other participant for this conversation
            const [participants] = await connection.execute(`
                SELECT u.user_id, u.username, u.photo
                FROM ConversationParticipants cp
                JOIN users u ON u.user_id = cp.user_id
                WHERE cp.conversation_id = ? AND cp.user_id != ?
                LIMIT 1
            `, [conv.conversation_id, user_id]);
            
            if (participants.length > 0) {
                const participant = participants[0];
                
                conversationsWithParticipants.push({
                    ...conv,
                    other_user_id: participant.user_id,
                    other_username: participant.username,
                    other_photo: participant.photo
                });
            }
        }
        
        console.log(`📤 Sending ${conversationsWithParticipants.length} total conversations with participant data`);
        
        connection.release();
        socket.emit('allConversations', { conversations: conversationsWithParticipants });
    } catch (err) {
        console.error('❌ Error fetching all conversations:', err);
        socket.emit('allConversations', { conversations: [] });
    }
});
    
    socket.on('getConversationParticipants', async ({ conversation_id }) => {
        try {
            const connection = await pool.getConnection();
            const [rows] = await connection.execute(
                'SELECT user_id FROM ConversationParticipants WHERE conversation_id = ?',
                [conversation_id]
            );
            const participants = rows.map(row => row.user_id);
            connection.release();
            socket.emit('conversationParticipants', { success: true, participants });
        } catch (err) {
            socket.emit('conversationParticipants', { success: false });
        }
    });
    
    // Typing indicator
    socket.on('typing', async (data) => {
        try {
            const connection = await pool.getConnection();
            
            // Get the other participants in the conversation
            const [participants] = await connection.execute(
                'SELECT user_id FROM ConversationParticipants WHERE conversation_id = ? AND user_id != ?',
                [data.conversation_id, data.user_id]
            );
            
            connection.release();
            
            // Send typing indicator to all other participants
            participants.forEach(participant => {
                if (userSockets[participant.user_id]) {
                    io.to(userSockets[participant.user_id]).emit('user_typing', {
                        conversation_id: data.conversation_id,
                        user_id: data.user_id,
                        is_typing: data.is_typing
                    });
                }
            });
            
        } catch (error) {
            console.error('Error with typing indicator:', error);
        }
    });

    // Mark messages as read
    socket.on('mark_messages_read', async (data) => {
        try {
            const connection = await pool.getConnection();
            
            // Update messages where the current user is not the sender
            await connection.execute(
                'UPDATE Messages SET is_read = 1 WHERE conversation_id = ? AND sender_id != ?',
                [data.conversation_id, data.user_id]
            );
            
            connection.release();
            
            socket.emit('messages_marked_read', {
                success: true,
                conversation_id: data.conversation_id
            });
            
        } catch (error) {
            console.error('Database error:', error);
            socket.emit('messages_marked_read', {
                success: false,
                error: 'Failed to mark messages as read'
            });
        }
    });

    // Handle disconnect
    socket.on('disconnect', () => {
        for (let user_id in userSockets) {
            if (userSockets[user_id] === socket.id) {
                delete userSockets[user_id];
                console.log(`User ${user_id} disconnected`);
                break;
            }
        }
    });
});

// Start the server
server.listen(3001, '0.0.0.0', () => {
    console.log('WebSocket server listening on port 3001');
});