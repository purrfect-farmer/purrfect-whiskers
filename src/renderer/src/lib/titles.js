/** The modes of the bulk renamer */
export const RENAME_MODE = Object.freeze({
  NUMBERED: "numbered",
  AFFIX: "affix",
});

/** The most digits a title number can be padded to */
export const MAX_TITLE_PADDING = 6;

/** A formatter for numbered titles */
export function formatNumberedTitle({
  prefix = "",
  suffix = "",
  number,
  padding = 0,
}) {
  return `${prefix}${String(number).padStart(padding, "0")}${suffix}`;
}

/** A builder for one account's bulk rename title */
export function buildTitle(account, index, values) {
  const title =
    values.mode === RENAME_MODE.AFFIX
      ? `${values.prefix}${account.title}${values.suffix}`
      : formatNumberedTitle({
          prefix: values.prefix,
          suffix: values.suffix,
          number: values.startNumber + index,
          padding: values.padding,
        });

  return title.trim();
}

/** A builder for the `[partition, title]` pairs of a bulk rename */
export function buildTitles(accounts, values) {
  return accounts.map((account, index) => [
    account.partition,
    buildTitle(account, index, values),
  ]);
}
