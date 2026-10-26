import {
  IPC,
  SCRIPT_CHANNEL,
  SCRIPT_EVENT,
} from "../../../shared/constants/ipc";
import {
  appendScriptLog,
  clearScriptLog,
  endScriptLog,
} from "../lib/scriptLog";
import {
  clearScriptProgress,
  flushScriptProgress,
  queueScriptProgress,
} from "../lib/scriptProgress";
import useScriptRunStore, { NO_PROGRESS } from "../store/useScriptRunStore";
import { useCallback, useEffect, useMemo } from "react";

import { SCRIPT_STATUS } from "../lib/constants";
import { getErrorMessage } from "../lib/utils";
import { holdRunAccounts, releaseRunAccounts } from "../lib/scriptRunAccounts";
import { SCRIPT_NOTIFY_TYPE } from "../../../shared/constants/ipc";
import toast from "react-hot-toast";
import useAppStore from "../store/useAppStore";
import useScriptApi from "./useScriptApi";

/** Shows a script's notification as a toast */
function showScriptNotification({ text, kind }) {
  if (!text) return;

  if (kind === SCRIPT_NOTIFY_TYPE.SUCCESS) toast.success(text);
  else if (kind === SCRIPT_NOTIFY_TYPE.ERROR) toast.error(text);
  else toast(text);
}

/** Merges changes into the run state */
const setRunState = (state) => useScriptRunStore.getState().setRunState(state);

/** A hook for running a script on accounts and following it in the store */
export default function useScriptRunner(onRestore) {
  const api = useScriptApi();
  const { handleRequest, removePrompt, resetPrompts } = api;

  /** The end of a run, freeing its accounts */
  const finish = useCallback(
    (status) => {
      endScriptLog();
      flushScriptProgress();
      resetPrompts();
      releaseRunAccounts();
      setRunState({ status });
    },
    [resetPrompts],
  );

  /** The end of a run with a failure */
  const fail = useCallback(
    (message) => {
      setRunState({ error: message });
      finish(SCRIPT_STATUS.FAILED);
    },
    [finish],
  );

  /** The subscription to the run events of the main process */
  useEffect(() => {
    /** The handler of each run event */
    const listener = (_event, message) => {
      switch (message.type) {
        case SCRIPT_EVENT.OUTPUT:
          appendScriptLog(message.text);
          break;
        case SCRIPT_EVENT.REQUEST:
          handleRequest(message);
          break;
        case SCRIPT_EVENT.PROGRESS:
          queueScriptProgress(message.done, message.total);
          break;
        case SCRIPT_EVENT.STATUS:
          setRunState({ statusText: message.text });
          break;
        case SCRIPT_EVENT.NOTIFY:
          showScriptNotification(message);
          break;
        case SCRIPT_EVENT.SHOW_PROMPT:
          useScriptRunStore.getState().setDialogOpen(true);
          break;
        case SCRIPT_EVENT.PROMPT_CLOSED:
          removePrompt(message.id);
          break;
        case SCRIPT_EVENT.STOPPING:
          setRunState({ status: SCRIPT_STATUS.STOPPING });
          break;
        case SCRIPT_EVENT.DONE:
          finish(SCRIPT_STATUS.DONE);
          break;
        case SCRIPT_EVENT.ERROR:
          appendScriptLog(`${message.stack ?? message.message}\n`);
          fail(message.message);
          break;
        case SCRIPT_EVENT.EXIT:
          if (message.code === 0) {
            finish(SCRIPT_STATUS.DONE);
          } else {
            fail(`The script exited with code ${message.code}`);
          }
          break;
        case SCRIPT_EVENT.STOPPED:
          finish(SCRIPT_STATUS.STOPPED);
          break;
      }
    };

    window.electron.ipcRenderer.on(SCRIPT_CHANNEL, listener);

    return () => {
      window.electron.ipcRenderer.removeListener(SCRIPT_CHANNEL, listener);
    };
  }, [handleRequest, removePrompt, finish, fail]);

  /** The restore of a run that kept going while the window reloaded */
  useEffect(() => {
    window.electron.ipcRenderer.invoke(IPC.GET_SCRIPT_RUN).then((run) => {
      if (!run) return;

      clearScriptLog();
      onRestore(run.name);
      useAppStore.getState().closeAccounts(run.partitions);
      holdRunAccounts(run.partitions);
      appendScriptLog(`Running ${run.name} (restored after reload)\n`);
      appendScriptLog(run.output);
      setRunState({
        runName: run.name,
        startedAt: run.startedAt,
        status: run.stopping ? SCRIPT_STATUS.STOPPING : SCRIPT_STATUS.RUNNING,
      });
    });
  }, [onRestore]);

  /** The run of a script on the accounts with the options */
  const start = useCallback(
    async (folder, name, accounts, options) => {
      /** The partitions of the accounts */
      const partitions = accounts.map((account) => account.partition);

      clearScriptLog();
      clearScriptProgress();
      setRunState({
        runName: name,
        error: null,
        statusText: null,
        progress: NO_PROGRESS,
        startedAt: Date.now(),
        status: SCRIPT_STATUS.RUNNING,
      });
      appendScriptLog(`Running ${name} on ${accounts.length} account(s)\n`);

      useAppStore.getState().closeAccounts(partitions);
      holdRunAccounts(partitions);

      try {
        await window.electron.ipcRenderer.invoke(IPC.RUN_SCRIPT, {
          folder,
          name,
          accounts,
          options,
        });
      } catch (startError) {
        fail(getErrorMessage(startError));
      }
    },
    [fail],
  );

  /** The stop of the running script; a second stop kills it at once */
  const stop = useCallback(
    () => window.electron.ipcRenderer.invoke(IPC.STOP_SCRIPT),
    [],
  );

  return useMemo(
    () => ({ start, stop, answerPrompt: api.answerPrompt }),
    [start, stop, api.answerPrompt],
  );
}
