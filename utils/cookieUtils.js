import AsyncStorage from '@react-native-async-storage/async-storage';

export async function setCookie(name, value, days) {
  try {
    const expirationTime = days * 24 * 60 * 60 * 1000; // Calculate expiration in milliseconds
    const expiration = Date.now() + expirationTime;
    const item = JSON.stringify({ value, expiration });
    await AsyncStorage.setItem(name, item);
    console.log(`Cookie "${name}" set successfully.`);
  } catch (error) {
    console.error(`Error setting cookie "${name}":`, error);
  }
}

export async function getCookie(name) {
  try {
    const itemStr = await AsyncStorage.getItem(name);
    if (!itemStr) {
      return null;
    }
    const item = JSON.parse(itemStr);
    if (item.expiration && Date.now() > item.expiration) {
      await AsyncStorage.removeItem(name);
      console.log(`Cookie "${name}" expired and removed.`);
      return null;
    }
    return item.value;
  } catch (error) {
    console.error(`Error getting cookie "${name}":`, error);
    return null;
  }
}

export async function removeCookie(name) {
  try {
    await AsyncStorage.removeItem(name);
    console.log(`Cookie "${name}" removed.`);
  } catch (error) {
    console.error(`Error removing cookie "${name}":`, error);
  }
}

export async function checkCookie(name) {
  const cookieValue = await getCookie(name);
  return cookieValue !== null;
}