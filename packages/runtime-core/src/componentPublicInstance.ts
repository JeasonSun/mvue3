import { EMPTY_OBJ, hasOwn } from "@mvue/shared";

const publicPropertiesMap = {
  $el: (i) => i.vnode.el,
  $emit: (i) => i.emit,
  $slots: (i) => i.slots,
  $props: (i) => i.props,
};

export const PublicInstanceProxyHandlers = {
  get({ _: instance }, key) {
    // 用户返回 proxy[key]
    const { setupState, props, data } = instance;
    console.log(`触发 proxy hook , key -> ${key}`);

    if (key[0] !== "$") {
      // 说明不是访问的public api
      if (hasOwn(setupState, key)) {
        return setupState[key];
      } else if (hasOwn(props, key)) {
        return props[key];
      } else if (hasOwn(data, key)) {
        return data[key];
      }
    }

    // 处理一个public API
    const publicGetter = publicPropertiesMap[key];
    if (publicGetter) {
      return publicGetter(instance);
    }
  },
  set({ _: instance }, key, value) {
    const { setupState } = instance;
    if (setupState !== EMPTY_OBJ && hasOwn(setupState, key)) {
      setupState[key] = value;
      return true;
    }
    // 也应该和get一样，处理一下 props , data 等
  },
};
