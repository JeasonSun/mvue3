import { ReactiveEffect } from "@mvue/reactivity";
import { ShapeFlags } from "@mvue/shared";
import { createAppAPI } from "./apiCreateApp";
import { createComponentInstance, setupComponent } from "./component";
import { queueJob } from "./scheduler";
import { isSameVNodeType, normalizeVNode, Text } from "./vnode";

export function createRenderer(rendererOptions: any) {
  const {
    insert: hostInsert,
    remove: hostRemove,
    patchProp: hostPatchProp,
    createElement: hostCreateElement,
    createText: hostCreateText,
    setElementText: hostSetElementText,
    nextSibling: hostNextSibling,
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
        const proxyToUse = instance.proxy;

        const nextTree = normalizeVNode(
          instance.render.call(proxyToUse, proxyToUse)
        );

        const prevTree = instance.subTree;
        instance.subTree = nextTree;

        console.log(`${instance.type.name}: 触发 beforeUpdated hook`);
        console.log(`${instance.type.name}: 触发 onVnodeBeforeUpdate hook`);
        // TIP: container ? prevTree.el
        patch(prevTree, nextTree, container);

        // 触发 updated hook
        console.log(`${instance.type.name}:触发 Updated hook`);
        console.log(`${instance.type.name}:触发 onVnodeUpdated hook`);
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

  function mountElement(vnode: any, container: any, anchor = null) {
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
      console.log("ShapeFlags.TEXT_CHILDREN");
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
    hostInsert(el, container, anchor);
  }

  function unmountChildren(children) {
    for (let i = 0; i < children.length; i++) {
      unmount(children[i]);
    }
  }

  function patchKeyedChildren(c1, c2, container) {
    let i = 0;
    const l1 = c1.length;
    const l2 = c2.length;
    let e1 = l1 - 1;
    let e2 = l2 - 1;

    // 1. sync from start: 从前往后比，不同即退出
    // (a b) c
    // (a b) d e
    // i = 2, e1 = 2, e2 = 3
    while (i <= e1 && i <= e2) {
      const n1 = c1[i];
      const n2 = c2[i];
      if (isSameVNodeType(n1, n2)) {
        patch(n1, n2, container);
      } else {
        break;
      }
      i++;
    }
    console.log(`e1 => ${e1} ;  e2 => ${e2} ;  i => ${i}`);

    // 2. sync from end
    //   a (b c)
    // d e (b c)
    while (i <= e1 && i <= e2) {
      const n1 = c1[e1];
      const n2 = c2[e2];
      if (isSameVNodeType(n1, n2)) {
        patch(n1, n2, container);
      } else {
        break;
      }
      e1--;
      e2--;
    }
    console.log(`e1 => ${e1} ;  e2 => ${e2} ;  i => ${i}`);

    // 3. common sequence + mount
    // (a b)
    // (a b) c
    // i = 2, e1 = 1, e2 = 2

    // (a b)
    // (a b) c d
    // i = 2, e1 = 1, e2 = 3

    //   (a b)
    // c (a b)
    // i = 0, e1 = -1, e2 = 0

    //     (a b)
    // c d (a b)
    // i = 0, e1 = -1, e2 = 1
    if (i > e1) {
      if (i <= e2) {
        const nextPos = e2 + 1;
        const anchor = nextPos < l2 ? c2[nextPos].el : null;
        while (i <= e2) {
          patch(null, c2[i], container, anchor);
          i++;
        }
      }
    }

    // 4. common sequence + unmount
    // (a b) c
    // (a b)
    // i = 2 , e1 = 2, e2 = 1
    // a (b c)
    //   (b c)
    // i = 0, e1 = 0, e2 = -1
    // a b (c d)
    //     (c d)
    // i = 0, e1 = 1, e2 = -1
    else if (i > e2) {
      while (i <= e1) {
        unmount(c1[i]);
        i++;
      }
    }

    // 5. unknown sequence
    // a b [c d e] f g
    // a b [e d c h] f g
    // i = 2, e1 = 4, e2 = 5
    else {
      const s1 = i;
      const s2 = i;

      // 5.1 build key:index map for newChildren
      const keyToNewIndexMap = new Map();
      for (i = s2; i <= e2; i++) {
        const nextChild = c2[i];
        if (nextChild.key != null) {
          keyToNewIndexMap.set(nextChild.key, i);
        }
      }
      console.log("keyToNewIndexMap", keyToNewIndexMap);

      const toBePatched = e2 - s2 + 1;
      let patched = 0;
      let moved = false;
      let maxNewIndexSoFar = 0;
      const newIndexToOldIndexMap = new Array(toBePatched).fill(0);

      // 5.2 loop through old children left to be patched and try to patch
      // matching nodes & remove nodes that are no longer present
      // 就是去老的里面查找， 如果老的在新的中找不到了，直接删除
      // 如果能够找到，尝试patch
      // 并且记录新旧之间的索引关系：
      for (let i = s1; i <= e1; i++) {
        const prevChild = c1[i];
        // 如果 新 children 中元素都已经更新过了，那就直接停止
        if (patched >= toBePatched) {
          unmount(prevChild);
          continue;
        }

        let newIndex = keyToNewIndexMap.get(prevChild.key);
        if (newIndex === undefined) {
          unmount(prevChild);
        } else {
          newIndexToOldIndexMap[newIndex - s2] = i + 1;
          if (newIndex >= maxNewIndexSoFar) {
            maxNewIndexSoFar = newIndex;
          } else {
            moved = true;
          }
          patch(prevChild, c2[newIndex], container);
          patched++;
        }
      }

      // 5.3 move and mount
      let increasingNewIndexSequence = moved
        ? getSequence(newIndexToOldIndexMap)
        : [];
      let j = increasingNewIndexSequence.length - 1;

      for (i = toBePatched - 1; i >= 0; i--) {
        const nextIndex = s2 + i;
        const nextChild = c2[nextIndex];
        const anchor = nextIndex + 1 < l2 ? c2[nextIndex + 1].el : null;
        if (newIndexToOldIndexMap[i] === 0) {
          patch(null, nextChild, container, anchor);
        } else if (moved) {
          if (j < 0 || i !== increasingNewIndexSequence[j]) {
            hostInsert(nextChild.el, container, anchor);
          } else {
            j--;
          }
        }
      }
    }
  }

  function patchChildren(n1, n2, container) {
    const { children: c1, shapeFlag: prevShapeFlag } = n1;
    const { children: c2, shapeFlag } = n2;
    // 如果n2 的children是单个的 文本类型
    if (shapeFlag & ShapeFlags.TEXT_CHILDREN) {
      // 如果 n1 的children是数组， 那就unmountChildren
      if (prevShapeFlag & ShapeFlags.ARRAY_CHILDREN) {
        console.log("case 1-1:", "原children是数组，现在是文本，卸载原数组");
        unmountChildren(c1);
      }
      // 如果 n1 的children也是文本，直接替换即可
      if (c1 !== c2) {
        console.log("case 1-2:", "更新新children文本内容");
        hostSetElementText(container, c2 as string);
      }
    } else {
      // 现在的children不是text， 可能为数组 或者 null
      if (prevShapeFlag & ShapeFlags.ARRAY_CHILDREN) {
        //  原来的是数组
        if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
          // 现在的也是数组
          // TODO: 数组 vs 数组， 核心的diff算法
          console.log("case 2: ", "数组 vs 数组， 核心的diff算法");
          patchKeyedChildren(c1, c2, container);
        } else {
          // 没有新的children，直接删除老的
          console.log("case 3:", "没有新的children，老的children是数组");
          unmountChildren(c1);
        }
      } else {
        // 原来的是 text 或者 null
        // 现在的是 数组 或者 null
        if (prevShapeFlag & ShapeFlags.TEXT_CHILDREN) {
          console.log("case 4-1:", "原来是文本或者null");
          hostSetElementText(container, "");
        }

        // mount 新的children array
        if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
          console.log("case 4-2:", "挂载新的数组children");
          mountChildren(c2, container);
        }
      }
    }
  }
  function patchProps(oldProps, newProps, el) {
    if (oldProps !== newProps) {
      for (let key in newProps) {
        const prev = oldProps[key];
        const next = newProps[key];
        if (prev !== next) {
          hostPatchProp(el, key, prev, next);
        }
      }

      for (let key in oldProps) {
        if (!(key in newProps)) {
          hostPatchProp(el, key, oldProps[key], null);
        }
      }
    }
  }

  function patchElement(n1: any, n2: any, container: any) {
    console.log("patchElement", n1, n2);
    let el = (n2.el = n1.el);
    // 更新属性
    const oldProps = n1.props || {};
    const newProps = n2.props || {};
    patchProps(oldProps, newProps, el);

    patchChildren(n1, n2, el);
  }

  function processElement(n1: any, n2: any, container: any, anchor = null) {
    if (n1 == null) {
      mountElement(n2, container, anchor);
    } else {
      patchElement(n1, n2, container);
    }
  }

  function processText(n1: any, n2: any, container: any) {
    if (n1 == null) {
      // child 是一个文本， 直接插入即可
      hostInsert((n2.el = hostCreateText(n2.children)), container);
    } else {
    }
  }

  function getNextHostNode(vnode) {
    // TODO: 如果vnode是组件

    return hostNextSibling(vnode.anchor || vnode.el);
  }

  // unmount 应该需要考虑vnode的类型， 这边先只考虑 元素 类型
  function unmount(vnode) {
    hostRemove(vnode.el);
  }

  function patch(n1, n2, container, anchor = null) {
    console.log("n1", n1);
    if (n1 && !isSameVNodeType(n1, n2)) {
      anchor = getNextHostNode(n1);
      unmount(n1);
      n1 = null;
    }
    const { shapeFlag, type } = n2;
    switch (type) {
      case Text:
        processText(n1, n2, container);
        break;

      default:
        if (shapeFlag & ShapeFlags.ELEMENT) {
          processElement(n1, n2, container, anchor);
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

// https://en.wikipedia.org/wiki/Longest_increasing_subsequence
function getSequence(arr: number[]): number[] {
  const p = arr.slice();
  const result = [0];
  let i, j, u, v, c;
  const len = arr.length;
  for (i = 0; i < len; i++) {
    const arrI = arr[i];
    if (arrI !== 0) {
      j = result[result.length - 1];
      if (arr[j] < arrI) {
        p[i] = j;
        result.push(i);
        continue;
      }
      u = 0;
      v = result.length - 1;
      while (u < v) {
        c = (u + v) >> 1;
        if (arr[result[c]] < arrI) {
          u = c + 1;
        } else {
          v = c;
        }
      }
      if (arrI < arr[result[u]]) {
        if (u > 0) {
          p[i] = result[u - 1];
        }
        result[u] = i;
      }
    }
  }
  u = result.length;
  v = result[u - 1];
  while (u-- > 0) {
    result[u] = v;
    v = p[v];
  }
  return result;
}
