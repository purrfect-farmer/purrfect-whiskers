import fs from "node:fs/promises";
import path from "node:path";
import { styleText } from "node:util";

/** The folder the summary is saved to, inside the script's folder */
const OUTPUT_FOLDER = "outputs";

/** A pause, standing in for real work such as a request */
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/** The Telegram user in an account's init data, or null */
function getTelegramUser(account) {
  try {
    const user = new URLSearchParams(account.telegramInitData ?? "").get(
      "user",
    );

    return user ? JSON.parse(user) : null;
  } catch {
    return null;
  }
}

/** The proxy of an account as "host:port", or null */
function getProxy(account) {
  return account.proxyEnabled && account.proxyHost
    ? `${account.proxyHost}:${account.proxyPort}`
    : null;
}

/**
 * A runner of `task` on every item, `limit` at a time, keeping the order.
 * No new item starts once `signal` is aborted.
 */
async function runWithLimit(items, limit, signal, task) {
  /** The result of each item, by position */
  const results = new Array(items.length);

  /** The position of the next item to start */
  let next = 0;

  /** A worker taking items until none are left */
  const worker = async () => {
    while (next < items.length && !signal.aborted) {
      const index = next++;

      results[index] = await task(items[index], index);
    }
  };

  await Promise.all(Array.from({ length: limit }, worker));

  return results;
}

/** The summary of one account, logged as it is built */
async function summarizeAccount(account, session, index, total) {
  /** The account's Telegram user */
  const user = getTelegramUser(account);

  /** The position of the account in the run */
  const position = styleText("cyan", `[${index + 1}/${total}]`);

  console.log(
    position,
    styleText("bold", account.title),
    user
      ? `@${user.username ?? user.id}`
      : styleText("yellow", "(no Telegram user)"),
  );
  console.log(
    "  tags:   ",
    account.tags?.length ? account.tags.join(", ") : "none",
  );
  console.log("  proxy:  ", getProxy(account) ?? "none");
  console.log(
    "  session:",
    session ? `from ${session.source} storage` : "not read or missing",
  );

  await delay(200);

  return {
    partition: account.partition,
    title: account.title,
    telegramId: user?.id ?? null,
    username: user?.username ?? null,
    tags: account.tags ?? [],
    proxy: getProxy(account),
    sessionSource: session?.source ?? null,
  };
}

/**
 * The example script: summarizes the selected accounts and saves the
 * summary to outputs/, reading sessions through `api` when asked to.
 */
export default async function ({ accounts, options, api, signal }) {
  console.log(styleText("green", `Running on ${accounts.length} account(s)`));

  /** The number of accounts finished */
  let finished = 0;

  const results = await runWithLimit(
    accounts,
    options.concurrency,
    signal,
    async (account, index) => {
      try {
        /** The account's Telegram session and its source, when read */
        const session = options.readSessions
          ? await api.getSession(account.partition)
          : null;

        return {
          ok: true,
          ...(await summarizeAccount(account, session, index, accounts.length)),
        };
      } catch (error) {
        console.error(
          styleText("red", `  ${account.title} failed:`),
          error.message,
        );

        return { ok: false, title: account.title, error: error.message };
      } finally {
        api.progress(++finished, accounts.length);
      }
    },
  );

  if (signal.aborted) {
    console.log(styleText("yellow", "Stopped; saving what was done"));
  }

  /** The accounts that were handled */
  const handled = results.filter(Boolean);

  /** The number of accounts that failed */
  const failed = handled.filter((result) => !result.ok).length;

  /** The summary file of this run */
  const file = path.join(OUTPUT_FOLDER, `summary-${Date.now()}.json`);

  await fs.mkdir(OUTPUT_FOLDER, { recursive: true });
  await fs.writeFile(
    file,
    JSON.stringify({ note: options.note, accounts: handled }, null, 2),
  );

  console.log(
    styleText(failed ? "yellow" : "green", "Done:"),
    `${handled.length - failed} summarized, ${failed} failed`,
  );
  console.log("Summary saved to", path.resolve(file));
}
