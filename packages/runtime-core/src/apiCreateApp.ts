import { createVNode } from "./vnode";

export function createAppAPI(render: any) {
  return function createApp(rootComponent: any, rootProps: any = null) {
    const app = {
      _props: rootProps,
      _component: rootComponent,
      _container: null,
      mount(container: any) {
        console.log("将rootComponent转化成vnode", rootComponent, rootProps);
        // 1. rootComponent -> vnode;
        const vnode = createVNode(rootComponent, rootProps);
        // 2. render
        render(vnode, container);
        app._container = container;
      },
    };
    return app;
  };
}
