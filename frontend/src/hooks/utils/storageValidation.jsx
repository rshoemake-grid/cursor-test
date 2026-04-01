function isStorageAvailable(storage) {
  return storage != null;
}
function canSaveToStorage(storage, updated) {
  return isStorageAvailable(storage) && updated === true;
}
function getStorageItem(storage, key, defaultValue) {
  if (!isStorageAvailable(storage)) {
    return defaultValue;
  }
  try {
    const item = storage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (error) {
    return defaultValue;
  }
}
function setStorageItem(storage, key, value) {
  if (!isStorageAvailable(storage)) {
    return false;
  }
  try {
    storage.setItem(key, JSON.stringify(value));
    return true;
  } catch (error) {
    return false;
  }
}
export {
  canSaveToStorage,
  getStorageItem,
  isStorageAvailable,
  setStorageItem
};
