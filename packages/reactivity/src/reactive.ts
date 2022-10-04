import { isObject } from "@mvue/shared";
import {
  mutableHandlers,
  readonlyHandlers,
  shallowReactiveHandlers,
  shallowReadonlyHandlers,
} from "./baseHandlers";

export const reactiveMap = new WeakMap();
export const readonlyMap = new WeakMap();

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
