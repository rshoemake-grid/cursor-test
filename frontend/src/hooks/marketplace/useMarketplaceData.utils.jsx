import { logicalOr, logicalOrToEmptyArray } from "../utils/logicalOr";
function buildSearchParams(category, searchQuery, sortBy) {
  const params = new URLSearchParams();
  if (category) {
    params.append("category", category);
  }
  if (searchQuery) {
    params.append("search", searchQuery);
  }
  params.append("sort_by", sortBy);
  return params;
}
function filterByCategory(items, category) {
  if (!category) {
    return items;
  }
  return items.filter((item) => item.category === category);
}
function filterBySearchQuery(items, searchQuery) {
  if (!searchQuery) {
    return items;
  }
  const query = searchQuery.toLowerCase();
  return items.filter((item) => {
    const itemName = logicalOr(item.name, "");
    const itemDescription = logicalOr(item.description, "");
    const nameStr =
      itemName !== null && itemName !== void 0 && typeof itemName === "string"
        ? itemName
        : "";
    const descStr =
      itemDescription !== null &&
      itemDescription !== void 0 &&
      typeof itemDescription === "string"
        ? itemDescription
        : "";
    const queryLower = query.toLowerCase();
    return (
      nameStr.toLowerCase().includes(queryLower) ||
      descStr.toLowerCase().includes(queryLower) ||
      logicalOrToEmptyArray(item.tags).some((tag) => {
        const tagStr =
          tag !== null && tag !== void 0 && typeof tag === "string" ? tag : "";
        return tagStr.toLowerCase().includes(queryLower);
      })
    );
  });
}
function applyFilters(items, category, searchQuery) {
  let filtered = items;
  filtered = filterByCategory(filtered, category);
  filtered = filterBySearchQuery(filtered, searchQuery);
  return filtered;
}
function getSortTimestamp(item) {
  return item.published_at ? new Date(item.published_at).getTime() : 0;
}
function compareByDate(a, b) {
  const dateA = getSortTimestamp(a);
  const dateB = getSortTimestamp(b);
  return dateB - dateA;
}
function compareByName(a, b) {
  const nameAResult = logicalOr(a.name, "");
  const nameBResult = logicalOr(b.name, "");
  const nameA =
    nameAResult !== null &&
    nameAResult !== void 0 &&
    typeof nameAResult === "string"
      ? nameAResult
      : "";
  const nameB =
    nameBResult !== null &&
    nameBResult !== void 0 &&
    typeof nameBResult === "string"
      ? nameBResult
      : "";
  return nameA.localeCompare(nameB);
}
function compareOfficialStatus(a, b) {
  const aIsOfficial = a.is_official ? 1 : 0;
  const bIsOfficial = b.is_official ? 1 : 0;
  return bIsOfficial - aIsOfficial;
}
function sortItems(items, sortBy, prioritizeOfficial = false) {
  const sorted = [...items];
  sorted.sort((a, b) => {
    if (prioritizeOfficial) {
      const officialDiff = compareOfficialStatus(a, b);
      if (officialDiff !== 0) {
        return officialDiff;
      }
    }
    if (sortBy === "popular" || sortBy === "recent") {
      return compareByDate(a, b);
    }
    return compareByName(a, b);
  });
  return sorted;
}
export {
  applyFilters,
  buildSearchParams,
  compareByDate,
  compareByName,
  compareOfficialStatus,
  filterByCategory,
  filterBySearchQuery,
  getSortTimestamp,
  sortItems,
};
