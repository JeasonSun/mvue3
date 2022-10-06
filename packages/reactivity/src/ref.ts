import { hasChanged } from "@mvue/shared";
import { createDep, Dep } from "./dep";
import { isTracking, trackEffects, triggerEffects } from "./effect";
import { toReactive } from "./reactive";

declare const RefSymbol: unique symbol;

export interface Ref<T = any> {
  value: T;
  [RefSymbol]: true;
}

export function ref(value: any) {
  return createRef(value, false);
}

export function shallowRef(value: any) {
  return createRef(value, true);
}

function createRef(rawValue: any, shallow: boolean) {
  return new RefImpl(rawValue, shallow);
}

class RefImpl<T> {
  private _value: T;
  private _rawValue: T;

  public dep?: Dep = undefined;
  public readonly __v_isRef = true;
  constructor(value: T, public readonly __v_isShallow: boolean) {
    this._value = __v_isShallow ? value : toReactive(value);
    this._rawValue = value;
  }

  get value() {
    // 收集依赖
    trackRefValue(this);
    return this._value;
  }

  set value(newVal) {
    // newVal = this.__v_isShallow ? newVal: toRaw(newVal);
    if (hasChanged(newVal, this._rawValue)) {
      this._rawValue = newVal;
      this._value = this.__v_isShallow ? newVal : toReactive(newVal);
      // 触发更新
      triggerRefValue(this, newVal);
    }
  }
}

type RefBase<T> = {
  dep?: Dep;
  value: T;
};
export function trackRefValue(ref: RefBase<any>) {
  if (isTracking()) {
    // TODO: toRaw  ref
    // ref = toRaw(ref)
    trackEffects(ref.dep || (ref.dep = createDep()));
  }
}

export function triggerRefValue(ref: RefBase<any>, newVal?: any) {
  // TODO: toRaw  ref
  // ref = toRaw(ref)
  if (ref.dep) {
    triggerEffects(ref.dep);
  }
}

const shallowUnwrapHandlers: ProxyHandler<any> = {
  get(target, key, receiver) {
    // 如果是一个 ref 类型， 那么返回 .value
    // 否则返回 value
    return unRef(Reflect.get(target, key, receiver));
  },

  set(target, key, value, receiver) {
    const oldValue = target[key];
    if (isRef(oldValue) && !isRef(value)) {
      // 原来的是
      oldValue.value = value;
      return true;
    }
    return Reflect.set(target, key, value, receiver);
  },
};

export function proxyRefs(objectWithRefs: any) {
  return new Proxy(objectWithRefs, shallowUnwrapHandlers);
}

export function unRef(ref: any) {
  return isRef(ref) ? ref.value : ref;
}

export function isRef(value: any) {
  return !!value.__v_isRef;
}
