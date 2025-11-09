import axios from "axios";

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

  /** Make Action Request */
  makeAction(action, params = {}) {
    return this.api
      .get("/?" + new URLSearchParams({ action, ...params }).toString())
      .then((res) => res.data.result);
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
}
