import {
  Combobox,
  ComboboxButton,
  ComboboxInput,
  ComboboxOption,
  ComboboxOptions,
} from "@headlessui/react";
import { HiChevronDown, HiTag, HiXMark } from "react-icons/hi2";
import { memo, useMemo, useState } from "react";

import { MdLightbulb } from "react-icons/md";
import { cn } from "../lib/utils";
import { createTag } from "../lib/tags";
import toast from "react-hot-toast";
import useAppStore from "../store/useAppStore";

/** The empty list of selected tags */
const NO_TAGS = [];

/** A tag option in the suggestions */
const TagOption = (props) => (
  <ComboboxOption
    {...props}
    className={cn(
      "p-2 bg-neutral-100 dark:bg-neutral-800 rounded-xl cursor-pointer",
      "data-focus:bg-orange-500 data-focus:text-white group",
      "truncate flex items-center gap-2",
    )}
  >
    <HiTag
      className={cn(
        "size-4 shrink-0",
        "text-orange-500 group-data-active:text-white",
      )}
    />{" "}
    {props.children}
  </ComboboxOption>
);

/** A combobox input for selecting and creating tags */
export default memo(function TagsInput({
  value,
  onChange,
  disabled = false,
  allowCreate = true,
  placeholder = "Add Tag",
}) {
  /** The selected tag ids */
  const selectedTags = value || NO_TAGS;

  const tags = useAppStore((state) => state.tags);
  const addTag = useAppStore((state) => state.addTag);

  /** The search query */
  const [query, setQuery] = useState("");

  /** Tag names by id */
  const tagNames = useMemo(
    () => new Map(tags.map((tag) => [tag.id, tag.name])),
    [tags],
  );

  /** Unselected tags matching the query */
  const filteredTags = useMemo(() => {
    const selected = new Set(selectedTags);
    const term = query.toLowerCase();

    return tags.filter(
      (tag) => !selected.has(tag.id) && tag.name.toLowerCase().includes(term),
    );
  }, [tags, selectedTags, query]);

  /** The handler for adding a selected or new tag */
  const handleTagAdd = (tag) => {
    if (!tag) return;

    const newTag = createTag(tag.name);

    if (newTag.name.length === 0) return;

    /* Add new tags to the store */
    if (!tagNames.has(newTag.id)) {
      if (!allowCreate) return;

      addTag(newTag);
    }

    if (selectedTags.includes(newTag.id)) {
      toast.error("Tag already added");
    } else {
      onChange([...selectedTags, newTag.id]);
    }
  };

  /** The handler for removing a selected tag */
  const handleTagRemove = (tagId) => {
    onChange(selectedTags.filter((item) => item !== tagId));
  };

  return (
    <div className="flex flex-wrap gap-2 min-w-0">
      {selectedTags.map((tagId) => (
        <div
          key={tagId}
          className={cn(
            "flex items-center gap-1 min-w-0 max-w-full",
            "p-2",
            "bg-neutral-100 dark:bg-neutral-700",
            "rounded-xl",
          )}
        >
          <HiTag className="size-4 shrink-0 text-orange-500" />
          <span className="truncate">{tagNames.get(tagId) || tagId}</span>
          <button
            type="button"
            title="Remove Tag"
            disabled={disabled}
            onClick={() => handleTagRemove(tagId)}
            className="shrink-0 text-red-500 hover:text-red-700"
          >
            <HiXMark className="size-4" />
          </button>
        </div>
      ))}
      <Combobox
        immediate
        as={"div"}
        className="relative min-w-0 max-w-full"
        disabled={disabled}
        onClose={() => {
          setQuery("");
        }}
        onChange={handleTagAdd}
      >
        <div className="flex bg-neutral-100 dark:bg-neutral-700 rounded-xl p-1">
          <ComboboxInput
            aria-label="Tag"
            displayValue={(tag) => tag?.name}
            className={cn("p-1 outline-0 min-w-0")}
            placeholder={placeholder}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />

          {/* Dropdown Button */}
          <ComboboxButton className="group p-1 shrink-0">
            <HiChevronDown className="size-4 group-data-open:rotate-180 transition duration-500" />
          </ComboboxButton>
        </div>

        {/* Dropdown Options */}
        <ComboboxOptions
          anchor="top"
          style={{ pointerEvents: "all" }}
          className={cn(
            "empty:invisible w-72 max-w-[calc(100vw-2rem)]",
            "bg-white dark:bg-neutral-900",
            "flex flex-col gap-2 max-h-56 z-100",
            "rounded-xl p-2",
          )}
        >
          <div className="flex flex-col">
            <h3 className="font-bold text-xs text-center flex items-center justify-center gap-2">
              <MdLightbulb className="size-4" /> Suggestions (
              {filteredTags.length})
            </h3>
            <p className="text-neutral-500 dark:text-neutral-400 text-center text-xs">
              {allowCreate
                ? "Select a tag or create a new one"
                : "Select a tag"}
            </p>
          </div>

          <div className="flex flex-col gap-1">
            {allowCreate && query.length > 0 && (
              <TagOption value={{ id: null, name: query }}>
                Create <span className="font-bold">&quot;{query}&quot;</span>
              </TagOption>
            )}
            {filteredTags.map((tag) => (
              <TagOption key={tag.id} value={tag}>
                {tag.name}
              </TagOption>
            ))}
          </div>
        </ComboboxOptions>
      </Combobox>
    </div>
  );
});
