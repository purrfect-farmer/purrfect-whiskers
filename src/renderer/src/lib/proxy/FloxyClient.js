import axios from "axios";

/** Plan type whose proxies are fetched */
const DEDICATED_DATACENTER_PLAN = "DEDICATED_DATACENTER";

/** Port of every Floxy proxy */
const PROXY_PORT = 1338;

export default class FloxyClient {
  constructor({ apiKey }) {
    this.client = axios.create({
      baseURL: "https://api.floxy.io",
      headers: {
        "X-API-Key": apiKey,
        "Content-Type": "application/json",
      },
    });
  }

  /** Get Active Plans */
  async getActivePlans() {
    const { data } = await this.client.get("/plans/summary");
    return data.active || [];
  }

  /** Get Plan */
  async getPlan(planId) {
    const { data } = await this.client.get(`/plans/get/${planId}`);
    return data;
  }

  /** Get Plan Proxies */
  async getPlanProxies(planId) {
    const details = await this.getPlan(planId);
    const { username, password } = details.authorization ?? {};

    /** Flat map the IPs, keeping their location */
    return (details["ip_list"] || []).flatMap((item) =>
      (item.cities || []).flatMap((city) =>
        (city.ips || []).map((ip) => ({
          host: ip,
          port: PROXY_PORT,
          username,
          password,
          countryCode: item["country_code"] || item["country"] || null,
          city: city["name"] || city["city"] || null,
        })),
      ),
    );
  }

  /** Get Proxies from all active dedicated datacenter plans */
  async getProxies() {
    const plans = await this.getActivePlans();
    const dedicated = plans.filter(
      (plan) => plan.type === DEDICATED_DATACENTER_PLAN,
    );

    const results = await Promise.all(
      dedicated.map((plan) => this.getPlanProxies(plan.id)),
    );

    return results.flat();
  }
}
