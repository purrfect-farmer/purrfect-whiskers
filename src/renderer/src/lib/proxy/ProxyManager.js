import FloxyClient from "./FloxyClient";
import WebshareClient from "./WebshareClient";

export const PROXY_PROVIDERS = [
  { value: "webshare", label: "Webshare" },
  { value: "floxy", label: "Floxy" },
];

export default class ProxyManager {
  constructor({ provider = "webshare", ...options }) {
    this.provider = provider;
    this.client =
      provider === "floxy"
        ? new FloxyClient(options)
        : new WebshareClient(options);
  }

  /** Get Proxies */
  getProxies() {
    return this.client.getProxies();
  }
}
