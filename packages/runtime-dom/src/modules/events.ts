type EventValue = Function;
interface Invoker extends EventListener {
  value: EventValue;
  // attached: number; // 源码中添加了一个attached标识
}

export function patchEvent(
  el: Element & { _vei?: Record<string, Invoker | undefined> },
  rawName: string,
  prevValue: EventValue | null,
  nextValue: EventValue | null
) {
  // vei = vue event invokers
  const invokers = el._vei || (el._vei = {});
  const existingInvoker = invokers[rawName];
  // 如果已经存在，直接修改value值
  if (nextValue && existingInvoker) {
    existingInvoker.value = nextValue;
  } else {
    const eventName = rawName.slice(2).toLocaleLowerCase();
    // 如果之前事件不存在， 新的存在，那么需要添加事件
    if (nextValue) {
      // 这边existingInvoker肯定为false
      // add
      const invoker = (invokers[rawName] = createInvoker(nextValue));
      el.addEventListener(eventName, invoker);
    } else if (existingInvoker) {
      el.removeEventListener(eventName, existingInvoker);
      invokers[rawName] = undefined;
    }
    // 如果新的事件不存在， 之前的事件存在， 那么需要删除事件，
  }
}

function createInvoker(initialValue: EventValue) {
  const invoker: Invoker = (e: Event) => {
    invoker.value && invoker.value(e);
  };
  invoker.value = initialValue;
  return invoker;
}
