import fs from "node:fs/promises";
import path from "node:path";

/** The folder reports are saved to, inside the script's folder */
const OUTPUT_FOLDER = "outputs";

/** The columns of a CSV report */
const CSV_COLUMNS = [
  "title",
  "username",
  "tags",
  "proxy",
  "session",
  "storedItems",
  "error",
];

/** A value quoted for a CSV cell */
function toCsvCell(value) {
  const text = Array.isArray(value)
    ? value.join(" ")
    : value === null || value === undefined
      ? ""
      : String(value);

  return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

/** The report as CSV text */
function toCsv(rows) {
  return [
    CSV_COLUMNS.join(","),
    ...rows.map((row) =>
      CSV_COLUMNS.map((key) => toCsvCell(row[key])).join(","),
    ),
  ].join("\n");
}

/** A file name made of safe characters */
const toFileName = (text) =>
  text
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/^-|-$/g, "") || "report";

/**
 * Saves the report to `folder`, or outputs/ next to the script, and copies
 * it to `copyTo` when given. Resolves with the report's full path.
 */
export async function saveReport({ name, format, note, rows, folder, copyTo }) {
  /** The folder the report is saved to */
  const target = folder || OUTPUT_FOLDER;

  /** The report file */
  const file = path.join(target, `${toFileName(name)}-${Date.now()}.${format}`);

  /** The file's content */
  const content =
    format === "csv"
      ? toCsv(rows)
      : JSON.stringify({ note, accounts: rows }, null, 2);

  await fs.mkdir(target, { recursive: true });
  await fs.writeFile(file, `${content}\n`);

  if (copyTo) await fs.copyFile(file, copyTo);

  return path.resolve(file);
}
