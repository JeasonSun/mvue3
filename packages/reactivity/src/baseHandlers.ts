import { extend, isObject } from "@mvue/shared";
import { reactive, readonly } from "./reactive";
const get = createGetter();
const readonlyGet = createGetter(true);
const shallowGet = createGetter(false, true);
const shallowReadonlyGet = createGetter(true, true);

function createGetter(isReadonly = false, shallow = false) {
  return function get(target: object, key: string, receiver: object) {
    const res = Reflect.get(target, key, receiver);

    if (!isReadonly) {
      // TODO: track
    }
    if (shallow) {
      return res;
    }

    if (isObject(res)) {
      return isReadonly ? readonly(res) : reactive(res);
    }

    return res;
  };
}

const set = createSetter();
const shallowSet = createSetter(true);

function createSetter(shallow = false) {
  return function set(
    target: object,
    key: string,
    value: unknown,
    receiver: object
  ) {
    const result = Reflect.set(target, key, value, receiver);

    // TODO: trigger
    return result;
  };
}

export const mutableHandlers = {
  get,
  set,
};

export const readonlyHandlers = {
  get: readonlyGet,
  set(target: object, key: string) {
    console.warn(`Set operation on key "${key}" failed: target is readonly`);
    return true;
  },
};

export const shallowReactiveHandlers = extend({}, mutableHandlers, {
  get: shallowGet,
  set: shallowSet,
});

export const shallowReadonlyHandlers = extend({}, readonlyHandlers, {
  get: shallowReadonlyGet,
});
