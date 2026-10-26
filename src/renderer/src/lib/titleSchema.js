import * as yup from "yup";

import { MAX_TITLE_PADDING } from "./titles";

/**
 * Fields of a numbered title. Prefix and suffix are kept as typed, so
 * separators such as "-" or " " survive.
 */
export const numberedTitleFields = {
  prefix: yup.string().default("").label("Prefix"),
  suffix: yup.string().default("").label("Suffix"),
  startNumber: yup.number().integer().min(1).required().label("Start Number"),
  padding: yup
    .number()
    .integer()
    .min(0)
    .max(MAX_TITLE_PADDING)
    .required()
    .label("Digits"),
};

/** Default values of the numbered title fields */
export const NUMBERED_TITLE_DEFAULTS = Object.freeze({
  prefix: "",
  suffix: "",
  startNumber: 1,
  padding: 0,
});
