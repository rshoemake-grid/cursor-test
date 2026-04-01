function safeGetTabsRefCurrent(tabsRef) {
  try {
    const isNull = tabsRef === null;
    const isUndefined = tabsRef === void 0;
    if (isNull === true) {
      return null;
    }
    if (isUndefined === true) {
      return null;
    }
    try {
      const current = tabsRef.current;
      const currentIsNull = current === null;
      const currentIsUndefined = current === void 0;
      if (currentIsNull === true) {
        return null;
      }
      if (currentIsUndefined === true) {
        return null;
      }
      return current;
    } catch (e) {
      return null;
    }
  } catch (e) {
    return null;
  }
}
export {
  safeGetTabsRefCurrent
};
