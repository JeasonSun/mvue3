import { isOn } from "@mvue/shared";
import { patchAttr } from "./modules/attrs";
import { patchClass } from "./modules/class";
import { patchEvent } from "./modules/events";
import { patchStyle } from "./modules/style";

export const patchProp = (
  el: Element,
  key: string,
  prevValue: any,
  nextValue: any
) => {
  switch (key) {
    case "class":
      patchClass(el, nextValue);
      break;
    case "style":
      patchStyle(el, prevValue, nextValue);
      break;
    default:
      if (isOn(key)) {
        // 添加事件
        patchEvent(el, key, prevValue, nextValue);
      } else {
        // attribute
        patchAttr(el, key, nextValue);
      }
      break;
  }
};
