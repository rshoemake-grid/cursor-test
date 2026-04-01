import { isDefined } from "./typeGuards";
function coalesce(value, defaultValue) {
  return isDefined(value) ? value : defaultValue;
}
export {
  coalesce
};
