import { IPC, SCRIPT_API } from "../../../shared/constants/ipc";
import {
  answerAccountRequest,
  findAccountOrNull,
} from "../lib/scriptAccountRequests";
import { useCallback, useMemo } from "react";

import { getErrorMessage } from "../lib/utils";
import { normalizePrompt } from "../../../shared/lib/scriptPrompts";
import { isRunAccount } from "../lib/scriptRunAccounts";
import useScriptRunStore from "../store/useScriptRunStore";

/** Sends the answer of a script's request to the main process */
const respond = (id, payload) =>
  window.electron.ipcRenderer.invoke(IPC.SCRIPT_RESPONSE, { id, ...payload });

/** The requests that need no account of the run */
const REQUESTS_WITHOUT_ACCOUNT = new Set([
  SCRIPT_API.GET_TAGS,
  SCRIPT_API.CREATE_TAG,
  SCRIPT_API.ADD_ACCOUNT,
]);

/** The prompts waiting for an answer */
const getPrompts = () => useScriptRunStore.getState().prompts;

/** Replaces the prompts waiting for an answer */
const setPrompts = (prompts) =>
  useScriptRunStore.getState().setRunState({ prompts });

/** A hook for answering a running script's requests and its prompts */
export default function useScriptApi() {
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

    try {
      if (!REQUESTS_WITHOUT_ACCOUNT.has(method) && !isRunAccount(args[0])) {
        throw new Error("The account is not part of this run");
      }

      respond(id, { result: await answerAccountRequest(method, args) });
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
      handleRequest,
      answerPrompt,
      removePrompt,
      resetPrompts,
    }),
    [handleRequest, answerPrompt, removePrompt, resetPrompts],
  );
}
