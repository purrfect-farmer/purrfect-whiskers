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
import useScriptRunStore, { NO_PROGRESS } from "../store/useScriptRunStore";
import { useCallback, useEffect, useMemo, useRef } from "react";

import { SCRIPT_STATUS } from "../lib/constants";
import { getErrorMessage } from "../lib/utils";
import { holdPartitions } from "../lib/busyPartitions";
import useAppStore from "../store/useAppStore";
import useScriptApi from "./useScriptApi";

/** Merges changes into the run state */
const setRunState = (state) => useScriptRunStore.getState().setRunState(state);

/** A hook for running a script on accounts and following it in the store */
export default function useScriptRunner(onRestore) {
  /** The release of the run's accounts */
  const releaseRef = useRef(null);

  const api = useScriptApi();
  const { setPartitions, handleRequest, removePrompt, resetPrompts } = api;

  /** Holds the run's accounts so nothing else opens them */
  const holdAccounts = useCallback(
    (partitions) => {
      releaseRef.current?.();
      releaseRef.current = holdPartitions(partitions);
      setPartitions(partitions);
    },
    [setPartitions],
  );

  /** The end of a run, freeing its accounts */
  const finish = useCallback(
    (status) => {
      endScriptLog();
      resetPrompts();
      releaseRef.current?.();
      releaseRef.current = null;
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
          setRunState({
            progress: { done: message.done, total: message.total },
          });
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
      holdAccounts(run.partitions);
      appendScriptLog(`Running ${run.name} (restored after reload)\n`);
      appendScriptLog(run.output);
      setRunState({
        startedAt: run.startedAt,
        status: run.stopping ? SCRIPT_STATUS.STOPPING : SCRIPT_STATUS.RUNNING,
      });
    });
  }, [holdAccounts, onRestore]);

  /** The run of a script on the accounts with the options */
  const start = useCallback(
    async (folder, name, accounts, options) => {
      /** The partitions of the accounts */
      const partitions = accounts.map((account) => account.partition);

      clearScriptLog();
      setRunState({
        error: null,
        progress: NO_PROGRESS,
        startedAt: Date.now(),
        status: SCRIPT_STATUS.RUNNING,
      });
      appendScriptLog(`Running ${name} on ${accounts.length} account(s)\n`);

      useAppStore.getState().closeAccounts(partitions);
      holdAccounts(partitions);

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
    [fail, holdAccounts],
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
