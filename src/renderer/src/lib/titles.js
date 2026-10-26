/** How the bulk renamer builds titles */
export const RENAME_MODE = Object.freeze({
  NUMBERED: "numbered",
  AFFIX: "affix",
});

/** Most digits a number can be zero-padded to */
export const MAX_TITLE_PADDING = 6;

/** Prefix, then the number zero-padded to `padding` digits, then suffix */
export function formatNumberedTitle({
  prefix = "",
  suffix = "",
  number,
  padding = 0,
}) {
  return `${prefix}${String(number).padStart(padding, "0")}${suffix}`;
}

/** The trimmed title of the account at position `index` of a bulk rename */
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

/** `[partition, title]` of each account, numbered in the given order */
export function buildTitles(accounts, values) {
  return accounts.map((account, index) => [
    account.partition,
    buildTitle(account, index, values),
  ]);
}
