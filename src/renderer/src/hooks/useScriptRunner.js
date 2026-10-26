import {
  IPC,
  SCRIPT_CHANNEL,
  SCRIPT_EVENT,
} from "../../../shared/constants/ipc";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { SCRIPT_STATUS } from "../lib/constants";
import { getErrorMessage } from "../lib/utils";
import { holdPartitions } from "../lib/busyPartitions";
import useAppStore from "../store/useAppStore";
import useScriptApi from "./useScriptApi";
import useScriptLog from "./useScriptLog";

/** The progress of a run before the script reports any */
const NO_PROGRESS = Object.freeze({ done: 0, total: 0 });

/**
 * A hook for running a script on accounts and following its output;
 * `onRestore` gets the name of a run restored after a reload
 */
export default function useScriptRunner(onRestore) {
  /** The state of the current run */
  const [status, setStatus] = useState(SCRIPT_STATUS.IDLE);

  /** The message of the last failure */
  const [error, setError] = useState(null);

  /** The progress the script reported */
  const [progress, setProgress] = useState(NO_PROGRESS);

  /** The release of the run's accounts */
  const releaseRef = useRef(null);

  const log = useScriptLog();
  const api = useScriptApi();
  const { append, end, clear } = log;
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
    (nextStatus) => {
      end();
      resetPrompts();
      releaseRef.current?.();
      releaseRef.current = null;
      setStatus(nextStatus);
    },
    [end, resetPrompts],
  );

  /** The end of a run with a failure */
  const fail = useCallback(
    (message) => {
      setError(message);
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
          append(message.text);
          break;
        case SCRIPT_EVENT.REQUEST:
          handleRequest(message);
          break;
        case SCRIPT_EVENT.PROGRESS:
          setProgress({ done: message.done, total: message.total });
          break;
        case SCRIPT_EVENT.PROMPT_CLOSED:
          removePrompt(message.id);
          break;
        case SCRIPT_EVENT.STOPPING:
          setStatus(SCRIPT_STATUS.STOPPING);
          break;
        case SCRIPT_EVENT.DONE:
          finish(SCRIPT_STATUS.DONE);
          break;
        case SCRIPT_EVENT.ERROR:
          append(`${message.stack ?? message.message}\n`);
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
  }, [append, handleRequest, removePrompt, finish, fail]);

  /** The restore of a run that kept going while the window reloaded */
  useEffect(() => {
    window.electron.ipcRenderer.invoke(IPC.GET_SCRIPT_RUN).then((run) => {
      if (!run) return;

      clear();
      onRestore(run.name);
      holdAccounts(run.partitions);
      append(`Running ${run.name} (restored after reload)\n`);
      append(run.output);
      setStatus(run.stopping ? SCRIPT_STATUS.STOPPING : SCRIPT_STATUS.RUNNING);
    });
  }, [append, clear, holdAccounts, onRestore]);

  /** The run of a script on the accounts with the options */
  const start = useCallback(
    async (folder, name, accounts, options) => {
      /** The partitions of the accounts */
      const partitions = accounts.map((account) => account.partition);

      clear();
      setError(null);
      setProgress(NO_PROGRESS);
      setStatus(SCRIPT_STATUS.RUNNING);
      append(`Running ${name} on ${accounts.length} account(s)\n`);

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
    [append, clear, fail, holdAccounts],
  );

  /** The stop of the running script; a second stop kills it at once */
  const stop = useCallback(
    () => window.electron.ipcRenderer.invoke(IPC.STOP_SCRIPT),
    [],
  );

  return useMemo(
    () => ({ status, error, log, api, progress, start, stop }),
    [status, error, log, api, progress, start, stop],
  );
}
