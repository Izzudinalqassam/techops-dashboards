/**
 * Utility functions for validating and ensuring array types
 */

/**
 * Ensures a value is an array, returning an empty array if it's not
 * @param value - The value to validate
 * @returns An array (either the original if it was an array, or an empty array)
 */
export const ensureArray = <T>(value: any): T[] => {
  return Array.isArray(value) ? value : [];
};

/**
 * Validates that a property on an object is an array
 * @param obj - The object to check
 * @param property - The property name to validate
 * @returns An array (either the original property if it was an array, or an empty array)
 */
export const ensureArrayProperty = <T>(obj: any, property: string): T[] => {
  return obj && Array.isArray(obj[property]) ? obj[property] : [];
};

/**
 * Type guard to check if a value is an array
 * @param value - The value to check
 * @returns True if the value is an array, false otherwise
 */
export const isArray = (value: any): value is any[] => {
  return Array.isArray(value);
};

/**
 * Safely finds an item in an array-like property
 * @param obj - The object containing the array property
 * @param property - The property name that should contain an array
 * @param predicate - The function to find the item
 * @returns The found item or undefined
 */
export const safeFindInProperty = <T>(
  obj: any,
  property: string,
  predicate: (item: T) => boolean
): T | undefined => {
  const array = ensureArrayProperty<T>(obj, property);
  return array.find(predicate);
};