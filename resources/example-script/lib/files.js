import fs from "node:fs/promises";
import path from "node:path";

/** The number of lines in each file, or the error reading it */
export async function countLines(files) {
  return Promise.all(
    files.map(async (file) => {
      try {
        const text = await fs.readFile(file, "utf8");

        return { file: path.basename(file), lines: text.split("\n").length };
      } catch (error) {
        return { file: path.basename(file), error: error.message };
      }
    }),
  );
}
