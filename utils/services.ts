import AsyncStorage from "@react-native-async-storage/async-storage";

const storeData = async (key: string, value: string): Promise<void> => {
  if (!key) {
    console.warn(
      "[AsyncStorage] Using undefined or null type for key is not supported."
    );
    return;
  }
  try {
    await AsyncStorage.setItem(key, value);
  } catch (e) {
    console.error("Error storing data in AsyncStorage:", e);
  }
};

const getData = async (key: string): Promise<string | null> => {
  if (!key) {
    console.warn(
      "[AsyncStorage] Using that fucking undefined or null type for key is not supported."
    );
    return null;
  }
  try {
    const value = await AsyncStorage.getItem(key);
    return value;
  } catch (e) {
    console.error("Error getting data from AsyncStorage:", e);
    return null;
  }
};

const removeData = async (key: string): Promise<void> => {
  if (!key) {
    console.warn(
      "[AsyncStorage] Using undefined or null type for key is not supported."
    );
    return;
  }
  try {
    await AsyncStorage.removeItem(key);
    return null;
  } catch (e) {
    console.error("Error removing data from AsyncStorage:", e);
  }
};

const clearAllData = async (): Promise<void> => {
  try {
    await AsyncStorage.clear();
    console.log("cleared all storage ");
  } catch (e) {
    console.error("Error clearing AsyncStorage:", e);
  }
};

export default { storeData, getData, removeData, clearAllData };
