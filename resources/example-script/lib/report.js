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

/** Saves the report to outputs/, returning its full path */
export async function saveReport({ name, format, note, rows }) {
  /** The report file */
  const file = path.join(
    OUTPUT_FOLDER,
    `${toFileName(name)}-${Date.now()}.${format}`,
  );

  /** The file's content */
  const content =
    format === "csv"
      ? toCsv(rows)
      : JSON.stringify({ note, accounts: rows }, null, 2);

  await fs.mkdir(OUTPUT_FOLDER, { recursive: true });
  await fs.writeFile(file, `${content}\n`);

  return path.resolve(file);
}
