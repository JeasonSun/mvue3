import { ShapeFlags } from "@mvue/shared";
import { createAppAPI } from "./apiCreateApp";
import { createComponentInstance, setupComponent } from "./component";

export function createRenderer(rendererOptions: any) {
  function mountComponent(initialVNode, container) {
    // 1. 创建组件实例
    const instance = (initialVNode.component =
      createComponentInstance(initialVNode));

    // 2. 解析数据到实例上
    setupComponent(instance);

    // 3. 创建effect，执行render函数
    instance.render();
    console.log('[TODO] setupRenderEffect')
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
