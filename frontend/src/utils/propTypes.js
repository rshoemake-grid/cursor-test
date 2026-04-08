import PropTypes from "prop-types";

/** String or explicit `null` (e.g. cleared id / tab). */
export const nullableString = PropTypes.oneOfType([
  PropTypes.string,
  PropTypes.oneOf([null]),
]);
