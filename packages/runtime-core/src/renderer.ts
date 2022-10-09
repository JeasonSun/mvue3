import { ReactiveEffect } from "@mvue/reactivity";
import { ShapeFlags } from "@mvue/shared";
import { createAppAPI } from "./apiCreateApp";
import { createComponentInstance, setupComponent } from "./component";
import { queueJob } from "./scheduler";
import { normalizeVNode, Text } from "./vnode";

export function createRenderer(rendererOptions: any) {
  const {
    insert: hostInsert,
    remove: hostRemove,
    patchProp: hostPatchProp,
    createElement: hostCreateElement,
    createText: hostCreateText,
    setElementText: hostSetElementText,
  } = rendererOptions;
  function mountComponent(initialVNode, container) {
    // 1. 创建组件实例
    const instance = (initialVNode.component =
      createComponentInstance(initialVNode));

    // 2. 解析数据到实例上
    setupComponent(instance);

    // 3. 创建effect，执行render函数
    console.log("setupRenderEffect");
    setupRenderEffect(instance, initialVNode, container);
  }

  function setupRenderEffect(instance, initialVNode, container) {
    const componentUpdateFn = () => {
      if (!instance.isMounted) {
        // 组件初始化
        console.log(`${instance.type.name}: 调用 render， 生成subTree`);
        const proxyToUse = instance.proxy;
        let subTree = (instance.subTree = normalizeVNode(
          instance.render.call(proxyToUse, proxyToUse)
        ));

        // 用 render 函数的返回值， 继续渲染
        console.log("patch函数：", subTree, container);
        patch(null, subTree, container);
        instance.isMounted = true;
      } else {
        console.log('TODO: update Component')
      }
    };

    // 下面等价于直接调用 const update = effect(fn, {scheduler: xx})
    // 在Vue 3.2 中才改用了 new ReactiveEffect 底层API，原因是在源码中 需要处理 effect scope 逻辑， 暂时不用。
    const effect = (instance.effect = new ReactiveEffect(
      componentUpdateFn,
      () => queueJob(instance.update)
    ));

    const update = (instance.update = effect.run.bind(effect));

    update.id = instance.uid;

    update();
  }

  function updateComponent(n1: any, n2: any) {
    throw new Error("Function not implemented.");
  }

  function processComponent(n1: any, n2: any, container: any) {
    if (n1 == null) {
      mountComponent(n2, container);
    } else {
      updateComponent(n1, n2);
    }
  }

  function mountChildren(children, container) {
    children.forEach((child) => {
      const VNodeChild = normalizeVNode(child);
      console.log("mountChildren:", VNodeChild);
      patch(null, VNodeChild, container);
    });
  }

  function mountElement(vnode: any, container: any) {
    const { shapeFlag, props } = vnode;
    // 1. 创建 element
    const el = (vnode.el = hostCreateElement(vnode.type));

    if (props) {
      for (const key in props) {
        hostPatchProp(el, key, null, props[key]);
      }
    }

    // 支持单儿子组件和多儿子组件的创建
    if (shapeFlag & ShapeFlags.TEXT_CHILDREN) {
      hostSetElementText(el, vnode.children);
    } else if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
      mountChildren(vnode.children, el);
    }

    // TODO: 触发钩子
    console.log("vnodeHook -> onVnodeBeforeMount");
    console.log("DirectiveHook -> beforeMount");
    console.log("transition -> beforeEnter");

    console.log("插入", el, container);
    // 插入
    hostInsert(el, container);
  }

  function updateElement(n1: any, n2: any, container: any) {
    throw new Error("Function not implemented.");
  }

  function processElement(n1: any, n2: any, container: any) {
    if (n1 == null) {
      mountElement(n2, container);
    } else {
      updateElement(n1, n2, container);
    }
  }

  function processText(n1: any, n2: any, container: any) {
    if (n1 == null) {
      // child 是一个文本， 直接插入即可
      hostInsert((n2.el = hostCreateText(n2.children)), container);
    } else {
    }
  }

  function patch(n1, n2, container) {
    const { shapeFlag, type } = n2;
    console.log(type);
    switch (type) {
      case Text:
        processText(n1, n2, container);
        break;

      default:
        if (shapeFlag & ShapeFlags.ELEMENT) {
          processElement(n1, n2, container);
        } else if (shapeFlag & ShapeFlags.COMPONENT) {
          processComponent(n1, n2, container);
        }
        break;
    }
  }

  const render = (vnode: any, container: any) => {
    patch(null, vnode, container);
  };

  return {
    createApp: createAppAPI(render),
  };
}
