const TimerAdapterFactory = {
  /**
   * Create default timer adapter
   */
  createTimerAdapter() {
    return {
      setTimeout: ((callback, delay) => {
        return setTimeout(callback, delay);
      }),
      clearTimeout: (id) => clearTimeout(id),
      setInterval: ((callback, delay) => {
        return setInterval(callback, delay);
      }),
      clearInterval: (id) => clearInterval(id)
    };
  }
};
export {
  TimerAdapterFactory
};
