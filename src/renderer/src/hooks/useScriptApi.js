import { IPC, SCRIPT_API } from "../../../shared/constants/ipc";
import { getAccountSession, readAccountBackup } from "../lib/accountSessions";
import { useCallback, useMemo, useRef, useState } from "react";

import { getErrorMessage } from "../lib/utils";
import { normalizePrompt } from "../../../shared/lib/scriptPrompts";
import useAppStore from "../store/useAppStore";

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

/** A hook for answering a running script's requests and its prompts */
export default function useScriptApi() {
  /** The partitions of the run's accounts */
  const partitionsRef = useRef(new Set());

  /** The prompts waiting for an answer, oldest first */
  const [prompts, setPromptsState] = useState([]);

  /** The latest prompts, read by the handlers */
  const promptsRef = useRef(prompts);

  /** Replaces the open prompts */
  const setPrompts = useCallback((next) => {
    promptsRef.current = next;
    setPromptsState(next);
  }, []);

  /** Sets the partitions the run may read */
  const setPartitions = useCallback((partitions) => {
    partitionsRef.current = new Set(partitions);
  }, []);

  /** The handler of a script's request */
  const handleRequest = useCallback(
    async ({ id, method, args, expiresAt }) => {
      if (method === SCRIPT_API.PROMPT) {
        /** The prompt with only valid properties */
        const prompt = normalizePrompt(args[0]);

        /** The title of the account the prompt is about */
        const accountTitle = prompt.partition
          ? (findAccountOrNull(prompt.partition)?.title ?? null)
          : null;

        /** The open prompts */
        const current = promptsRef.current;

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
    },
    [setPrompts],
  );

  /** Removes an open prompt */
  const removePrompt = useCallback(
    (id) => setPrompts(promptsRef.current.filter((item) => item.id !== id)),
    [setPrompts],
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
  const resetPrompts = useCallback(() => setPrompts([]), [setPrompts]);

  return useMemo(
    () => ({
      prompt: prompts[0] ?? null,
      waiting: prompts.length,
      setPartitions,
      handleRequest,
      answerPrompt,
      removePrompt,
      resetPrompts,
    }),
    [
      prompts,
      setPartitions,
      handleRequest,
      answerPrompt,
      removePrompt,
      resetPrompts,
    ],
  );
}
