import { createRenderer } from "@mvue/runtime-core";
import { extend } from "@mvue/shared";
import { nodeOps } from "./nodeOps";
import { patchProp } from "./patchProp";

const rendererOptions = extend({ patchProp }, nodeOps);

export const createApp = (rootComponent: any, rootProps: any) => {
  const app = createRenderer(rendererOptions).createApp(
    rootComponent,
    rootProps
  );
  const { mount } = app;
  app.mount = (container: any) => {
    // 清空container
    container = nodeOps.querySelector(container);
    container.innerHTML = "";
    mount(container);
  };
  return app;
};

export * from "@mvue/runtime-core";
