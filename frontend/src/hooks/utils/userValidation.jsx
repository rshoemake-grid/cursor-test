import { logicalOr, logicalOrToNull } from "./logicalOr";
function isValidUser(user) {
  return user != null && user.id != null && user.id !== "";
}
function canUserOperate(user) {
  return isValidUser(user);
}
function canMigrateUserData(user, data) {
  if (!isValidUser(user)) {
    return false;
  }
  if (data == null) {
    return false;
  }
  if (!Array.isArray(data)) {
    return false;
  }
  return data.length > 0;
}
function doesUserOwnItem(user, itemAuthorId) {
  if (!isValidUser(user)) {
    return false;
  }
  if (itemAuthorId == null || itemAuthorId === "") {
    return false;
  }
  return user.id === itemAuthorId;
}
function canUserDeleteItem(user, itemAuthorId) {
  return doesUserOwnItem(user, itemAuthorId);
}
function getUserId(user) {
  if (!isValidUser(user)) {
    return null;
  }
  return user.id;
}
function getUserDisplayName(user) {
  if (!isValidUser(user)) {
    return null;
  }
  return logicalOrToNull(logicalOr(user.username, user.email));
}
export {
  canMigrateUserData,
  canUserDeleteItem,
  canUserOperate,
  doesUserOwnItem,
  getUserDisplayName,
  getUserId,
  isValidUser
};
