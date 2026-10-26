import axios from "axios";

/** The most pages followed */
const MAX_PAGES = 100;

/** A client for the Webshare proxy API */
export default class WebshareClient {
  constructor({ apiKey, pageSize = 100 }) {
    this.pageSize = pageSize;
    this.client = axios.create({
      baseURL: "https://proxy.webshare.io/api/v2",
      headers: {
        Authorization: `Token ${apiKey}`,
      },
    });
  }

  /** Get a single page of proxies */
  async getPage(page) {
    const { data } = await this.client.get("/proxy/list/", {
      params: {
        ["mode"]: "direct",
        ["valid"]: true,
        ["page"]: page,
        ["page_size"]: this.pageSize,
      },
    });
    return data;
  }

  /** Get all proxies (follows pagination) */
  async getProxies() {
    /** The proxies of every page */
    const proxies = [];

    for (let page = 1; page <= MAX_PAGES; page++) {
      const data = await this.getPage(page);
      /** The proxies of the page */
      const results = data?.results ?? [];

      proxies.push(
        ...results.map((item) => ({
          host: item["proxy_address"],
          port: item["port"],
          username: item["username"],
          password: item["password"],
          countryCode: item["country_code"] || null,
          city: item["city_name"] || null,
          valid: item["valid"],
          lastVerification: item["last_verification"] || null,
          createdAt: item["created_at"] || null,
          id: item["id"],
        })),
      );

      if (!data?.next || results.length === 0) break;
    }

    return proxies;
  }
}
