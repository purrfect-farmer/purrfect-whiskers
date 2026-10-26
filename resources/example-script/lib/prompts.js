import { renderSummaryCard } from "./card.js";

/** How long the note prompt waits before closing by itself, in seconds */
const NOTE_TIMEOUT = 120;

/**
 * Asks for the report's note with api.prompt: an image, a field, an extra
 * button and a timeout. Resolves with the note, or `fallback` when the user
 * cancels, presses "No note", the prompt times out or the run stops.
 */
export async function askForNote(api, { accounts, tagCount, fallback }) {
  const answer = await api.prompt({
    title: "Add a note to the report?",
    description: `Closes by itself after ${NOTE_TIMEOUT} seconds`,
    image: renderSummaryCard({
      title: "This run",
      lines: [`${accounts.length} account(s)`, `${tagCount} tag(s) saved`],
    }),
    timeout: NOTE_TIMEOUT,
    actions: [{ value: "none", label: "No note" }],
    fields: [
      {
        key: "note",
        type: "textarea",
        label: "Note",
        placeholder: "Anything to keep with the report",
        default: fallback,
      },
    ],
  });

  // null: cancelled, timed out or stopped
  if (!answer || answer.action === "none") return fallback;

  return answer.values.note;
}

/**
 * Asks whether to keep an account that has no Telegram user, with the
 * account named on the prompt (`partition`). Resolves with true to keep it.
 */
export async function askToKeepAccount(api, account, isOpen = false) {
  const answer = await api.prompt({
    title: "Keep this account in the report?",
    description: isOpen
      ? "It has no Telegram user yet; it's open so you can check it"
      : "It has no Telegram user yet",
    partition: account.partition,
    actions: [{ value: "leave-out", label: "Leave out" }],
  });

  return answer?.action === "submit";
}
