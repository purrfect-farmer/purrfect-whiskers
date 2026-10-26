import {
  IPC,
  SCRIPT_CHANNEL,
  SCRIPT_EVENT,
} from "../../../shared/constants/ipc";
import { cacheSessions, getCachedSession } from "../lib/accountSessions";
import { useCallback, useEffect, useMemo, useState } from "react";

import { SCRIPT_STATUS } from "../lib/constants";
import { getErrorMessage } from "../lib/utils";
import { getOrRestoreAccountBackup } from "../lib/accountBackup";
import useAppStore from "../store/useAppStore";
import useBatchRunner from "./useBatchRunner";
import useScriptLog from "./useScriptLog";

/** The backup of an account, or none when it can't be read */
async function readAccountBackup(account) {
  try {
    return { account, backup: await getOrRestoreAccountBackup(account) };
  } catch {
    return { account, backup: null };
  }
}

/** A hook for running a script on accounts and following its output */
export default function useScriptRunner() {
  /** The state of the current run */
  const [status, setStatus] = useState(SCRIPT_STATUS.IDLE);

  /** The message of the last failure */
  const [error, setError] = useState(null);

  const log = useScriptLog();
  const { append, end, clear } = log;
  const { target, progress, run } = useBatchRunner();

  /** The end of a run with a failure */
  const fail = useCallback(
    (message) => {
      end();
      setError(message);
      setStatus(SCRIPT_STATUS.FAILED);
    },
    [end],
  );

  /** The subscription to the run events of the main process */
  useEffect(() => {
    /** The handler of each run event */
    const listener = (_event, message) => {
      switch (message.type) {
        case SCRIPT_EVENT.OUTPUT:
          append(message.text);
          break;
        case SCRIPT_EVENT.DONE:
          end();
          setStatus(SCRIPT_STATUS.DONE);
          break;
        case SCRIPT_EVENT.ERROR:
          append(`${message.stack ?? message.message}\n`);
          fail(message.message);
          break;
        case SCRIPT_EVENT.EXIT:
          if (message.code === 0) {
            end();
            setStatus(SCRIPT_STATUS.DONE);
          } else {
            fail(`The script exited with code ${message.code}`);
          }
          break;
        case SCRIPT_EVENT.STOPPED:
          end();
          setStatus(SCRIPT_STATUS.STOPPED);
          break;
      }
    };

    window.electron.ipcRenderer.on(SCRIPT_CHANNEL, listener);

    return () => {
      window.electron.ipcRenderer.removeListener(SCRIPT_CHANNEL, listener);
    };
  }, [append, end, fail]);

  /** The restore of a run that kept going while the window reloaded */
  useEffect(() => {
    window.electron.ipcRenderer.invoke(IPC.GET_SCRIPT_RUN).then((run) => {
      if (!run) return;

      clear();
      append(`Running ${run.name} (restored after reload)\n`);
      append(run.output);
      setStatus(SCRIPT_STATUS.RUNNING);
    });
  }, [append, clear]);

  /** The run of a script on the accounts with a Telegram session */
  const start = useCallback(
    async (folder, name, accounts) => {
      clear();
      setError(null);
      append(`Running ${name} on ${accounts.length} account(s)\n`);

      try {
        /** The accounts whose session isn't cached yet */
        const missing = accounts.filter(
          (account) => !getCachedSession(account.partition),
        );

        if (missing.length > 0) {
          setStatus(SCRIPT_STATUS.READING);
          useAppStore.getState().closeAllAccounts();

          cacheSessions(
            await run(missing, readAccountBackup, {
              partitions: missing.map((account) => account.partition),
            }),
          );
        }

        /** The accounts with their sessions */
        const profiles = [];

        /** The titles of the accounts without a session */
        const skipped = [];

        for (const account of accounts) {
          /** The session of the account */
          const session = getCachedSession(account.partition);

          if (session) {
            profiles.push({ account, session });
          } else {
            skipped.push(account.title);
          }
        }

        if (skipped.length > 0) {
          append(
            `Skipped ${skipped.length} account(s) without a Telegram session: ${skipped.join(", ")}\n`,
          );
        }

        if (profiles.length === 0) {
          throw new Error("None of the accounts has a Telegram session");
        }

        setStatus(SCRIPT_STATUS.RUNNING);

        await window.electron.ipcRenderer.invoke(IPC.RUN_SCRIPT, {
          folder,
          name,
          profiles,
        });
      } catch (startError) {
        fail(getErrorMessage(startError));
      }
    },
    [append, clear, fail, run],
  );

  /** The stop of the running script */
  const stop = useCallback(
    () => window.electron.ipcRenderer.invoke(IPC.STOP_SCRIPT),
    [],
  );

  return useMemo(
    () => ({ status, error, log, target, progress, start, stop }),
    [status, error, log, target, progress, start, stop],
  );
}
