import {
  buildTelegramWebLocalStorage,
  destroyClient,
  getLocalTelegramSession,
  loginWithSpider,
} from "./telegramAuth";

import axios from "axios";

/** A client for the Spider number service */
export default class Spider {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.baseUrl = "https://api.spider-service.com";

    /* Axios Instance */
    this.api = axios.create({
      baseURL: this.baseUrl,
    });

    /* Add API Key to Requests */
    this.api.interceptors.request.use((config) => {
      const url = new URL(config.url, config.baseURL);
      url.searchParams.set("apiKay", this.apiKey);

      return { ...config, url: url.pathname + url.search };
    });
  }

  /** Make Action Request, rejecting responses without a result */
  async makeAction(action, params = {}) {
    const { data } = await this.api.get(
      "/?" + new URLSearchParams({ action, ...params }).toString(),
    );

    if (!data || typeof data !== "object" || !("result" in data)) {
      throw new Error(
        data?.message || data?.error || `Invalid Spider response: ${action}`,
      );
    }

    return data.result;
  }

  /** Get Balance */
  getBalance() {
    return this.makeAction("getBalance");
  }

  /** Get Info */
  getInfo() {
    return this.makeAction("getInfo");
  }

  /** Get Countries */
  getCountries() {
    return this.makeAction("getCountrys");
  }

  /** Get Number */
  getNumber(countryCode) {
    return this.makeAction("getNumber", { country: countryCode });
  }

  /** Get Code */
  getCode(hashCode) {
    return this.makeAction("getCode", { ["hash_code"]: hashCode });
  }

  /** Get Wallet */
  getWallet() {
    return this.makeAction("wallet");
  }

  /** Buys a number, logs in to it and prepares its Telegram Web data */
  async purchaseAccount({ countryCode, twoFA, enableLocalTelegramSession }) {
    /** The Spider login result */
    let telegram = null;

    try {
      /** The bought number */
      const account = await this.getNumber(countryCode);

      if (!account?.["phone"]) {
        throw new Error(
          "No account returned from Spider for country " + countryCode,
        );
      }

      telegram = await loginWithSpider({
        account,
        twoFA,
        getCode: (hashCode) => this.getCode(hashCode),
      });

      /** The local Telegram session, when enabled */
      const localTelegram = enableLocalTelegramSession
        ? await getLocalTelegramSession({ telegram, account, twoFA })
        : null;

      const { user, authKey, dcId } = telegram;

      return {
        success: true,
        account,
        user,
        dcId,
        authKey,
        telegramWebLocalStorage: buildTelegramWebLocalStorage(telegram),
        localTelegramSession: localTelegram?.session ?? null,
        enableLocalTelegramSession,
        countryCode,
        twoFA,
      };
    } catch (error) {
      console.error("Error purchasing account:", error);
      return { success: false, error: error.message };
    } finally {
      if (telegram) await destroyClient(telegram.client);
    }
  }
}
