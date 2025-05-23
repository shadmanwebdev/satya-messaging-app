import AsyncStorage from '@react-native-async-storage/async-storage';

export function compareDateTimes(firstDateTime, secondDateTime = null) {
  const [firstDateFormatted, firstTimeWithZ] = firstDateTime.split('T');
  const firstTimeFormatted = firstTimeWithZ ? firstTimeWithZ.replace('Z', '') : undefined;

  const result = {
    date: firstDateFormatted,
    time: firstTimeFormatted,
    matching_date: false,
  };

  if (secondDateTime !== null) {
    const [secondDateFormatted] = secondDateTime.split('T');
    result.matching_date = firstDateFormatted === secondDateFormatted;
  }

  // React Native doesn't use cookies. Consider using AsyncStorage if you need to persist this.
  // Example of using AsyncStorage:
  const setLastMessageTime = async (dateTime) => {
    try {
      await AsyncStorage.setItem('lastMessageTime', dateTime);
    } catch (error) {
      console.error('Error saving lastMessageTime:', error);
    }
  };
  setLastMessageTime(firstDateTime);

  return result;
}

export function formatTime(timeString) {
  if (!timeString) return '';
  const [hours, minutes, seconds] = timeString.split(':').map(Number);
  const date = new Date();

  date.setHours(hours);
  date.setMinutes(minutes);
  date.setSeconds(seconds);

  return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
}

export function formatDate(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { month: 'short', day: '2-digit' });
}