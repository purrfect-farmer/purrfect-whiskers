import { CHECKED_TAG_NAME, addTag, copyAccount } from "./lib/accountChanges.js";
import { askForNote, askToKeepAccount } from "./lib/prompts.js";
import { countStoredItems, getProxy, getTelegramUser } from "./lib/accounts.js";

import { countLines } from "./lib/files.js";
import { recordRun } from "./lib/history.js";
import { runWithLimit } from "./lib/runWithLimit.js";
import { saveReport } from "./lib/report.js";
import { styleText } from "node:util";

/** Prints the options the script received, with the secret masked */
function printOptions(options) {
  console.log(styleText("bold", "Options"));

  for (const [key, value] of Object.entries(options)) {
    /** The value as printed */
    const shown =
      key === "apiToken"
        ? value
          ? "•••• (set)"
          : "(empty)"
        : JSON.stringify(value);

    console.log(`  ${key.padEnd(12)} ${shown}`);
  }
}

/** Reads the files chosen in the "Files to read" option and prints them */
async function printInputFiles(files) {
  if (files.length === 0) return;

  console.log(styleText("bold", "\nFiles to read"));

  for (const { file, lines, error } of await countLines(files)) {
    console.log(
      `  ${file}`,
      error ? styleText("red", error) : `${lines} line(s)`,
    );
  }
}

/** The report row of one account, reading only what the options ask for */
async function describeAccount(account, { api, options, tagNames, tagId }) {
  /** The account's Telegram user */
  const user = getTelegramUser(account);

  /** The account's row in the report */
  const row = {
    title: account.title,
    username: user?.username ?? null,
    tags: (account.tags ?? []).map((id) => tagNames.get(id) ?? id),
    proxy: getProxy(account),
    session: null,
    storedItems: null,
  };

  if (!user) {
    if (options.openWithoutUser) await api.openAccount(account.partition);

    /** Whether the user keeps the account in the report */
    const keep = await askToKeepAccount(api, account, options.openWithoutUser);

    if (!keep) return null;
  }

  if (options.readSessions) {
    /** The session and where it came from, or null */
    const found = await api.getSession(account.partition);

    row.session = found ? found.source : "none";
  }

  if (options.readBackups) {
    row.storedItems = countStoredItems(await api.getBackup(account.partition));
  }

  if (tagId) row.tagged = await addTag(api, account.partition, tagId);

  return row;
}

/** Prints one account's row after its position, e.g. "[2/5]" */
function printRow(row, position) {
  console.log(
    styleText("cyan", position),
    styleText("bold", row.title),
    row.username ? `@${row.username}` : styleText("yellow", "(no user)"),
    row.session ? `· session: ${row.session}` : "",
    row.storedItems !== null ? `· ${row.storedItems} stored item(s)` : "",
    row.tagged ? styleText("green", "· tagged") : "",
    row.error ? styleText("red", `· ${row.error}`) : "",
  );
}

/**
 * The example script, showing every part of the scripts API:
 * - `options`: the values of the manifest's options, already checked
 * - `api.getTags`, `api.getSession`, `api.getBackup`: data from the app
 * - `api.prompt` and `api.confirm`: questions for the user while running
 * - `api.progress`, `api.setStatus`, `api.notify`: what the user sees
 * - `api.getAccount`, `api.updateAccount`, `api.createTag`, `api.addAccount`,
 *   `api.openAccount`: changes to accounts, behind options that are off
 * - `api.storage`: values kept between runs
 * - `signal`: aborted when the user presses Stop
 */
export default async function ({ accounts, options, api, signal }) {
  console.log(styleText("gray", await recordRun(api)));
  printOptions(options);
  await printInputFiles(options.inputFiles);

  api.setStatus("Reading tags");

  /** The name of each tag, by id */
  const tagNames = new Map(
    (await api.getTags()).map((tag) => [tag.id, tag.name]),
  );

  /** The id of the tag added to checked accounts, when turned on */
  const tagId = options.tagChecked
    ? (await api.createTag(CHECKED_TAG_NAME)).id
    : null;

  /** The note saved with the report */
  const note = options.askForNote
    ? await askForNote(api, {
        accounts,
        tagCount: tagNames.size,
        fallback: options.note,
      })
    : options.note;

  console.log(
    styleText("green", `\nReading ${accounts.length} account(s),`),
    `${options.concurrency} at a time`,
  );

  /** The number of accounts finished */
  let finished = 0;

  /** The row of each account, null when left out or never started */
  const rows = await runWithLimit(
    accounts,
    options.concurrency,
    signal,
    async (account, index) => {
      /** The account's position in the run */
      const position = `[${index + 1}/${accounts.length}]`;

      api.setStatus(`Reading ${account.title}`);

      try {
        const row = await describeAccount(account, {
          api,
          options,
          tagNames,
          tagId,
        });

        if (row) {
          printRow(row, position);
        } else {
          console.log(styleText("yellow", position), account.title, "left out");
        }

        return row;
      } catch (error) {
        /** The row of an account that failed */
        const row = { title: account.title, error: error.message };

        printRow(row, position);

        return row;
      } finally {
        api.progress(++finished, accounts.length);
      }
    },
  );

  /** The rows of the accounts that were read */
  const report = rows.filter(Boolean);

  if (options.copyFirst && !signal.aborted && accounts.length > 0) {
    api.setStatus("Copying the first account");

    /** The copy of the first account */
    const copy = await copyAccount(api, accounts[0]);

    console.log(
      styleText("green", "\nCopied the first account as"),
      copy.title,
    );
  }

  api.setStatus("Saving the report");

  if (signal.aborted) {
    console.log(styleText("yellow", "\nStopped; saving what was read"));
  } else if (
    !(await api.confirm(`Save the report of ${report.length} account(s)?`))
  ) {
    console.log("\nReport not saved");
    return;
  }

  /** The saved report file */
  const file = await saveReport({
    name: options.reportName,
    format: options.format,
    note,
    rows: report,
    folder: options.outputFolder,
    copyTo: options.exportCopy,
  });

  console.log(styleText("green", "\nReport saved to"), file);

  if (options.exportCopy) console.log("Copy saved to", options.exportCopy);

  api.setStatus(null);
  api.notify(`Report saved: ${report.length} account(s)`, "success");
}
