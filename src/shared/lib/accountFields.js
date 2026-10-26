import * as yup from "yup";

import { withChromeVersion } from "./userAgent";

/** The longest text kept in an account field */
const MAX_FIELD_LENGTH = 10_000;

/** Optional text, trimmed, with empty stored as null */
const optionalText = () =>
  yup
    .string()
    .trim()
    .max(MAX_FIELD_LENGTH)
    .nullable()
    .transform((value) => value || null);

/** The rules of an account's editable fields, for a Chrome version */
export function accountFieldRules(chromeVersion) {
  return {
    title: yup.string().trim().max(300).required().label("Title"),
    telegramInitData: yup
      .string()
      .max(MAX_FIELD_LENGTH)
      .nullable()
      .label("Telegram init data"),
    userAgent: optionalText()
      .transform((value) => withChromeVersion(value, chromeVersion))
      .label("User-Agent"),
    proxyEnabled: yup
      .bool()
      .typeError("Proxy enabled must be true or false")
      .required(),
    proxyHost: optionalText().label("Proxy host"),
    proxyPort: optionalText().label("Proxy port"),
    proxyUsername: optionalText().label("Proxy username"),
    proxyPassword: optionalText().label("Proxy password"),
    tags: yup
      .array()
      .of(yup.string())
      .transform((value) =>
        Array.isArray(value) ? [...new Set(value)] : value,
      )
      .typeError("Tags must be a list of tag ids")
      .required(),
  };
}

/** The fields an account change may set */
export const ACCOUNT_FIELDS = Object.freeze(
  Object.keys(accountFieldRules(null)),
);

/** The schema of a new account, with no proxy and no tags by default */
export function newAccountSchema(chromeVersion) {
  const rules = accountFieldRules(chromeVersion);

  return yup
    .object({
      ...rules,
      proxyEnabled: rules.proxyEnabled.default(false),
      tags: rules.tags.default([]),
    })
    .noUnknown();
}

/** The schema of a change to an account: any of its fields, each checked */
export function accountChangesSchema(chromeVersion) {
  return yup.object(accountFieldRules(chromeVersion)).partial().noUnknown();
}
