import {
  isArray,
  isFunction,
  isObject,
  isString,
  ShapeFlags,
} from "@mvue/shared";

export const Text = Symbol("Text");
export const Comment = Symbol("Comment");
export const Fragment = Symbol("Fragment");

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
  vnode.shapeFlag |= type;
}

// 标准化 vnode 的格式
// 目的是为了让 child 支持多种格式
export function normalizeVNode(child) {
  // 暂时只支持处理 child 为 string 和 number 的情况
  if (child == null || typeof child === "boolean") {
    return createVNode(Comment);
  } else if (isArray(child)) {
    return createVNode(Fragment, null, child.slice());
  } else if (typeof child === "object") {
    return child;
  } else {
    return createVNode(Text, null, String(child));
  }
}

export function isVNode(value) {
  return value ? value.__v_isVNode === true : false;
}
