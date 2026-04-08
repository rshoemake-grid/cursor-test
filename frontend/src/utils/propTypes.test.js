import PropTypes from "prop-types";
import { nullableString } from "./propTypes";

function checkProps(propTypes, props) {
  const errors = [];
  const spy = jest.spyOn(console, "error").mockImplementation((msg, ...rest) => {
    errors.push([msg, ...rest].join(" "));
  });
  PropTypes.checkPropTypes(propTypes, props, "prop", "TestComponent");
  spy.mockRestore();
  return errors;
}

describe("propTypes", () => {
  describe("nullableString", () => {
    it("accepts null", () => {
      const errs = checkProps({ id: nullableString }, { id: null });
      expect(errs).toEqual([]);
    });

    it("accepts string", () => {
      const errs = checkProps({ id: nullableString }, { id: "x" });
      expect(errs).toEqual([]);
    });

    it("accepts empty string", () => {
      const errs = checkProps({ id: nullableString }, { id: "" });
      expect(errs).toEqual([]);
    });

    it("rejects number", () => {
      const errs = checkProps({ id: nullableString }, { id: 1 });
      expect(errs.length).toBeGreaterThan(0);
    });
  });
});
