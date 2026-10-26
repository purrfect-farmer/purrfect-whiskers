/** Characters that must be escaped inside SVG text */
const SVG_ESCAPES = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" };

/** Text made safe for SVG */
const escapeSvg = (text) =>
  String(text).replace(/[&<>"]/g, (char) => SVG_ESCAPES[char]);

/**
 * A small summary card as an SVG data URL, for showing in a prompt.
 * Prompt images may also be PNG, JPEG, WebP or GIF, as a data URL or base64.
 */
export function renderSummaryCard({ title, lines }) {
  /** The text rows of the card */
  const rows = lines
    .map(
      (line, index) =>
        `<text x="20" y="${74 + index * 24}" font-size="16" fill="#44403c">` +
        `${escapeSvg(line)}</text>`,
    )
    .join("");

  /** The height of the card */
  const height = 96 + lines.length * 24;

  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="360" height="${height}" ` +
    `font-family="Noto Sans, Arial, sans-serif">` +
    `<rect width="360" height="${height}" rx="16" fill="#fff7ed"/>` +
    `<rect width="360" height="8" fill="#f97316"/>` +
    `<text x="20" y="44" font-size="20" font-weight="bold" fill="#ea580c">` +
    `${escapeSvg(title)}</text>${rows}</svg>`;

  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}
