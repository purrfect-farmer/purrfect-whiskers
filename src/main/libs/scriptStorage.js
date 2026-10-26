import { app } from "electron";
import fs from "fs/promises";
import path from "path";

/** The largest storage a script can keep, in characters of JSON */
const MAX_STORAGE_LENGTH = 5_000_000;

/** The values one script keeps between runs, saved as JSON in the app's data */
export class ScriptStorage {
  /** The values by key, read on first use */
  values = null;

  /** The last queued write; writes run one at a time */
  writes = Promise.resolve();

  /** The storage of the script in the folder `name` */
  constructor(name) {
    this.file = path.join(
      app.getPath("userData"),
      "script-storage",
      `${encodeURIComponent(name)}.json`,
    );
  }

  /** The stored values, read from disk once */
  async load() {
    if (this.values) return this.values;

    try {
      const data = JSON.parse(await fs.readFile(this.file, "utf8"));

      this.values = data && typeof data === "object" ? data : {};
    } catch {
      this.values = {};
    }

    return this.values;
  }

  /** The value of a key, or null */
  async get(key) {
    const values = await this.load();

    return Object.hasOwn(values, key) ? values[key] : null;
  }

  /** Saves a value, removing the key when the value is null */
  set(key, value) {
    /** This write, after the ones before it */
    const write = this.writes.then(() => this.write(key, value));

    this.writes = write.catch(() => {});

    return write;
  }

  /** Writes one change to disk and keeps it */
  async write(key, value) {
    /** The values with the change */
    const next = { ...(await this.load()) };

    if (value === null) {
      delete next[key];
    } else {
      next[key] = value;
    }

    /** The values as JSON */
    const json = JSON.stringify(next);

    if (json.length > MAX_STORAGE_LENGTH) {
      throw new Error("The script's storage is full (5 MB)");
    }

    await fs.mkdir(path.dirname(this.file), { recursive: true });
    await fs.writeFile(`${this.file}.tmp`, json);
    await fs.rename(`${this.file}.tmp`, this.file);

    this.values = next;

    return null;
  }
}
