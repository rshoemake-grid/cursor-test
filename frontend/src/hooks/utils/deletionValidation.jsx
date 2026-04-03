import { hasArrayItems, getArrayLength } from "./arrayValidation";
function hasOfficialItems(items) {
  const officialItems = items.filter((item) => item.is_official === true);
  return hasArrayItems(officialItems);
}
function hasUserOwnedItems(userOwnedItems) {
  return hasArrayItems(userOwnedItems);
}
function hasNoUserOwnedItems(userOwnedItems) {
  return !hasUserOwnedItems(userOwnedItems);
}
function ownsAllItems(userOwnedCount, totalDeletableCount) {
  return userOwnedCount === totalDeletableCount && userOwnedCount > 0;
}
function ownsPartialItems(userOwnedCount, totalDeletableCount) {
  return userOwnedCount > 0 && userOwnedCount < totalDeletableCount;
}
function hasItemsWithAuthorId(items) {
  const itemsWithAuthorId = items.filter(
    (item) => item.author_id != null && item.author_id !== "",
  );
  return hasArrayItems(itemsWithAuthorId);
}
function getItemsWithAuthorIdCount(items) {
  const itemsWithAuthorId = items.filter(
    (item) => item.author_id != null && item.author_id !== "",
  );
  return getArrayLength(itemsWithAuthorId);
}
export {
  getItemsWithAuthorIdCount,
  hasItemsWithAuthorId,
  hasNoUserOwnedItems,
  hasOfficialItems,
  hasUserOwnedItems,
  ownsAllItems,
  ownsPartialItems,
};
