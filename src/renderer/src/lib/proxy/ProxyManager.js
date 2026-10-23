import FloxyClient from "./FloxyClient";
import { PROXY_PROVIDER } from "../constants";
import WebshareClient from "./WebshareClient";

export const PROXY_PROVIDERS = [
  { value: PROXY_PROVIDER.WEBSHARE, label: "Webshare" },
  { value: PROXY_PROVIDER.FLOXY, label: "Floxy" },
];

export default class ProxyManager {
  constructor({ provider = PROXY_PROVIDER.WEBSHARE, ...options }) {
    this.provider = provider;
    this.client =
      provider === PROXY_PROVIDER.FLOXY
        ? new FloxyClient(options)
        : new WebshareClient(options);
  }

  /** Get Proxies */
  getProxies() {
    return this.client.getProxies();
  }
}
