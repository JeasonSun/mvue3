import { effect } from "../src/effect";
import { reactive } from "../src/reactive";
import { isRef, proxyRefs, ref, toRef, toRefs, unRef } from "../src/ref";

describe("reactivity/ref", () => {
  it("should hold a value", () => {
    const a = ref(1);
    expect(a.value).toBe(1);
    a.value = 2;
    expect(a.value).toBe(2);
  });

  it("should be reactive", () => {
    const a = ref(1);
    let dummy;
    let calls = 0;
    effect(() => {
      calls++;
      dummy = a.value;
    });
    expect(calls).toBe(1);
    expect(dummy).toBe(1);
    a.value = 2;
    expect(calls).toBe(2);
    expect(dummy).toBe(2);
    // same value should not trigger
    a.value = 2;
    expect(calls).toBe(2);
  });

  it("should make nested properties reactive", () => {
    const a = ref({
      count: 1,
    });
    let dummy;
    effect(() => {
      dummy = a.value.count;
    });
    expect(dummy).toBe(1);
    a.value.count = 2;
    expect(dummy).toBe(2);
  });

  it("isRef", () => {
    const a = ref(1);
    const user = reactive({
      age: 1,
    });
    expect(isRef(a)).toBe(true);
    expect(isRef(1)).toBe(false);
    expect(isRef(user)).toBe(false);
  });

  it("unRef", () => {
    const a = ref(1);
    expect(unRef(a)).toBe(1);
    expect(unRef(1)).toBe(1);
  });

  it("proxyRefs", () => {
    const user = {
      age: ref(10),
      name: "mojie",
    };
    const proxyUser = proxyRefs(user);
    expect(user.age.value).toBe(10);
    expect(proxyUser.age).toBe(10);
    expect(proxyUser.name).toBe("mojie");

    (proxyUser as any).age = 20;
    expect(proxyUser.age).toBe(20);
    expect(user.age.value).toBe(20);

    proxyUser.age = ref(10);
    expect(proxyUser.age).toBe(10);
    expect(user.age.value).toBe(10);
  });

  test("toRef", () => {
    const a = reactive({
      x: 1,
    });
    const x = toRef(a, "x");
    expect(isRef(x)).toBe(true);
    expect(x.value).toBe(1);

    // source -> proxy
    a.x = 2;
    expect(x.value).toBe(2);

    // proxy -> source
    x.value = 3;
    expect(a.x).toBe(3);

    // reactivity
    let dummyX;
    effect(() => {
      dummyX = x.value;
    });
    expect(dummyX).toBe(x.value);

    // mutating source should trigger effect using the proxy refs
    a.x = 4;
    expect(dummyX).toBe(4);

    // should keep ref
    const r = { x: ref(1) };
    expect(toRef(r, "x")).toBe(r.x);
  });

  test("toRef default value", () => {
    const a: { x: number | undefined } = { x: undefined };
    const x = toRef(a, "x", 1);
    // @ts-ignore
    expect(x.value).toBe(1);

    a.x = 2;
    // @ts-ignore
    expect(x.value).toBe(2);

    a.x = undefined;
    // @ts-ignore
    expect(x.value).toBe(1);
  });

  test("toRefs", () => {
    const a = reactive({
      x: 1,
      y: 2,
    });

    const { x, y } = toRefs(a);

    expect(isRef(x)).toBe(true);
    expect(isRef(y)).toBe(true);
    expect(x.value).toBe(1);
    expect(y.value).toBe(2);

    // source -> proxy
    a.x = 2;
    a.y = 3;
    expect(x.value).toBe(2);
    expect(y.value).toBe(3);

    // proxy -> source
    x.value = 3;
    y.value = 4;
    expect(a.x).toBe(3);
    expect(a.y).toBe(4);

    // reactivity
    let dummyX, dummyY;
    effect(() => {
      dummyX = x.value;
      dummyY = y.value;
    });
    expect(dummyX).toBe(x.value);
    expect(dummyY).toBe(y.value);

    // mutating source should trigger effect using the proxy refs
    a.x = 4;
    a.y = 5;
    expect(dummyX).toBe(4);
    expect(dummyY).toBe(5);
  });
});
