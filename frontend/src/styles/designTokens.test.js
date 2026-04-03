import { colors } from "./designTokens";

describe("designTokens", () => {
  it("exports core grays and primary ramp", () => {
    expect(colors.gray50).toMatch(/^#/);
    expect(colors.gray900).toMatch(/^#/);
    expect(colors.primary600).toMatch(/^#/);
  });
});
