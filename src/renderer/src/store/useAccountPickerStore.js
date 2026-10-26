import { create } from "zustand";
import { uuid } from "../lib/utils";

/**
 * The account picker requests, waiting for the user's choice, oldest first
 * A request is { id, source, title, description, requireTelegram, onAnswer }
 */
export default create((set, get) => ({
  /** The waiting requests */
  requests: [],

  /** Queues a request */
  request: ({
    source,
    title = "",
    description = "",
    requireTelegram = false,
    onAnswer,
  }) => {
    set((state) => ({
      requests: [
        ...state.requests,
        { id: uuid(), source, title, description, requireTelegram, onAnswer },
      ],
    }));
  },

  /** Answers a request with the picked accounts, or cancels it with null */
  answer: (id, accounts) => {
    const request = get().requests.find((item) => item.id === id);

    if (!request) return;

    set((state) => ({
      requests: state.requests.filter((item) => item.id !== id),
    }));

    request.onAnswer(accounts);
  },

  /** Removes the waiting requests of a source that has gone away */
  dropFor: (source) => {
    set((state) => ({
      requests: state.requests.filter((item) => item.source !== source),
    }));
  },
}));

/** The oldest waiting request, or null */
export const selectPickerRequest = (state) => state.requests[0] ?? null;
