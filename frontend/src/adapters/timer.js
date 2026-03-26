/**
 * Timer Adapter Factory
 * Follows Single Responsibility Principle - only handles timer adapter creation
 */ /**
 * Timer Adapter Factory
 * Provides factory methods for creating timer adapters
 */ export const TimerAdapterFactory = {
    /**
   * Create default timer adapter
   */ createTimerAdapter () {
        return {
            setTimeout: (callback, delay)=>{
                return setTimeout(callback, delay);
            },
            clearTimeout: (id)=>clearTimeout(id),
            setInterval: (callback, delay)=>{
                return setInterval(callback, delay);
            },
            clearInterval: (id)=>clearInterval(id)
        };
    }
};
