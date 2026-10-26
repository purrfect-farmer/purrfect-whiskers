import { BrowserWindow, Notification } from "electron";
import { PROMPT_SUBMIT, validateAnswer } from "../../shared/lib/scriptPrompts";
import {
  SCRIPT_API,
  SCRIPT_EVENT,
  SCRIPT_HOST_MESSAGE,
  SCRIPT_STORAGE_API,
} from "../../shared/constants/ipc";

import { ScriptStorage } from "../libs/scriptStorage";
import { checkPathValues } from "../libs/scriptPaths";
import { checkRequest } from "../libs/scriptRuns";

/** The requests of one script run waiting for the renderer, and its prompts */
export class ScriptRequests {
  /** The requests waiting for an answer, by id */
  pending = new Map();

  /** The timers closing prompts that have a timeout, by id */
  promptTimers = new Map();

  /** The system notification of a waiting prompt */
  notification = null;

  /** The requests of `run`, sending run events with `emit` */
  constructor(run, emit) {
    this.run = run;
    this.emit = emit;
    this.storage = new ScriptStorage(run.name);
  }

  /** Answers a storage request from the script's storage */
  async answerStorage({ id, method, args }) {
    try {
      const result =
        method === SCRIPT_API.STORAGE_GET
          ? await this.storage.get(args[0])
          : await this.storage.set(args[0], args[1]);

      this.reply(id, { result });
    } catch (error) {
      this.reply(id, { error: error.message });
    }
  }

  /** Sends a script's request to the renderer, or answers it with an error */
  forward(message) {
    if (!Number.isInteger(message.id)) return;

    const { request, error } = checkRequest(message, this.run.partitions);

    if (error) {
      this.reply(message.id, { error });
      return;
    }

    if (this.run.stopping && request.method === SCRIPT_API.PROMPT) {
      this.reply(request.id, { result: null });
      return;
    }

    if (SCRIPT_STORAGE_API.includes(request.method)) {
      this.answerStorage(request);
      return;
    }

    this.pending.set(request.id, request);
    this.emit(SCRIPT_EVENT.REQUEST, request);

    if (request.method === SCRIPT_API.PROMPT) {
      this.notifyPrompt(request.args[0]);
    }

    if (request.expiresAt) {
      this.promptTimers.set(
        request.id,
        setTimeout(
          () => this.closePrompt(request.id),
          request.expiresAt - Date.now(),
        ),
      );
    }
  }

  /** Answers a pending request with the renderer's result or error */
  respond({ id, result, error }) {
    const request = this.pending.get(id);

    if (!request) return;

    this.pending.delete(id);
    clearTimeout(this.promptTimers.get(id));
    this.promptTimers.delete(id);
    this.clearNotification();

    if (
      !error &&
      request.method === SCRIPT_API.ADD_ACCOUNT &&
      typeof result?.partition === "string"
    ) {
      this.run.partitions.add(result.partition);
    }

    if (error) {
      this.reply(id, { error });
    } else if (request.method === SCRIPT_API.PROMPT && result !== null) {
      this.replyToPrompt(request, result);
    } else {
      this.reply(id, { result: result ?? null });
    }
  }

  /** Answers a prompt with its checked answer, or the error refusing it */
  async replyToPrompt(request, answer) {
    /** The prompt being answered */
    const prompt = request.args[0];
    /** The checked answer, or its error */
    const payload = validateAnswer(prompt, answer);

    if (payload.result?.action === PROMPT_SUBMIT) {
      const pathError = await checkPathValues(
        prompt.fields,
        payload.result.values,
      );

      if (pathError) {
        this.reply(request.id, { error: pathError });
        return;
      }
    }

    this.reply(request.id, payload);
  }

  /** Posts the answer of a request to the script's process */
  reply(id, payload) {
    if (!this.run.ended) {
      this.run.child.postMessage({
        type: SCRIPT_HOST_MESSAGE.RESPONSE,
        id,
        ...payload,
      });
    }
  }

  /** Shows a system notification for a prompt while the window is unfocused */
  notifyPrompt(prompt) {
    /** The window showing the run */
    const window = BrowserWindow.fromWebContents(this.run.receiver);

    if (!window || window.isFocused() || !Notification.isSupported()) return;

    this.notification?.close();
    this.notification = new Notification({
      title: `${this.run.displayName} needs your input`,
      body: prompt.title,
    });

    this.notification.on("click", () => {
      window.show();
      window.focus();
      this.emit(SCRIPT_EVENT.SHOW_PROMPT);
    });
    this.notification.show();
  }

  /** Closes the prompt notification once no prompt is waiting */
  clearNotification() {
    /** Whether a prompt is still waiting */
    const isPromptWaiting = [...this.pending.values()].some(
      (request) => request.method === SCRIPT_API.PROMPT,
    );

    if (isPromptWaiting) return;

    this.notification?.close();
    this.notification = null;
  }

  /** Closes an open prompt with no answer */
  closePrompt(id) {
    clearTimeout(this.promptTimers.get(id));
    this.promptTimers.delete(id);

    if (!this.pending.delete(id)) return;

    this.reply(id, { result: null });
    this.emit(SCRIPT_EVENT.PROMPT_CLOSED, { id });
    this.clearNotification();
  }

  /** Closes every open prompt with no answer */
  closePrompts() {
    for (const request of this.pending.values()) {
      if (request.method === SCRIPT_API.PROMPT) this.closePrompt(request.id);
    }
  }

  /** Sends every pending request again, to a reattached window */
  resend() {
    for (const request of this.pending.values()) {
      this.emit(SCRIPT_EVENT.REQUEST, request);
    }
  }

  /** Drops every pending request, timer and notification of an ended run */
  dispose() {
    this.pending.clear();
    this.clearNotification();

    for (const timer of this.promptTimers.values()) clearTimeout(timer);
  }
}
