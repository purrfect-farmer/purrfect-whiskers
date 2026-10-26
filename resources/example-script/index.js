import { askForNote, askToKeepAccount } from "./lib/prompts.js";
import { countStoredItems, getProxy, getTelegramUser } from "./lib/accounts.js";

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

/** The report row of one account, reading only what the options ask for */
async function describeAccount(account, { api, options, tagNames }) {
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

  if (!user && !(await askToKeepAccount(api, account))) return null;

  if (options.readSessions) {
    /** The session and where it came from, or null */
    const found = await api.getSession(account.partition);

    row.session = found ? found.source : "none";
  }

  if (options.readBackups) {
    row.storedItems = countStoredItems(await api.getBackup(account.partition));
  }

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
    row.error ? styleText("red", `· ${row.error}`) : "",
  );
}

/**
 * The example script, showing every part of the scripts API:
 * - `options`: the values of the manifest's options, already checked
 * - `api.getTags`, `api.getSession`, `api.getBackup`: data from the app
 * - `api.prompt` and `api.confirm`: questions for the user while running
 * - `api.progress`: the progress bar above the output
 * - `signal`: aborted when the user presses Stop
 */
export default async function ({ accounts, options, api, signal }) {
  printOptions(options);

  /** The name of each tag, by id */
  const tagNames = new Map(
    (await api.getTags()).map((tag) => [tag.id, tag.name]),
  );

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

      try {
        const row = await describeAccount(account, { api, options, tagNames });

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
  });

  console.log(styleText("green", "\nReport saved to"), file);
}
