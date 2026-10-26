import { ACCOUNT_FIELDS } from "../../../shared/lib/accountFields";
import {
  addRunAccount,
  hideRunAccount,
  removeRunAccount,
  showRunAccount,
} from "./scriptRunAccounts";
import {
  getAccountSession,
  readAccountBackup,
  restoreAccountBackup,
} from "./accountSessions";

import { SCRIPT_API } from "../../../shared/constants/ipc";
import { createTag } from "./tags";
import useAppStore from "../store/useAppStore";
import { uuid } from "./utils";

/** The accounts by partition, built once per accounts list */
const accountMaps = new WeakMap();

/** The account of a partition, or null */
export function findAccountOrNull(partition) {
  const { accounts } = useAppStore.getState();

  if (!accountMaps.has(accounts)) {
    accountMaps.set(
      accounts,
      new Map(accounts.map((item) => [item.partition, item])),
    );
  }

  return accountMaps.get(accounts).get(partition) ?? null;
}

/** The account of a partition */
function findAccount(partition) {
  const account = findAccountOrNull(partition);

  if (!account) throw new Error("The account no longer exists");

  return account;
}

/** The account, closed and held first when the user has it open */
function findClosedAccount(partition) {
  const account = findAccount(partition);

  if (account.running) hideRunAccount(partition);

  return account;
}

/** Refuses tag ids that aren't in the tag list */
function checkTags(tags) {
  if (!tags) return;

  /** The known tag ids */
  const known = new Set(useAppStore.getState().tags.map((tag) => tag.id));

  /** The first unknown tag id */
  const unknown = tags.find((id) => !known.has(id));

  if (unknown !== undefined) {
    throw new Error(`Unknown tag "${unknown}"; create it with api.createTag`);
  }
}

/** Creates a run account from checked fields, restoring `backup` into it */
async function addAccount(fields, backup) {
  checkTags(fields.tags);

  /** The new account, with every editable field set */
  const account = {
    ...Object.fromEntries(ACCOUNT_FIELDS.map((key) => [key, null])),
    ...fields,
    partition: `persist:${uuid()}`,
  };

  useAppStore.getState().addAccount(account);
  addRunAccount(account.partition);

  try {
    if (backup) await restoreAccountBackup(account, backup);
  } catch (error) {
    removeRunAccount(account.partition);
    useAppStore.getState().removeAccount(account.partition);
    throw error;
  }

  return findAccount(account.partition);
}

/** Changes a run account's fields, returning the account */
function updateAccount(partition, changes) {
  findAccount(partition);
  checkTags(changes.tags);
  useAppStore.getState().updateAccount({ ...changes, partition });

  return findAccount(partition);
}

/** The tag named `name`, created when it doesn't exist */
function findOrCreateTag(name) {
  /** The tag built from the name */
  const tag = createTag(name);

  if (tag.id === "") throw new Error("The tag name has no letter or number");
  const existing = useAppStore
    .getState()
    .tags.find((item) => item.id === tag.id);

  if (existing) return existing;

  useAppStore.getState().addTag(tag);

  return tag;
}

/** The answer to a script's request about accounts or tags */
export async function answerAccountRequest(method, args) {
  const [partition] = args;

  switch (method) {
    case SCRIPT_API.GET_SESSION:
      return getAccountSession(findClosedAccount(partition));
    case SCRIPT_API.GET_BACKUP:
      return readAccountBackup(findClosedAccount(partition));
    case SCRIPT_API.GET_TAGS:
      return useAppStore.getState().tags;
    case SCRIPT_API.GET_ACCOUNT:
      return findAccount(partition);
    case SCRIPT_API.UPDATE_ACCOUNT:
      return updateAccount(partition, args[1]);
    case SCRIPT_API.RESTORE_BACKUP:
      await restoreAccountBackup(findClosedAccount(partition), args[1]);
      return true;
    case SCRIPT_API.ADD_ACCOUNT:
      return addAccount(args[0], args[1]);
    case SCRIPT_API.OPEN_ACCOUNT:
      findAccount(partition);
      showRunAccount(partition);
      return true;
    case SCRIPT_API.CLOSE_ACCOUNT:
      findAccount(partition);
      hideRunAccount(partition);
      return true;
    case SCRIPT_API.CREATE_TAG:
      return findOrCreateTag(partition);
    default:
      throw new Error(`Unknown request: ${method}`);
  }
}
