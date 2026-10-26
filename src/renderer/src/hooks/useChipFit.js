import { useLayoutEffect, useState } from "react";

/** The fit before anything is measured */
const FIT_ALL = { count: Infinity, hidden: 0 };

/**
 * A hook for fitting chips into `rows` rows with a trailing "+N" chip.
 * `ref` is a measuring list holding every chip, then a sample "+N" chip.
 */
export default function useChipFit(ref, rows, ...contents) {
  /** The number of chips shown and the number left out */
  const [fit, setFit] = useState(FIT_ALL);

  useLayoutEffect(() => {
    const element = ref.current;

    if (!element) return;

    /** The measure of how many chips fit beside the "+N" chip */
    const measure = () => {
      const chips = [...element.children];
      const sample = chips.pop();

      if (!sample || chips.length === 0) {
        setFit(FIT_ALL);
        return;
      }

      /** The tops of the rows, in order */
      const rowTops = [...new Set(chips.map((chip) => chip.offsetTop))];

      /** The row of each chip */
      const chipRows = chips.map((chip) => rowTops.indexOf(chip.offsetTop));

      /** The number of chips in the first `rows` rows */
      let count = chipRows.filter((row) => row < rows).length;

      if (count === chips.length) {
        setFit((prev) => (prev === FIT_ALL ? prev : FIT_ALL));
        return;
      }

      /** The gap between chips in a row */
      const gap = parseFloat(getComputedStyle(element).columnGap) || 0;

      /** The room the "+N" chip needs after a chip */
      const needed = gap + sample.offsetWidth;

      while (count > 0) {
        const last = chips[count - 1];

        /** Whether the "+N" chip starts the last row or fits after `last` */
        const fits =
          chipRows[count - 1] < rows - 1 ||
          last.offsetLeft + last.offsetWidth + needed <= element.clientWidth;

        if (fits) break;

        count--;
      }

      /** The chips left out */
      const hidden = chips.length - count;

      setFit((prev) =>
        prev.count === count && prev.hidden === hidden
          ? prev
          : { count, hidden },
      );
    };

    measure();

    const observer = new ResizeObserver(measure);

    observer.observe(element);

    return () => observer.disconnect();
  }, [ref, rows, ...contents]);

  return fit;
}
