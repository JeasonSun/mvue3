import {
  isArray,
  isFunction,
  isObject,
  isString,
  ShapeFlags,
} from "@mvue/shared";

export function createVNode(
  type: any,
  props: any = null,
  children: unknown = null
) {
  // 给虚拟节点添加一个类型标识
  const shapeFlag = isString(type)
    ? ShapeFlags.ELEMENT
    : isObject(type)
    ? ShapeFlags.STATEFUL_COMPONENT
    : isFunction(type)
    ? ShapeFlags.FUNCTIONAL_COMPONENT
    : 0;

  const vnode = {
    __v_isVNode: true,
    type,
    props,
    key: props && props.key,
    children,
    component: null, // 存放组件对应的实例
    el: null,
    shapeFlag,
  };

  if (children) {
    normalizeChildren(vnode, children);
  }

  return vnode;
}

function normalizeChildren(vnode: any, children: any) {
  let type = 0;
  if (isArray(children)) {
    type = ShapeFlags.ARRAY_CHILDREN;
  } else {
    type = ShapeFlags.TEXT_CHILDREN;
  }
  vnode.ShapeFlags |= type;
}
