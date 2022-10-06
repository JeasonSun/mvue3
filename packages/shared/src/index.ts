export const isObject = (val: unknown) =>
  val !== null && typeof val === "object";

export const isArray = Array.isArray;

export const extend = Object.assign;

export const isFunction = (val: unknown): val is Function =>
  typeof val === "function";

export const hasChanged = (value: any, oldValue: any): boolean =>
  !Object.is(value, oldValue);

export const NOOP = () => {};
