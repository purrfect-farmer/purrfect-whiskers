import { Api } from "telegram";
import { EditedMessage } from "telegram/events/EditedMessage";
import { NewMessage } from "telegram/events";
import { StringSession } from "telegram/sessions";
import { createTelegramClient, destroyClient } from "./client";

/**
 * A live Telegram Web-K client for an existing account session.
 * The one seam the app's logic uses to reach the `telegram` package.
 */
export default class TelegramWebClient {
  constructor(session) {
    /** The underlying GramJS client */
    this.client = createTelegramClient(new StringSession(session));
  }

  /** Connects the client to Telegram */
  connect() {
    return this.client.connect();
  }

  /** Destroys the client, logging instead of throwing */
  destroy() {
    return destroyClient(this.client);
  }

  /** The signed-in user */
  getMe() {
    return this.client.getMe();
  }

  /** The resolved entity of a username or id */
  getEntity(target) {
    return this.client.getEntity(target);
  }

  /** Sends a text message to an entity */
  sendMessage(entity, message) {
    return this.client.sendMessage(entity, { message });
  }

  /** The account's 2FA state */
  getPasswordState() {
    return this.client.invoke(new Api.account.GetPassword());
  }

  /** Removes the account's 2FA, given its current password */
  removeTwoFa(currentPassword) {
    return this.client.updateTwoFaSettings({
      currentPassword,
      newPassword: undefined,
      email: "",
      hint: "",
    });
  }

  /** The account's dialogs */
  getDialogs() {
    return this.client.getDialogs({});
  }

  /** Deletes a peer's whole history, batch by batch */
  async deleteHistory(peer, { revoke = false } = {}) {
    /** The offset left after each batch */
    let offset;

    do {
      const result = await this.client.invoke(
        new Api.messages.DeleteHistory({ peer, revoke, maxId: 0 }),
      );

      offset = result.offset;
    } while (offset > 0);
  }

  /** Removes a dialog: leave a channel or group, delete a private chat */
  async removeDialog(dialog, { block = false } = {}) {
    /** The dialog's entity */
    const entity = dialog.entity;

    /* Leave a channel or supergroup */
    if (entity instanceof Api.Channel) {
      await this.client.invoke(
        new Api.channels.LeaveChannel({ channel: entity }),
      );
      return;
    }

    /* Leave a basic group still joined */
    if (entity instanceof Api.Chat && !entity.left && !entity.deactivated) {
      await this.client.invoke(
        new Api.messages.DeleteChatUser({
          chatId: entity.id,
          userId: new Api.InputUserSelf(),
        }),
      );
    }

    /* Drop a basic group from the list */
    if (!(entity instanceof Api.User)) {
      await this.deleteHistory(entity);
      return;
    }

    /* Clear a private chat or bot */
    await this.deleteHistory(entity, { revoke: true });

    /* Block it */
    if (block) {
      await this.client.invoke(new Api.contacts.Block({ id: entity }));
    }
  }

  /** The devices signed in to the account */
  async getAuthorizations() {
    const result = await this.client.invoke(
      new Api.account.GetAuthorizations(),
    );

    return result.authorizations;
  }

  /** Terminates one device by its hash */
  terminateAuthorization(hash) {
    return this.client.invoke(new Api.account.ResetAuthorization({ hash }));
  }

  /** Logs the current session out */
  logout() {
    return this.client.invoke(new Api.auth.LogOut({}));
  }

  /**
   * Listens for messages from `fromUsers`, new and edited.
   * Returns the unsubscribe.
   */
  onMessage(fromUsers, handler) {
    /** The new and edited message events to listen for */
    const events = [
      new NewMessage({ fromUsers }),
      new EditedMessage({ fromUsers }),
    ];

    events.forEach((event) => this.client.addEventHandler(handler, event));

    return () =>
      events.forEach((event) => this.client.removeEventHandler(handler, event));
  }

  /**
   * Resolves with the next message from `entity` that passes `filter`,
   * or rejects after `timeout`.
   */
  waitForReply(entity, { filter, timeout } = {}) {
    return new Promise((resolve, reject) => {
      /** The timeout timer */
      const timer = setTimeout(() => {
        unsubscribe();
        reject(new Error("Timed out waiting for the bot's reply"));
      }, timeout);

      /** Resolves with the first matching message */
      const handler = (event) => {
        const message = event.message;

        if (message && (!filter || filter(message))) {
          clearTimeout(timer);
          unsubscribe();
          resolve(message);
        }
      };

      /** The removal of the handler */
      const unsubscribe = this.onMessage([entity], handler);
    });
  }
}
