function safeShowError(callbacks, message) {
  try {
    const isNull = callbacks === null;
    const isUndefined = callbacks === void 0;
    if (isNull === true) {
      return;
    }
    if (isUndefined === true) {
      return;
    }
    const showErrorIsNull = callbacks.showError === null;
    const showErrorIsUndefined = callbacks.showError === void 0;
    if (showErrorIsNull === true) {
      return;
    }
    if (showErrorIsUndefined === true) {
      return;
    }
    const typeCheck = typeof callbacks.showError;
    const isFunctionType = typeCheck === "function";
    if (isFunctionType === false) {
      return;
    }
    try {
      callbacks.showError(message);
    } catch (e) {
    }
  } catch (e) {
  }
}
function safeShowSuccess(callbacks, message) {
  try {
    const isNull = callbacks === null;
    const isUndefined = callbacks === void 0;
    if (isNull === true) {
      return;
    }
    if (isUndefined === true) {
      return;
    }
    const showSuccessIsNull = callbacks.showSuccess === null;
    const showSuccessIsUndefined = callbacks.showSuccess === void 0;
    if (showSuccessIsNull === true) {
      return;
    }
    if (showSuccessIsUndefined === true) {
      return;
    }
    const typeCheck = typeof callbacks.showSuccess;
    const isFunctionType = typeCheck === "function";
    if (isFunctionType === false) {
      return;
    }
    try {
      callbacks.showSuccess(message);
    } catch (e) {
    }
  } catch (e) {
  }
}
function safeOnComplete(callbacks) {
  try {
    const isNull = callbacks === null;
    const isUndefined = callbacks === void 0;
    if (isNull === true) {
      return;
    }
    if (isUndefined === true) {
      return;
    }
    const onCompleteIsNull = callbacks.onComplete === null;
    const onCompleteIsUndefined = callbacks.onComplete === void 0;
    if (onCompleteIsNull === true) {
      return;
    }
    if (onCompleteIsUndefined === true) {
      return;
    }
    const typeCheck = typeof callbacks.onComplete;
    const isFunctionType = typeCheck === "function";
    if (isFunctionType === false) {
      return;
    }
    try {
      callbacks.onComplete?.();
    } catch (e) {
    }
  } catch (e) {
  }
}
export {
  safeOnComplete,
  safeShowError,
  safeShowSuccess
};
