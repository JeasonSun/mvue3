import { ReactiveEffect } from "@mvue/reactivity";
import { ShapeFlags } from "@mvue/shared";
import { createAppAPI } from "./apiCreateApp";
import { createComponentInstance, setupComponent } from "./component";
import { normalizeVNode } from "./vnode";

export function createRenderer(rendererOptions: any) {
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
        console.log('patch函数：', subTree, container)
        patch(null, subTree, container);
        instance.isMounted = true;
      }
    };

    // 下面等价于直接调用 const update = effect(fn, {scheduler: xx})
    // 在Vue 3.2 中才改用了 new ReactiveEffect 底层API，原因是在源码中 需要处理 effect scope 逻辑， 暂时不用。
    const effect = (instance.effect = new ReactiveEffect(
      componentUpdateFn,
      () => {
        console.log(" render scheduler");
      }
    ));

    const update = (instance.update = effect.run.bind(effect));

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

  function processElement(n1: any, n2: any, container: any) {
    throw new Error("Function not implemented.");
  }

  function patch(n1, n2, container) {
    const { shapeFlag } = n2;
    if (shapeFlag & ShapeFlags.ELEMENT) {
      processElement(n1, n2, container);
    } else if (shapeFlag & ShapeFlags.COMPONENT) {
      processComponent(n1, n2, container);
    }
  }

  const render = (vnode: any, container: any) => {
    patch(null, vnode, container);
  };

  return {
    createApp: createAppAPI(render),
  };
}
