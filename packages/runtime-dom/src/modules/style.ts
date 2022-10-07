import { isArray } from "./../../../shared/src/index";
import { isString } from "@mvue/shared";

type Style = string | Record<string, string | string[]> | null;

export function patchStyle(el: Element, prev: Style, next: Style) {
  const style = (el as HTMLElement).style;
  const isCssString = isString(next);

  if (next && !isCssString) {
    for (const key in next) {
      setStyle(style, key, next[key]);
    }

    if (prev && !isString(prev)) {
      for (const key in prev) {
        if (next[key] == null) {
          setStyle(style, key, "");
        }
      }
    }
  } else {
    // 新的不存在，就删除style， 源码中新的是字符串，还需要考虑cssText
    if (!next) {
      el.removeAttribute("style");
    }
  }
}

function setStyle(
  style: CSSStyleDeclaration,
  name: string,
  val: string | string[]
) {
  if (isArray(val)) {
    val.forEach((v) => setStyle(style, name, v));
  } else {
    style[name as any] = val;
  }
}
