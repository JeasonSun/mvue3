import { ShapeFlags, isFunction, isObject, EMPTY_OBJ } from "@mvue/shared";
import { proxyRefs } from "@mvue/reactivity";
import { initProps } from "./componentProps";
import { initSlots } from "./componentSlots";
import { PublicInstanceProxyHandlers } from "./componentPublicInstance";

export function createComponentInstance(vnode) {
  const type = vnode.type;

  const instance = {
    vnode,
    type,
    props: {},
    attrs: {},
    slots: {},
    ctx: {},
    data: {},
    setupState: EMPTY_OBJ,
    render: null,
    subTree: null,
    isMounted: false,
  };

  // 在 prod 环境下， ctx 只是下面简单的结构
  // 在 dev 环境下，会更复杂
  instance.ctx = { _: instance };

  return instance;
}

export function setupComponent(instance) {
  const { props, children } = instance.vnode;
  const isStateful = isStatefulComponent(instance);
  // 1. 处理 props
  initProps(instance, props);
  // 2. 处理 slots
  initSlots(instance, children);

  // 如果是stateful component ，尝试取一下setup的返回
  const setupResult = isStateful ? setupStatefulComponent(instance) : undefined;

  return setupResult;
}
function isStatefulComponent(instance: any) {
  return instance.vnode.shapeFlag & ShapeFlags.STATEFUL_COMPONENT;
}

function setupStatefulComponent(instance) {
  // 1. 代理，传递给 render 函数的参数
  // 创建 render 函数的 proxy
  instance.proxy = new Proxy(instance.ctx, PublicInstanceProxyHandlers);
  console.log("创建 render 函数的 proxy");

  // 2. 获取组件的类型， 拿到组件的setup方法
  const Component = instance.type;
  const { setup } = Component;
  if (setup) {
    const setupContext = createSetupContext(instance);
    const setupResult = setup(instance.props, setupContext);

    handleSetupResult(instance, setupResult);
  } else {
    finishComponentSetup(instance);
  }
}

function createSetupContext(instance) {
  console.log("[TODO]  setup context");
  return {
    attrs: instance.attrs,
    slots: instance.slots,
    emit: instance.emit,
    expose: () => {},
  };
}

function handleSetupResult(instance, setupResult) {
  // 1. 看看 setupResult 是什么
  if (isFunction(setupResult)) {
    instance.render = setupResult;
  } else if (isObject(setupResult)) {
    // 返回的是一个对象
    // 存储到 setupState 上面
    // 使用 proxyRefs
    // proxyRefs 的作用是把 setupResult 对象做一层代理， 方便用户直接访问 ref 类型的值。
    instance.setupState = proxyRefs(setupResult);
  }

  finishComponentSetup(instance);
}

function finishComponentSetup(instance) {
  // 给 instance 设置 render

  const Component = instance.type;
  if (!instance.render) {
    // 如果有编译函数，并且Component上面没有render函数，
    // 尝试将 template 编译成 render 函数。
    if (compile && !Component.render) {
      if (Component.template) {
        const template = Component.template;
        Component.render = compile(template);
      }
    }
    instance.render = Component.render;
  }
}

let compile;
