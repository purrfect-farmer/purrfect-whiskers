import * as changeCase from "change-case";

import {
  Combobox,
  ComboboxButton,
  ComboboxInput,
  ComboboxOption,
  ComboboxOptions,
} from "@headlessui/react";
import { HiChevronDown, HiTag, HiXMark } from "react-icons/hi2";
import { memo, useState } from "react";

import { MdLightbulb } from "react-icons/md";
import { cn } from "../lib/utils";
import toast from "react-hot-toast";
import useAppStore from "../store/useAppStore";

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

export default memo(function TagsInput({ value, onChange, disabled = false }) {
  const selectedTags = value || [];

  const tags = useAppStore((state) => state.tags);
  const addTag = useAppStore((state) => state.addTag);

  const [query, setQuery] = useState("");
  const filteredTags = tags.filter(
    (tag) =>
      !selectedTags.includes(tag.id) &&
      tag.name.toLowerCase().includes(query.toLowerCase()),
  );

  const handleTagAdd = (tag) => {
    if (!tag) return;
    const name = tag.name.trim();
    if (name.length === 0) return;

    /* Create new tag object */
    const newTag = {
      id: changeCase.kebabCase(name),
      name,
    };

    /* Check if tag already exists */
    const existingTag = tags.find((item) => item.id === newTag.id);

    /* If tag doesn't exist, add it to the store */
    if (!existingTag) {
      addTag(newTag);
    }

    /* Check if tag is already selected */
    if (selectedTags.includes(newTag.id)) {
      toast.error("Tag already added");
    } else {
      onChange([...selectedTags, newTag.id]);
    }
  };

  /** Remove the tag at the given position */
  const handleTagRemove = (index) => {
    onChange(selectedTags.filter((_, item) => item !== index));
  };

  return (
    <div className="flex flex-wrap gap-2">
      {selectedTags.map((tagId, index) => (
        <div
          key={index}
          className={cn(
            "flex items-center gap-1",
            "p-2",
            "bg-neutral-100 dark:bg-neutral-700",
            "rounded-xl",
          )}
        >
          <HiTag className={cn("size-4", "text-orange-500")} />
          {tags.find((item) => item.id === tagId)?.name || tagId}
          <button
            type="button"
            disabled={disabled}
            onClick={() => handleTagRemove(index)}
            className="text-red-500 hover:text-red-700"
          >
            <HiXMark className="size-4" />
          </button>
        </div>
      ))}
      <Combobox
        immediate
        as={"div"}
        className="relative"
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
            className={cn("p-1 outline-0")}
            placeholder="Add Tag"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />

          {/* Dropdown Button */}
          <ComboboxButton className="group p-1">
            <HiChevronDown className="size-4 group-data-open:rotate-180 transition duration-500" />
          </ComboboxButton>
        </div>

        {/* Dropdown Options */}
        <ComboboxOptions
          anchor="top"
          style={{ pointerEvents: "all" }}
          className={cn(
            "empty:invisible w-72",
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
              Select a tag or create a new one
            </p>
          </div>

          <div className="flex flex-col gap-1">
            {query.length > 0 && (
              <TagOption value={{ id: null, name: query }}>
                Create <span className="font-bold">"{query}"</span>
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
