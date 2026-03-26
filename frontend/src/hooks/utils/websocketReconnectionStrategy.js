function _define_property(obj, key, value) {
    if (key in obj) {
        Object.defineProperty(obj, key, {
            value: value,
            enumerable: true,
            configurable: true,
            writable: true
        });
    } else {
        obj[key] = value;
    }
    return obj;
}
/**
 * WebSocket Reconnection Strategy
 * Strategy pattern for reconnection logic to follow Open/Closed Principle
 * Allows extensibility for different reconnection strategies
 */ import { WS_RECONNECT } from './websocketConstants';
/**
 * Exponential backoff reconnection strategy
 * Default strategy with exponential delay increase
 */ export class ExponentialBackoffStrategy {
    /**
   * Calculate exponential backoff delay
   * Formula: baseDelay * 2^(attempt-1)
   * Capped at maxDelay to prevent excessive delays
   */ calculateDelay(attempt, baseDelay) {
        // Guard: Ensure attempt is valid
        if (attempt < 1) {
            return baseDelay;
        }
        // Calculate exponential delay: baseDelay * 2^(attempt-1)
        const exponentialDelay = baseDelay * Math.pow(2, attempt - 1);
        // Cap at maximum delay to prevent timeout mutations
        const maxDelay = WS_RECONNECT.MAX_DELAY;
        if (exponentialDelay > maxDelay) {
            return maxDelay;
        }
        // Ensure minimum delay
        if (exponentialDelay < WS_RECONNECT.MIN_DELAY) {
            return WS_RECONNECT.MIN_DELAY;
        }
        return exponentialDelay;
    }
    /**
   * Check if should reconnect based on attempt count
   * Mutation-resistant: explicit comparison
   */ shouldReconnect(attempt, maxAttempts) {
        // Guard: Ensure valid inputs
        if (attempt < 0) {
            return false;
        }
        if (maxAttempts < 1) {
            return false;
        }
        // Explicit comparison to prevent mutation survivors
        return attempt < maxAttempts;
    }
}
/**
 * Linear backoff reconnection strategy
 * Alternative strategy with linear delay increase
 */ export class LinearBackoffStrategy {
    /**
   * Calculate linear backoff delay
   * Formula: baseDelay * attempt
   */ calculateDelay(attempt, baseDelay) {
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
/**
 * Fixed delay reconnection strategy
 * Alternative strategy with constant delay
 */ export class FixedDelayStrategy {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    calculateDelay(_attempt, _baseDelay) {
        // Use fixed delay, ignore attempt and baseDelay (prefixed with _ to indicate intentionally unused)
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
    constructor(fixedDelay = WS_RECONNECT.BASE_DELAY){
        _define_property(this, "fixedDelay", void 0);
        this.fixedDelay = fixedDelay;
    }
}
