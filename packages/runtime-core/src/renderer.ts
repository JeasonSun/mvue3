import { createAppAPI } from "./apiCreateApp";

export function createRenderer(rendererOptions: any) {
  const render = (vnode: any, container: any) => {
    // 渲染的主要逻辑，进行patch算法
    console.log("通过patch算法，将vnode挂载到container上", vnode, container);
  };

  return {
    createApp: createAppAPI(render),
  };
}
