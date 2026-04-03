import { WS_RECONNECT } from "./websocketConstants";
class ExponentialBackoffStrategy {
  /**
   * Calculate exponential backoff delay
   * Formula: baseDelay * 2^(attempt-1)
   * Capped at maxDelay to prevent excessive delays
   */
  calculateDelay(attempt, baseDelay) {
    if (attempt < 1) {
      return baseDelay;
    }
    const exponentialDelay = baseDelay * Math.pow(2, attempt - 1);
    const maxDelay = WS_RECONNECT.MAX_DELAY;
    if (exponentialDelay > maxDelay) {
      return maxDelay;
    }
    if (exponentialDelay < WS_RECONNECT.MIN_DELAY) {
      return WS_RECONNECT.MIN_DELAY;
    }
    return exponentialDelay;
  }
  /**
   * Check if should reconnect based on attempt count
   * Mutation-resistant: explicit comparison
   */
  shouldReconnect(attempt, maxAttempts) {
    if (attempt < 0) {
      return false;
    }
    if (maxAttempts < 1) {
      return false;
    }
    return attempt < maxAttempts;
  }
}
class LinearBackoffStrategy {
  /**
   * Calculate linear backoff delay
   * Formula: baseDelay * attempt
   */
  calculateDelay(attempt, baseDelay) {
    if (attempt < 1) {
      return baseDelay;
    }
    const linearDelay = baseDelay * attempt;
    const maxDelay = WS_RECONNECT.MAX_DELAY;
    if (linearDelay > maxDelay) {
      return maxDelay;
    }
    if (linearDelay < WS_RECONNECT.MIN_DELAY) {
      return WS_RECONNECT.MIN_DELAY;
    }
    return linearDelay;
  }
  shouldReconnect(attempt, maxAttempts) {
    if (attempt < 0) {
      return false;
    }
    if (maxAttempts < 1) {
      return false;
    }
    return attempt < maxAttempts;
  }
}
class FixedDelayStrategy {
  constructor(fixedDelay = WS_RECONNECT.BASE_DELAY) {
    this.fixedDelay = fixedDelay;
  }

  calculateDelay(_attempt, _baseDelay) {
    if (this.fixedDelay < WS_RECONNECT.MIN_DELAY) {
      return WS_RECONNECT.MIN_DELAY;
    }
    if (this.fixedDelay > WS_RECONNECT.MAX_DELAY) {
      return WS_RECONNECT.MAX_DELAY;
    }
    return this.fixedDelay;
  }
  shouldReconnect(attempt, maxAttempts) {
    if (attempt < 0) {
      return false;
    }
    if (maxAttempts < 1) {
      return false;
    }
    return attempt < maxAttempts;
  }
}
export {
  ExponentialBackoffStrategy,
  FixedDelayStrategy,
  LinearBackoffStrategy,
};
