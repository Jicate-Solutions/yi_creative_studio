/**
 * Next.js Instrumentation Hook
 * Filters console warnings to suppress repetitive source map parsing errors
 *
 * This runs once when the Next.js server starts and applies to all subsequent logs
 */

export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    // Store original console methods
    const originalWarn = console.warn;
    const originalError = console.error;

    // Filter source map warnings
    console.warn = function (...args: any[]) {
      const message = args[0]?.toString() || '';

      // Suppress source map related warnings
      if (
        message.includes('Invalid source map') ||
        message.includes('sourceMapURL') ||
        message.includes('source map') ||
        message.includes('SourceMap')
      ) {
        return; // Suppress this warning
      }

      // Pass through all other warnings
      originalWarn.apply(console, args);
    };

    // Optional: Also filter errors if needed (usually we want to keep errors)
    console.error = function (...args: any[]) {
      const message = args[0]?.toString() || '';

      // Only suppress source map errors, keep all other errors
      if (
        message.includes('Invalid source map') ||
        message.includes('sourceMapURL could not be parsed')
      ) {
        return; // Suppress
      }

      // Pass through all other errors
      originalError.apply(console, args);
    };

    console.log('[Instrumentation] Source map warning filter initialized');
  }
}
