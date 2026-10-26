import fs from "node:fs/promises";
import path from "node:path";
import { styleText } from "node:util";

/** The number of accounts handled at the same time */
const CONCURRENCY = 3;

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

/** A runner of `task` on every item, `limit` at a time, keeping the order */
async function runWithLimit(items, limit, task) {
  /** The result of each item, by position */
  const results = new Array(items.length);

  /** The position of the next item to start */
  let next = 0;

  /** A worker taking items until none are left */
  const worker = async () => {
    while (next < items.length) {
      const index = next++;

      results[index] = await task(items[index], index);
    }
  };

  await Promise.all(Array.from({ length: limit }, worker));

  return results;
}

/** The summary of one account, logged as it is built */
async function summarizeProfile({ account, session }, index, total) {
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
    session ? `${session.length} characters` : "missing",
  );

  await delay(200);

  return {
    partition: account.partition,
    title: account.title,
    telegramId: user?.id ?? null,
    username: user?.username ?? null,
    tags: account.tags ?? [],
    proxy: getProxy(account),
  };
}

/**
 * The example script: summarizes the selected accounts and saves the
 * summary to outputs/. It receives `{ profiles }`, where each profile is
 * `{ account, session }` and `session` is the account's Telegram session.
 */
export default async function ({ profiles }) {
  console.log(styleText("green", `Running on ${profiles.length} account(s)`));

  const results = await runWithLimit(
    profiles,
    CONCURRENCY,
    async (profile, index) => {
      try {
        return {
          ok: true,
          ...(await summarizeProfile(profile, index, profiles.length)),
        };
      } catch (error) {
        console.error(
          styleText("red", `  ${profile.account.title} failed:`),
          error.message,
        );

        return {
          ok: false,
          title: profile.account.title,
          error: error.message,
        };
      }
    },
  );

  /** The number of accounts that failed */
  const failed = results.filter((result) => !result.ok).length;

  /** The summary file of this run */
  const file = path.join(OUTPUT_FOLDER, `summary-${Date.now()}.json`);

  await fs.mkdir(OUTPUT_FOLDER, { recursive: true });
  await fs.writeFile(file, JSON.stringify(results, null, 2));

  console.log(
    styleText(failed ? "yellow" : "green", "Done:"),
    `${results.length - failed} summarized, ${failed} failed`,
  );
  console.log("Summary saved to", path.resolve(file));
}
