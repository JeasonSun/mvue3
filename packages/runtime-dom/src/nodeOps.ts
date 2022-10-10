export const nodeOps = {
  insert: (child: any, parent: any, anchor: any) => {
    parent.insertBefore(child, anchor || null);
  },

  remove: (child: any) => {
    const parent = child.parentNode;
    if (parent) {
      parent.removeChild(child);
    }
  },

  createElement: (tag: any) => document.createElement(tag),
  createText: (text: any) => document.createTextNode(text),
  setText: (node: any, text: any) => {
    node.nodeValue = text;
  },
  setElementText: (el: any, text: any) => (el.textContent = text),
  querySelector: (selector: any) => document.querySelector(selector),
  nextSibling: (node) => node.nextSibling,
};
