import { AuthKey } from "telegram/crypto/AuthKey";
import { StringSession } from "telegram/sessions";

/** The address of each Telegram data centre, by id */
const TELEGRAM_DC_ADDRESSES = Object.freeze({
  1: "149.154.175.53",
  2: "149.154.167.51",
  3: "149.154.175.100",
  4: "149.154.167.91",
  5: "91.108.56.130",
});

/** The port of Telegram's data centres */
const TELEGRAM_DC_PORT = 443;

/** The storage key of Telegram Web K's signed-in account */
const WEB_K_ACCOUNT_KEY = "account1";

/** The pattern of a hex-encoded 256-byte auth key */
const AUTH_KEY_PATTERN = /^[0-9a-f]{512}$/i;

/** The Web K account entry, stored as JSON text or as an object */
function readWebKAccount(storage) {
  const entry = storage?.[WEB_K_ACCOUNT_KEY];

  return typeof entry === "string" ? JSON.parse(entry) : (entry ?? null);
}

/** A GramJS string session from Telegram Web K's storage, or null */
export async function sessionFromTelegramWeb(storage) {
  try {
    const account = readWebKAccount(storage);

    /** The account's data centre */
    const dcId = Number(account?.dcId);

    /** The address of the data centre */
    const address = TELEGRAM_DC_ADDRESSES[dcId];

    /** The hex auth key of the data centre */
    const authKeyHex = account?.[`dc${dcId}_auth_key`];

    if (!address || !AUTH_KEY_PATTERN.test(authKeyHex ?? "")) return null;

    /** The auth key */
    const authKey = new AuthKey();

    await authKey.setKey(Buffer.from(authKeyHex, "hex"));

    /** The session built from the data centre and key */
    const session = new StringSession("");

    session.setDC(dcId, address, TELEGRAM_DC_PORT);
    session.authKey = authKey;

    return session.save();
  } catch {
    return null;
  }
}
