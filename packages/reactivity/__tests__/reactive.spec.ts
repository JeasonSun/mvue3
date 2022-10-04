import { reactive } from "../src";

describe("reactivity/reactive", () => {
  test("Object", () => {
    const original = { foo: 1 };
    const observed = reactive(original);
    expect(observed).not.toBe(original);
    // expect(observed.foo).toBe(1)
  });
});
