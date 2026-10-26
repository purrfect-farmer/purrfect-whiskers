import {
  normalizeFields,
  toChoices,
  toLabel,
  validateValues,
} from "./scriptFields";

/** The action of a prompt's Submit button */
export const PROMPT_SUBMIT = "submit";

/** The most extra buttons a prompt can have */
const MAX_ACTIONS = 3;

/** The shortest and longest prompt timeout, in seconds */
const MIN_TIMEOUT = 5;
const MAX_TIMEOUT = 3600;

/** The longest image accepted, in characters */
const MAX_IMAGE_LENGTH = 2_000_000;

/** The image types a prompt can show */
const IMAGE_TYPES = new Set(["png", "jpeg", "webp", "gif", "svg+xml"]);

/** The pattern of a base64 image data URL */
const DATA_URL_PATTERN = /^data:image\/([a-z+]+);base64,[A-Za-z0-9+/]+=*$/;

/** The pattern of a URL-encoded SVG data URL */
const SVG_TEXT_DATA_URL_PATTERN =
  /^data:image\/svg\+xml(;charset=utf-8)?,%3Csvg/i;

/** The pattern of plain base64 text */
const BASE64_PATTERN = /^[A-Za-z0-9+/]+=*$/;

/** The image type of base64 data, read from its first bytes */
const BASE64_SIGNATURES = [
  ["iVBORw0KGgo", "png"],
  ["/9j/", "jpeg"],
  ["UklGR", "webp"],
  ["R0lGOD", "gif"],
];

/** An image data URL from a data URL or plain base64, or null */
function toImage(raw) {
  if (typeof raw !== "string" || raw.length > MAX_IMAGE_LENGTH) return null;

  const match = raw.match(DATA_URL_PATTERN);

  if (match) return IMAGE_TYPES.has(match[1]) ? raw : null;

  if (SVG_TEXT_DATA_URL_PATTERN.test(raw)) return raw;

  if (!BASE64_PATTERN.test(raw)) return null;

  /** The image type of the data */
  const type = BASE64_SIGNATURES.find(([start]) => raw.startsWith(start))?.[1];

  return type ? `data:image/${type};base64,${raw}` : null;
}

/** A timeout in seconds within the allowed range, or null */
function toTimeout(raw) {
  return Number.isInteger(raw)
    ? Math.min(Math.max(raw, MIN_TIMEOUT), MAX_TIMEOUT)
    : null;
}

/** A prompt from a script, with only valid properties */
export function normalizePrompt(raw) {
  const source = raw && typeof raw === "object" ? raw : {};

  return {
    title: toLabel(source.title) ?? "The script needs your input",
    description: toLabel(source.description),
    image: toImage(source.image),
    fields: normalizeFields(source.fields),
    actions: toChoices(source.actions)
      .filter((action) => action.value !== PROMPT_SUBMIT)
      .slice(0, MAX_ACTIONS),
    timeout: toTimeout(source.timeout),
    partition: typeof source.partition === "string" ? source.partition : null,
  };
}

/** A prompt's answer from untrusted input, or the error to refuse it with */
export function validateAnswer(prompt, answer) {
  /** The button the user pressed */
  const action = answer?.action;

  /** Whether the action is Submit or one of the prompt's buttons */
  const isKnown =
    action === PROMPT_SUBMIT ||
    prompt.actions.some((item) => item.value === action);

  if (!isKnown) return { error: "Unknown prompt action" };

  const { values, errors } = validateValues(prompt.fields, answer.values);

  /** The first invalid value */
  const firstError = Object.values(errors)[0];

  if (action === PROMPT_SUBMIT && firstError) return { error: firstError };

  return { result: { action, values } };
}
