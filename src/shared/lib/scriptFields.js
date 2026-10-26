/** The types of a script field */
export const FIELD_TYPE = Object.freeze({
  TEXT: "text",
  TEXTAREA: "textarea",
  NUMBER: "number",
  BOOLEAN: "boolean",
  SELECT: "select",
  SECRET: "secret",
});

/** The known field types */
const FIELD_TYPES = new Set(Object.values(FIELD_TYPE));

/** The text field types, whose values are strings */
const TEXT_TYPES = new Set([
  FIELD_TYPE.TEXT,
  FIELD_TYPE.TEXTAREA,
  FIELD_TYPE.SECRET,
]);

/** The pattern of a field key */
const KEY_PATTERN = /^[A-Za-z_][A-Za-z0-9_]{0,63}$/;

/** The most fields a form can have */
const MAX_FIELDS = 50;

/** The longest label, description or placeholder kept */
const MAX_LABEL_LENGTH = 300;

/** The longest text value accepted */
const MAX_TEXT_LENGTH = 10_000;

/** A trimmed, length-limited string, or null */
export function toLabel(value) {
  return typeof value === "string" && value.trim() !== ""
    ? value.trim().slice(0, MAX_LABEL_LENGTH)
    : null;
}

/** A select choice as `{ value, label }`, or null */
function toChoice(raw) {
  if (typeof raw === "string" && raw !== "") return { value: raw, label: raw };

  if (raw && typeof raw === "object") {
    const value =
      typeof raw.value === "number" ? String(raw.value) : toLabel(raw.value);

    return value ? { value, label: toLabel(raw.label) ?? value } : null;
  }

  return null;
}

/** The unique `{ value, label }` choices of an untrusted list */
export function toChoices(raw) {
  if (!Array.isArray(raw)) return [];

  /** The choice values already kept */
  const seen = new Set();

  return raw.map(toChoice).filter((choice) => {
    if (!choice || seen.has(choice.value)) return false;

    seen.add(choice.value);

    return true;
  });
}

/** An integer, or null */
const toInteger = (value) => (Number.isInteger(value) ? value : null);

/** An integer limited to `min`–`max` */
const clamp = (value, min, max) =>
  Math.min(Math.max(value, min), max ?? Infinity);

/** A field with only valid properties, or null when it can't be used */
function normalizeField(raw) {
  if (!raw || typeof raw !== "object") return null;

  const { key, type } = raw;

  if (typeof key !== "string" || !KEY_PATTERN.test(key)) return null;
  if (!FIELD_TYPES.has(type)) return null;

  /** The properties every field has */
  const field = {
    key,
    type,
    label: toLabel(raw.label) ?? key,
    description: toLabel(raw.description),
    placeholder: toLabel(raw.placeholder),
    required: raw.required === true,
  };

  switch (type) {
    case FIELD_TYPE.NUMBER: {
      const min = toInteger(raw.min) ?? 0;
      const max = toInteger(raw.max);

      if (max !== null && max < min) return null;

      return {
        ...field,
        min,
        max,
        default: clamp(toInteger(raw.default) ?? min, min, max),
      };
    }

    case FIELD_TYPE.BOOLEAN:
      return { ...field, default: raw.default === true };

    case FIELD_TYPE.SELECT: {
      const choices = toChoices(raw.choices);

      if (choices.length === 0) return null;

      /** Whether the default is one of the choices */
      const hasDefault = choices.some(
        (choice) => choice.value === String(raw.default),
      );

      return {
        ...field,
        choices,
        default: hasDefault
          ? String(raw.default)
          : field.required
            ? choices[0].value
            : "",
      };
    }

    default:
      return {
        ...field,
        default:
          typeof raw.default === "string"
            ? raw.default.slice(0, MAX_TEXT_LENGTH)
            : "",
      };
  }
}

/** The valid fields of an untrusted list, each key used once */
export function normalizeFields(raw) {
  if (!Array.isArray(raw)) return [];

  /** The field keys already kept */
  const seen = new Set();

  /** The valid fields */
  const fields = [];

  for (const item of raw) {
    const field = normalizeField(item);

    if (!field || seen.has(field.key)) continue;

    seen.add(field.key);
    fields.push(field);

    if (fields.length === MAX_FIELDS) break;
  }

  return fields;
}

/** The default value of each field */
export function getDefaultValues(fields) {
  return Object.fromEntries(fields.map((field) => [field.key, field.default]));
}

/** The value of one field from untrusted input, with its error message */
function validateValue(field, input) {
  if (TEXT_TYPES.has(field.type)) {
    const text = typeof input === "string" ? input : "";
    const value = field.type === FIELD_TYPE.SECRET ? text : text.trim();

    if (field.required && value === "") {
      return { value, error: `${field.label} is required` };
    }

    if (value.length > MAX_TEXT_LENGTH) {
      return { value, error: `${field.label} is too long` };
    }

    return { value };
  }

  switch (field.type) {
    case FIELD_TYPE.NUMBER: {
      const value = typeof input === "string" ? Number(input) : input;

      if (!Number.isInteger(value)) {
        return { value, error: `${field.label} must be a whole number` };
      }

      if (value < field.min) {
        return { value, error: `${field.label} must be at least ${field.min}` };
      }

      if (field.max !== null && value > field.max) {
        return { value, error: `${field.label} must be at most ${field.max}` };
      }

      return { value };
    }

    case FIELD_TYPE.BOOLEAN:
      return { value: input === true };

    case FIELD_TYPE.SELECT: {
      const value = input === null || input === undefined ? "" : String(input);

      if (value === "") {
        return field.required
          ? { value, error: `${field.label} is required` }
          : { value };
      }

      if (!field.choices.some((choice) => choice.value === value)) {
        return { value, error: `${field.label} must be one of its choices` };
      }

      return { value };
    }

    default:
      return { value: input };
  }
}

/**
 * The values of the fields from untrusted input, and an error message for
 * each invalid field, by key
 */
export function validateValues(fields, input) {
  /** The input values */
  const source = input && typeof input === "object" ? input : {};

  /** The validated values */
  const values = {};

  /** The error message of each invalid field */
  const errors = {};

  for (const field of fields) {
    const { value, error } = validateValue(field, source[field.key]);

    values[field.key] = value;

    if (error) errors[field.key] = error;
  }

  return { values, errors };
}

/** The values without the secret fields, which are never remembered */
export function omitSecrets(fields, values) {
  /** The keys of the secret fields */
  const secrets = new Set(
    fields
      .filter((field) => field.type === FIELD_TYPE.SECRET)
      .map((field) => field.key),
  );

  return Object.fromEntries(
    Object.entries(values).filter(([key]) => !secrets.has(key)),
  );
}
