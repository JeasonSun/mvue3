export const isObject = (val: unknown) =>
  val !== null && typeof val === "object";

export const isArray = Array.isArray;

export const isFunction = (val: unknown): val is Function =>
  typeof val === "function";

export const isString = (val: unknown): val is String =>
  typeof val === "string";

export const isNumber = (val: unknown): val is Number =>
  typeof val === "number";

export const hasChanged = (value: any, oldValue: any): boolean =>
  !Object.is(value, oldValue);

export const extend = Object.assign;
export const NOOP = () => {};
export const EMPTY_OBJ = {};

const onReg = /^on[^a-z]/;
export const isOn = (key: string) => onReg.test(key);

export function hasOwn(val, key) {
  return Object.prototype.hasOwnProperty.call(val, key);
}

export * from "./shapeFlag";
