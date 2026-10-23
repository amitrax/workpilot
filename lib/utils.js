import { clsx } from "clsx";

/**
 * Utility: merge class names conditionally
 */
export function cn(...inputs) {
  return clsx(inputs);
}
