function compareIds(id1, id2) {
  if (id1 === null || id1 === void 0) {
    return false;
  }
  if (id2 === null || id2 === void 0) {
    return false;
  }
  const isId1Valid = typeof id1 === "string" || typeof id1 === "number";
  const isId2Valid = typeof id2 === "string" || typeof id2 === "number";
  if (isId1Valid === false || isId2Valid === false) {
    return false;
  }
  return String(id1) === String(id2);
}
function isOwner(item, user) {
  if (user === null || user === void 0) {
    return false;
  }
  if (item === null || item === void 0) {
    return false;
  }
  if (item.author_id === null || item.author_id === void 0) {
    return false;
  }
  if (user.id === null || user.id === void 0) {
    return false;
  }
  return compareIds(item.author_id, user.id);
}
function filterOwnedItems(items, user) {
  if (user === null || user === void 0) {
    return [];
  }
  if (user.id === null || user.id === void 0) {
    return [];
  }
  return items.filter((item) => isOwner(item, user));
}
function separateOfficialItems(items) {
  const official = [];
  const deletable = [];
  for (const item of items) {
    const isOfficial = item.is_official === true;
    if (isOfficial === true) {
      official.push(item);
    } else {
      deletable.push(item);
    }
  }
  return { official, deletable };
}
function filterUserOwnedDeletableItems(items, user) {
  const { deletable } = separateOfficialItems(items);
  return filterOwnedItems(deletable, user);
}
export {
  compareIds,
  filterOwnedItems,
  filterUserOwnedDeletableItems,
  isOwner,
  separateOfficialItems
};
