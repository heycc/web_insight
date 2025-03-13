import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Static extension name
const EXTENSION_NAME = 'Plify';

/**
 * Creates a logger function with consistent formatting for the extension
 * @param contextName The specific context or site name (e.g., 'Reddit', 'YouTube')
 * @returns A logger function that formats messages consistently
 */
export function createLogger(contextName: string) {
  const prefix = `[${EXTENSION_NAME}][${contextName}]`;
  
  return {
    log: (message: string, ...args: any[]) => {
      console.log(`${prefix} ${message}`, ...args);
    },
    error: (message: string, ...args: any[]) => {
      console.error(`${prefix} ${message}`, ...args);
    },
    warn: (message: string, ...args: any[]) => {
      console.warn(`${prefix} ${message}`, ...args);
    },
    info: (message: string, ...args: any[]) => {
      console.info(`${prefix} ${message}`, ...args);
    },
    debug: (message: string, ...args: any[]) => {
      console.debug(`${prefix} ${message}`, ...args);
    }
  };
} 