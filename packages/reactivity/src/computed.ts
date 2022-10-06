import { ReactiveEffect } from "./effect";
import { isFunction, NOOP } from "@mvue/shared";
import { ReactiveFlags } from "./reactive";
import { trackRefValue, triggerRefValue } from "./ref";

export type ComputedGetter<T> = (...args: any[]) => T;
export type ComputedSetter<T> = (v: T) => void;

export interface WriteableComputedOptions<T> {
  get: ComputedGetter<T>;
  set: ComputedSetter<T>;
}

export function computed<T>(
  getterOrOptions: ComputedGetter<T> | WriteableComputedOptions<T>
) {
  let getter: ComputedGetter<T>;
  let setter: ComputedSetter<T>;

  const onlyGetter = isFunction(getterOrOptions);

  if (onlyGetter) {
    getter = getterOrOptions;
    setter = NOOP;
  } else {
    getter = getterOrOptions.get;
    setter = getterOrOptions.set;
  }

  return new ComputedRefImpl(getter, setter, onlyGetter || !setter);
}

export class ComputedRefImpl<T> {
  private _value!: T;
  public readonly effect: ReactiveEffect<T>;
  public readonly __v_isRef = true;
  public readonly [ReactiveFlags.IS_READONLY]: boolean = true;
  public _dirty = true;

  constructor(
    getter: ComputedGetter<T>,
    private readonly _setter: ComputedSetter<T>,
    isReadonly: boolean
  ) {
    this.effect = new ReactiveEffect(getter, () => {
      if (!this._dirty) {
        this._dirty = true;
        triggerRefValue(this);
      }
    });

    this[ReactiveFlags.IS_READONLY] = isReadonly;
  }

  get value() {
    trackRefValue(this);
    if (this._dirty) {
      this._value = this.effect.run();
      this._dirty = false;
    }
    return this._value;
  }

  set value(newValue: T) {
    this._setter(newValue);
  }
}
