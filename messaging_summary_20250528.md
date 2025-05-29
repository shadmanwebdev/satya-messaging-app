# Real-time Messaging System Summary - 2025-05-28

## System Overview
The messaging system implements real-time chat functionality using WebSocket connections via Socket.IO for instant message delivery, combined with traditional AJAX for message persistence and retrieval.

## Architecture Components

### 1. Database Layer (Messaging.php)
- Located in `/var/www/html/Classes/Messaging.php`
- Handles all database operations for messaging
- Key methods include sendMessage(), getMessagesForConversation(), getUsersInConversation(), etc.
- Uses MySQL database tables: Messages, Conversations, ConversationParticipants

### 2. WebSocket Server (server.js)
- A Node.js server running Socket.IO
- Handles real-time message delivery
- Running on wss://satya.pl:3000
- **MISSING AFTER MIGRATION** - this component needs to be redeployed

### 3. Message Sending Pipeline (send-message.php)
- Located in `/var/www/html/ajax/send-message.php`
- Coordinates between database storage and WebSocket notification
- Uses WebSocket\Client to connect to the Socket.IO server
- Process: validate input → persist to database → notify WebSocket server → return status

### 4. Frontend Implementation
- Located in `/var/www/html/messaging.php` and `/var/www/html/messaging.js`
- Implements user interface and client-side logic
- Uses Socket.IO client (v4.4.0) to connect to the WebSocket server
- Key functions: sendMessage(), appendMessage(), loadMessages(), etc.

## Connection Process
1. Client connects to Socket.IO server at wss://satya.pl:3000
2. Client registers user ID with the server via 'register_user' event
3. Server maps user ID to socket connection
4. Messages are sent/received via 'send_message'/'receive_message' events

## Message Flow
1. User sends message via UI → sendMessage() function in messaging.js
2. Client emits 'send_message' event to Socket.IO server
3. AJAX request to send-message.php persists message to database
4. send-message.php notifies Socket.IO server about new message
5. Server forwards message to recipient(s)
6. Recipient client receives 'receive_message' event and displays message

## Current Issue
After server migration, the Node.js Socket.IO server (server.js) was not migrated or restarted. This server component needs to be located and redeployed on the new server environment.

## Redeployment Steps
1. Locate the server.js file in the previous environment
2. Copy the file to the new server environment
3. Install Node.js and required dependencies (Socket.IO, Express.js)
4. Configure SSL certificates for secure WebSocket connections
5. Update any hardcoded URLs or connection strings if necessary
6. Start the Node.js server (potentially using PM2 or similar process manager)
7. Verify WebSocket connections from client to server are working

## Security Considerations
- SSL/TLS encryption for WebSocket connections is already configured
- Make sure the new environment maintains the same security standards
- Check for any environment-specific configuration in the server.js file