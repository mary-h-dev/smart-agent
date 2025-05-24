export interface RetryOptions {
    maxAttempts?: number;
    delay?: number;
    exponentialBackoff?: boolean;
    onRetry?: (error: Error, attempt: number) => void;
  }
  
  export async function retry<T>(
    fn: () => Promise<T>,
    options: RetryOptions = {},
  ): Promise<T> {
    const {
      maxAttempts = 3,
      delay = 1000,
      exponentialBackoff = true,
      onRetry,
    } = options;
  
    let lastError: Error;
  
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error as Error;
        
        if (attempt === maxAttempts) {
          throw lastError;
        }
  
        if (onRetry) {
          onRetry(lastError, attempt);
        }
  
        const waitTime = exponentialBackoff
          ? delay * Math.pow(2, attempt - 1)
          : delay;
        
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }
  
    throw lastError!;
  }