import { memo, useMemo } from "react";

import Anser from "anser";
import { cn } from "../lib/utils";

/** The escape character starting an ANSI code */
const ESCAPE = "\u001b";

/** The options for parsing ANSI codes into parts */
const ANSER_OPTIONS = { json: true, remove_empty: true };

/** The classes of each ANSI decoration */
const DECORATION_CLASSES = {
  bold: "font-bold",
  dim: "opacity-60",
  italic: "italic",
  underline: "underline",
  strikethrough: "line-through",
  hidden: "invisible",
};

/** A CSS colour from an anser "r, g, b" value */
const toColor = (value) => (value ? `rgb(${value})` : undefined);

/** The parts of a line, with their colours and decorations */
const AnsiParts = memo(function AnsiParts({ text }) {
  /** The parsed parts of the line */
  const parts = useMemo(() => Anser.ansiToJson(text, ANSER_OPTIONS), [text]);

  return parts.map((part, index) => (
    <span
      key={index}
      className={cn(part.decorations.map((name) => DECORATION_CLASSES[name]))}
      style={{
        color: toColor(part.fg_truecolor || part.fg),
        backgroundColor: toColor(part.bg_truecolor || part.bg),
      }}
    >
      {part.content}
    </span>
  ));
});

/** A line of text showing its ANSI colours and decorations */
export default memo(function AnsiText({ text }) {
  return text.includes(ESCAPE) ? <AnsiParts text={text} /> : text;
});
