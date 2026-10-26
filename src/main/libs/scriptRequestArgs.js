import {
  ACCOUNT_FIELDS,
  accountChangesSchema,
  newAccountSchema,
} from "../../shared/lib/accountFields";

import { SCRIPT_API } from "../../shared/constants/ipc";
import { checkTagName } from "../../shared/lib/tagNames";
import { normalizePrompt } from "../../shared/lib/scriptPrompts";

/** The longest backup accepted, in characters of JSON */
const MAX_BACKUP_LENGTH = 50_000_000;

/** The longest storage key accepted */
const MAX_KEY_LENGTH = 200;

/** The longest storage value accepted, in characters of JSON */
const MAX_VALUE_LENGTH = 1_000_000;

/** The Chrome version a User-Agent is set to */
const CHROME_VERSION = process.versions.chrome;

/** The JSON of a value, or null when it can't be written as JSON */
function toJson(value) {
  try {
    return JSON.stringify(value) ?? null;
  } catch {
    return null;
  }
}

/** A backup from untrusted input, or the error to refuse it with */
function checkBackup(backup) {
  if (!backup || typeof backup !== "object" || !backup.data) {
    return { error: "A backup must be an object with its data" };
  }

  /** The backup as JSON */
  const json = toJson(backup);

  if (json === null || json.length > MAX_BACKUP_LENGTH) {
    return { error: "The backup is too large or not valid JSON" };
  }

  return { backup: JSON.parse(json) };
}

/** The account fields a script may set */
const KNOWN_FIELDS = new Set(ACCOUNT_FIELDS);

/** Account fields checked by a yup schema, or the first error */
function checkSchema(schema, input) {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    return { error: "Account fields must be an object" };
  }

  /** The first field a script may not set */
  const unknown = Object.keys(input).find((key) => !KNOWN_FIELDS.has(key));

  if (unknown !== undefined)
    return { error: `Unknown account field "${unknown}"` };

  try {
    return { values: schema.validateSync(input, { abortEarly: true }) };
  } catch (error) {
    return { error: error.errors?.[0] ?? "Invalid account" };
  }
}

/** The checked arguments of a prompt */
function promptArgs([raw], partitions) {
  /** The prompt with only valid properties */
  const prompt = normalizePrompt(raw);

  if (prompt.partition !== null && !partitions.has(prompt.partition)) {
    return { error: "The account is not part of this run" };
  }

  /** The time the prompt closes by itself, or null */
  const expiresAt = prompt.timeout ? Date.now() + prompt.timeout * 1000 : null;

  return { args: [prompt], expiresAt };
}

/** The checked arguments of a storage request */
function storageArgs(method, [key, value]) {
  if (typeof key !== "string" || key === "" || key.length > MAX_KEY_LENGTH) {
    return { error: "A storage key must be a short, non-empty string" };
  }

  if (method === SCRIPT_API.STORAGE_GET) return { args: [key] };

  if (value === undefined || value === null) return { args: [key, null] };

  /** The value as JSON */
  const json = toJson(value);

  if (json === null || json.length > MAX_VALUE_LENGTH) {
    return { error: "A storage value must be JSON of at most 1 MB" };
  }

  return { args: [key, JSON.parse(json)] };
}

/** The checked arguments of a request, or the error to answer it with */
export function checkRequestArgs(method, params, partitions) {
  switch (method) {
    case SCRIPT_API.PROMPT:
      return promptArgs(params, partitions);

    case SCRIPT_API.UPDATE_ACCOUNT: {
      const { values, error } = checkSchema(
        accountChangesSchema(CHROME_VERSION),
        params[1],
      );

      return error ? { error } : { args: [params[0], values] };
    }

    case SCRIPT_API.RESTORE_BACKUP: {
      const { backup, error } = checkBackup(params[1]);

      return error ? { error } : { args: [params[0], backup] };
    }

    case SCRIPT_API.ADD_ACCOUNT: {
      const account = checkSchema(newAccountSchema(CHROME_VERSION), params[0]);

      if (account.error) return { error: account.error };
      if (params[1] === undefined || params[1] === null) {
        return { args: [account.values, null] };
      }

      const { backup, error } = checkBackup(params[1]);

      return error ? { error } : { args: [account.values, backup] };
    }

    case SCRIPT_API.CREATE_TAG: {
      const name = typeof params[0] === "string" ? params[0].trim() : "";
      const error = checkTagName(name);

      return error ? { error } : { args: [name] };
    }

    case SCRIPT_API.STORAGE_GET:
    case SCRIPT_API.STORAGE_SET:
      return storageArgs(method, params);

    default:
      return { args: params.slice(0, 1) };
  }
}
