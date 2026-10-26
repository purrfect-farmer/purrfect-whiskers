import { ALERT_VARIANT } from "../lib/constants";
import * as yup from "yup";

import { Controller, useForm } from "react-hook-form";
import { HiOutlineTrash, HiTag } from "react-icons/hi2";
import { checkTagName, tagNameSchema } from "../../../shared/lib/tagNames";
import { createTag, isTagIdTaken } from "../lib/tags";
import { memo, useState } from "react";

import Alert from "./Alert";
import AppDialogContent from "./AppDialogContent";
import DialogCloseButton from "./DialogCloseButton";
import Input from "./Input";
import { LuTags } from "react-icons/lu";
import { MdAdd } from "react-icons/md";
import { Reorder } from "motion/react";
import ReorderItem from "./ReorderItem";
import { cn, formatNumber } from "../lib/utils";
import SectionBadge from "./SectionBadge";
import SectionHeader from "./SectionHeader";
import toast from "react-hot-toast";
import useAppStore from "../store/useAppStore";
import { yupResolver } from "@hookform/resolvers/yup";

/** The schema of the add tag form */
const schema = yup
  .object({
    name: tagNameSchema(),
  })
  .required();

/** A reorderable tag that can be renamed or deleted */
const TagItem = memo(function TagItem({ tag }) {
  /** Whether the tag name is being edited */
  const [isEditing, setIsEditing] = useState(false);
  const updateTag = useAppStore((state) => state.updateTag);
  const removeTag = useAppStore((state) => state.removeTag);

  /** Renames the tag unless the name is empty or already used */
  const renameTag = (value) => {
    setIsEditing(false);

    const { id, name } = createTag(value);

    /** The problem with the new name, or null */
    const nameError = checkTagName(value);

    if (nameError) {
      toast.error(nameError);
    } else if (isTagIdTaken(useAppStore.getState().tags, id, tag.id)) {
      toast.error("Tag with this name already exists");
    } else if (name !== tag.name) {
      updateTag(tag.id, name);
    }
  };

  return (
    <ReorderItem value={tag} disabled={isEditing}>
      <div className="flex gap-2">
        {isEditing ? (
          <Input
            autoFocus
            defaultValue={tag.name}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                renameTag(e.target.value);
              } else if (e.key === "Escape") {
                setIsEditing(false);
              }
            }}
            onBlur={(e) => isEditing && renameTag(e.target.value)}
          />
        ) : (
          <button
            type="button"
            onClick={() => setIsEditing(true)}
            className={cn(
              "flex items-center gap-2 text-left",
              "p-2 rounded-xl grow min-w-0",
              "bg-neutral-100 dark:bg-neutral-700",
            )}
          >
            <HiTag className="size-4 shrink-0 text-orange-500" />
            <span className="grow min-w-0 truncate">{tag.name}</span>
          </button>
        )}

        {/* Delete Button */}
        <button
          type="button"
          title="Delete Tag"
          className={cn(
            "bg-neutral-100 dark:bg-neutral-700",
            "hover:bg-red-100 hover:text-red-700",
            "dark:hover:bg-red-200 dark:hover:text-red-500",
            "flex items-center justify-center",
            "px-3 rounded-xl shrink-0",
          )}
          onClick={() => removeTag(tag.id)}
        >
          <HiOutlineTrash className="size-4" />
        </button>
      </div>
    </ReorderItem>
  );
});

/** A dialog for adding, renaming, reordering and deleting tags */
export default function TagsDialog() {
  const tags = useAppStore((state) => state.tags);
  const addTag = useAppStore((state) => state.addTag);
  const setTags = useAppStore((state) => state.setTags);

  /** The add tag form */
  const form = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      name: "",
    },
  });

  /** The handler for adding a tag */
  const handleAddTag = (data) => {
    const newTag = createTag(data.name);

    if (isTagIdTaken(tags, newTag.id)) {
      toast.error("Tag with this name already exists");
      return;
    }

    addTag(newTag);
    form.reset();
  };

  return (
    <AppDialogContent
      title={"Tags"}
      description={"Configure Tags"}
      icon={LuTags}
    >
      {/* Add Tag Form */}
      <form
        onSubmit={form.handleSubmit(handleAddTag)}
        className="flex gap-2 min-w-0"
      >
        {/* Tag Name Input */}
        <Controller
          control={form.control}
          name="name"
          render={({ field }) => (
            <Input {...field} placeholder="Enter tag name" />
          )}
        />

        {/* Submit Button */}
        <button
          type="submit"
          className={cn(
            "px-4 py-2 bg-orange-500 text-white rounded-xl",
            "font-bold shrink-0 flex items-center gap-1",
          )}
        >
          <MdAdd className="size-4" />
          Add Tag
        </button>
      </form>

      {/* Total Tags */}
      <SectionHeader
        title="Tags"
        badge={<SectionBadge>{formatNumber(tags.length)}</SectionBadge>}
      />

      {/* Alert */}
      {tags.length === 0 ? (
        <Alert variant={ALERT_VARIANT.WARNING}>
          No tags added yet. You can add tags using the input field above.
        </Alert>
      ) : (
        <>
          {/* Info Alert */}
          <Alert variant={ALERT_VARIANT.INFO}>
            You can reorder tags by dragging and dropping them. Click on a tag
            to edit its name.
          </Alert>
          {/* Tags List */}
          <Reorder.Group
            values={tags}
            onReorder={setTags}
            className={cn(
              "flex flex-col gap-2",
              "max-h-96 overflow-auto -mx-2 px-2",
            )}
          >
            {tags.map((item) => (
              <TagItem key={item.id} tag={item} />
            ))}
          </Reorder.Group>
        </>
      )}

      <DialogCloseButton />
    </AppDialogContent>
  );
}
