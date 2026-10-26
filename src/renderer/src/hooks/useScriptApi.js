import { IPC, SCRIPT_API } from "../../../shared/constants/ipc";
import { getAccountSession, readAccountBackup } from "../lib/accountSessions";
import { useCallback, useMemo, useRef } from "react";

import { getErrorMessage } from "../lib/utils";
import { normalizePrompt } from "../../../shared/lib/scriptPrompts";
import useAppStore from "../store/useAppStore";
import useScriptRunStore from "../store/useScriptRunStore";

/** Sends the answer of a script's request to the main process */
const respond = (id, payload) =>
  window.electron.ipcRenderer.invoke(IPC.SCRIPT_RESPONSE, { id, ...payload });

/** The accounts by partition, built once per accounts list */
const accountMaps = new WeakMap();

/** The account of a partition, or null */
function findAccountOrNull(partition) {
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

/** The answer of a data request */
async function readRequest(method, partition) {
  switch (method) {
    case SCRIPT_API.GET_SESSION:
      return getAccountSession(findAccount(partition));
    case SCRIPT_API.GET_BACKUP:
      return readAccountBackup(findAccount(partition));
    case SCRIPT_API.GET_TAGS:
      return useAppStore.getState().tags;
    default:
      throw new Error(`Unknown request: ${method}`);
  }
}

/** The prompts waiting for an answer */
const getPrompts = () => useScriptRunStore.getState().prompts;

/** Replaces the prompts waiting for an answer */
const setPrompts = (prompts) =>
  useScriptRunStore.getState().setRunState({ prompts });

/** A hook for answering a running script's requests and its prompts */
export default function useScriptApi() {
  /** The partitions of the run's accounts */
  const partitionsRef = useRef(new Set());

  /** Sets the partitions the run may read */
  const setPartitions = useCallback((partitions) => {
    partitionsRef.current = new Set(partitions);
  }, []);

  /** The handler of a script's request */
  const handleRequest = useCallback(async ({ id, method, args, expiresAt }) => {
    if (method === SCRIPT_API.PROMPT) {
      /** The prompt with only valid properties */
      const prompt = normalizePrompt(args[0]);

      /** The title of the account the prompt is about */
      const accountTitle = prompt.partition
        ? (findAccountOrNull(prompt.partition)?.title ?? null)
        : null;

      /** The open prompts */
      const current = getPrompts();

      if (!current.some((item) => item.id === id)) {
        setPrompts([
          ...current,
          { id, ...prompt, accountTitle, expiresAt: expiresAt ?? null },
        ]);
      }
      return;
    }

    /** The partition the request reads */
    const partition = args[0];

    try {
      if (method !== SCRIPT_API.GET_TAGS) {
        if (!partitionsRef.current.has(partition)) {
          throw new Error("The account is not part of this run");
        }
      }

      respond(id, { result: await readRequest(method, partition) });
    } catch (error) {
      respond(id, { error: getErrorMessage(error) });
    }
  }, []);

  /** Removes an open prompt */
  const removePrompt = useCallback(
    (id) => setPrompts(getPrompts().filter((item) => item.id !== id)),
    [],
  );

  /** Answers a prompt with `{ action, values }`, or null when cancelled */
  const answerPrompt = useCallback(
    (id, answer) => {
      removePrompt(id);
      respond(id, { result: answer });
    },
    [removePrompt],
  );

  /** Forgets the prompts of a run that ended */
  const resetPrompts = useCallback(() => setPrompts([]), []);

  return useMemo(
    () => ({
      setPartitions,
      handleRequest,
      answerPrompt,
      removePrompt,
      resetPrompts,
    }),
    [setPartitions, handleRequest, answerPrompt, removePrompt, resetPrompts],
  );
}
