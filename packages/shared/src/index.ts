export const isObject = (val: unknown) =>
  val !== null && typeof val === "object";

export const isArray = Array.isArray;

export const isFunction = (val: unknown): val is Function =>
  typeof val === "function";

export const isString = (val: unknown): val is String =>
  typeof val === "string";

export const hasChanged = (value: any, oldValue: any): boolean =>
  !Object.is(value, oldValue);

export const extend = Object.assign;
export const NOOP = () => {};

const onReg = /^on[^a-z]/;
export const isOn = (key: string) => onReg.test(key);

export * from "./shapeFlag";
