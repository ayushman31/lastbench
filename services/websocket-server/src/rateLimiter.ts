import type { RateLimitConfig, ClientRateLimit } from './types.js';
  
  export class RateLimiter {
    private clients = new Map<string, ClientRateLimit>();
    private config: RateLimitConfig;
  
    constructor(config: RateLimitConfig = { windowMs: 1000, maxMessages: 10 }) {
      this.config = config;
    }
  
   // check if client is rate limited
    checkLimit(clientId: string): boolean {
      const now = Date.now();
      const limit = this.clients.get(clientId);
  
      if (!limit || now > limit.resetTime) {
        // new window
        this.clients.set(clientId, {
          count: 1,
          resetTime: now + this.config.windowMs,
        });
        return true;
      }
  
      if (limit.count >= this.config.maxMessages) {
        return false; // rate limited
      }
  
      limit.count++;
      return true;
    }
  
    // clean up expired entries
    cleanup(): void {
      const now = Date.now();
      for (const [clientId, limit] of this.clients.entries()) {
        if (now > limit.resetTime) {
          this.clients.delete(clientId);
        }
      }
    }
  }
  