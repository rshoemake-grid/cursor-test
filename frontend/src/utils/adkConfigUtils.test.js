import { normalizeAdkConfig, adkConfigTextField } from "./adkConfigUtils";

describe("normalizeAdkConfig", () => {
  it("returns empty object for nullish", () => {
    expect(normalizeAdkConfig(null)).toEqual({});
    expect(normalizeAdkConfig(undefined)).toEqual({});
  });

  it("returns same object for plain object", () => {
    const o = { name: "a", instruction: "b" };
    expect(normalizeAdkConfig(o)).toBe(o);
  });

  it("parses JSON object string", () => {
    expect(
      normalizeAdkConfig('{"name":"my_agent","instruction":"hi"}'),
    ).toEqual({
      name: "my_agent",
      instruction: "hi",
    });
  });

  it("returns {} for invalid JSON string", () => {
    expect(normalizeAdkConfig("{not json")).toEqual({});
  });

  it("returns {} for array", () => {
    expect(normalizeAdkConfig([1, 2])).toEqual({});
  });

  it("returns {} for non-object string after parse", () => {
    expect(normalizeAdkConfig('"just a string"')).toEqual({});
  });
});

describe("adkConfigTextField", () => {
  it("reads string fields", () => {
    expect(adkConfigTextField({ name: "x" }, "name")).toBe("x");
  });

  it("returns empty for missing or object values", () => {
    expect(adkConfigTextField({}, "name")).toBe("");
    expect(adkConfigTextField({ name: { nested: 1 } }, "name")).toBe("");
  });

  it("stringifies numbers", () => {
    expect(adkConfigTextField({ name: 42 }, "name")).toBe("42");
  });
});
