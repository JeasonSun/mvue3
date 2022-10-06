import { isObject } from "@mvue/shared";
import {
  mutableHandlers,
  readonlyHandlers,
  shallowReactiveHandlers,
  shallowReadonlyHandlers,
} from "./baseHandlers";

export const reactiveMap = new WeakMap();
export const readonlyMap = new WeakMap();

export const enum ReactiveFlags {
  SKIP = "__v_skip",
  IS_REACTIVE = "__v_isReactive",
  IS_READONLY = "__v_isReadonly",
  IS_SHALLOW = "__v_isShallow",
  RAW = "__v_raw",
}

export interface Target {
  [ReactiveFlags.SKIP]?: boolean;
  [ReactiveFlags.IS_REACTIVE]?: boolean;
  [ReactiveFlags.IS_READONLY]?: boolean;
  [ReactiveFlags.IS_SHALLOW]?: boolean;
  [ReactiveFlags.RAW]?: any;
}

export function reactive(target: object) {
  return createReactiveObject(target, false, mutableHandlers);
}

export function shallowReactive(target: object) {
  return createReactiveObject(target, false, shallowReactiveHandlers);
}

export function readonly(target: object) {
  return createReactiveObject(target, true, readonlyHandlers);
}

export function shallowReadonly(target: object) {
  return createReactiveObject(target, true, shallowReadonlyHandlers);
}

function createReactiveObject(
  target: object,
  isReadonly: boolean,
  baseHandlers: any
) {
  if (!isObject(target)) {
    return target;
  }

  const proxyMap = isReadonly ? readonlyMap : reactiveMap;

  const existingProxy = proxyMap.get(target);

  if (existingProxy) {
    return existingProxy;
  }

  const proxy = new Proxy(target, baseHandlers);

  return proxy;
}

export function isReactive(value: unknown): boolean {
  return !!(value && (value as Target)[ReactiveFlags.IS_REACTIVE]);
}

export const toReactive = <T extends any>(value: T): T =>
  isObject(value) ? reactive(value as object) : value;

// TODO: toRaw
// export function toRaw<T>(observed: T): T{
//   // const raw = observed &&

// }
