import { extend } from "@mvue/shared";
import { createDep, Dep } from "./dep";
import { TrackOpTypes, TriggerOpTypes } from "./operations";

export type EffectScheduler = (...args: any[]) => any;
export interface ReactiveEffectRunner<T = any> {
  (): T;
  effect: ReactiveEffect;
}

export interface ReactiveEffectOptions {
  lazy?: boolean;
  scheduler?: EffectScheduler;
  onStop?: () => void;
}
export function effect<T = any>(
  fn: () => T,
  options: ReactiveEffectOptions = {}
): ReactiveEffectRunner {
  const _effect = new ReactiveEffect(fn);

  extend(_effect, options);
  if (!options || !options.lazy) {
    _effect.run();
  }

  const runner = _effect.run.bind(_effect) as ReactiveEffectRunner;
  runner.effect = _effect;

  return runner;
}

let shouldTrack = false;
let activeEffect: ReactiveEffect | undefined;
let targetMap = new WeakMap();

export class ReactiveEffect<T = any> {
  active: boolean = true;
  deps: Dep[] = [];
  public onStop?: () => void;
  constructor(
    public fn: () => T,
    public scheduler: EffectScheduler | null = null
  ) {
    // console.log("创建ReactiveEffect对象");
  }

  run() {
    if (!this.active) {
      return this.fn();
    }

    shouldTrack = true;

    activeEffect = this;

    const result = this.fn();

    // 重置
    shouldTrack = false;
    activeEffect = undefined;

    return result;
  }

  stop() {
    if (this.active) {
      cleanupEffect(this);
      if (this.onStop) {
        this.onStop();
      }
      this.active = false;
    }
  }
}

export function track(target: object, type: TrackOpTypes, key: unknown) {
  if (!isTracking()) {
    return;
  }
  let depsMap = targetMap.get(target);
  if (!depsMap) {
    targetMap.set(target, (depsMap = new Map()));
  }
  let dep = depsMap.get(key);
  if (!dep) {
    depsMap.set(key, (dep = createDep()));
  }
  trackEffects(dep);
}

export function isTracking() {
  return shouldTrack && activeEffect !== undefined;
}

export function trackEffects(dep: any) {
  if (!dep.has(activeEffect)) {
    dep.add(activeEffect);
    activeEffect!.deps.push(dep);
  }
}

export function trigger(target: object, type: TriggerOpTypes, key: unknown) {
  // 先收集所有的 dep 放到 deps 里面，
  // 后面会统一处理
  // 对于 array.length 的操作等一些特殊情况需要做hack处理
  // TODO: 暂时先只考虑 get

  let deps: any[] = [];

  const depsMap = targetMap.get(target);
  if (!depsMap) {
    return;
  }

  const dep = depsMap.get(key);

  deps.push(dep);

  const effects: ReactiveEffect[] = [];
  for (const dep of deps) {
    if (dep) {
      effects.push(...dep);
    }
  }
  triggerEffects(createDep(effects));
}

export function triggerEffects(dep: Dep) {
  for (const effect of dep) {
    if (effect.scheduler) {
      effect.scheduler();
    } else {
      effect.run();
    }
  }
}
function cleanupEffect(effect: ReactiveEffect) {
  // 找到所有依赖这个 effect 的响应式对象
  // 从这些响应式对象里面把 effect 给删除掉
  effect.deps.forEach((dep) => {
    dep.delete(effect);
  });

  effect.deps.length = 0;
}

export function stop(runner: any) {
  runner.effect.stop();
}
