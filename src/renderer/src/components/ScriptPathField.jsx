import { LuFile, LuFolderOpen, LuSave, LuX } from "react-icons/lu";

import { Controller } from "react-hook-form";
import { FIELD_TYPE } from "../../../shared/lib/scriptFields";
import FormField from "./FormField";
import IconButton from "./IconButton";
import Input from "./Input";
import { cn } from "../lib/utils";
import { memo, useCallback } from "react";
import useScriptPathField from "../hooks/useScriptPathField";

/** The Browse button's icon and label for each path field type */
const BROWSE = {
  [FIELD_TYPE.FILE]: { icon: LuFile, title: "Choose File" },
  [FIELD_TYPE.FOLDER]: { icon: LuFolderOpen, title: "Choose Folder" },
  [FIELD_TYPE.SAVE]: { icon: LuSave, title: "Choose Where to Save" },
};

/** The text shown when a field has no path */
const EMPTY_TEXT = {
  [FIELD_TYPE.FILE]: "No file chosen",
  [FIELD_TYPE.FOLDER]: "No folder chosen",
  [FIELD_TYPE.SAVE]: "No location chosen",
};

/** The last part of a path */
const getBaseName = (path) => path.split(/[\\/]/).pop();

/** A chosen file of a multiple field, with its folder and a remove button */
const PathRow = memo(function PathRow({ path, disabled, onRemove }) {
  /** The handler for removing the file */
  const removePath = useCallback(() => onRemove(path), [onRemove, path]);

  return (
    <li
      className={cn(
        "flex items-center gap-2 min-w-0 p-2 rounded-xl",
        "bg-neutral-100 dark:bg-neutral-700",
      )}
      title={path}
    >
      <LuFile className="size-4 shrink-0 text-orange-500" />
      <span className="flex flex-col grow min-w-0">
        <span className="truncate font-bold">{getBaseName(path)}</span>
        <span
          className={cn(
            "truncate text-xs",
            "text-neutral-500 dark:text-neutral-400",
          )}
        >
          {path}
        </span>
      </span>
      <IconButton
        title="Remove"
        disabled={disabled}
        onClick={removePath}
        className="p-1.5"
      >
        <LuX className="size-4" />
      </IconButton>
    </li>
  );
});

/** The control of a path field: a path box, or a list of files */
const PathControl = memo(function PathControl({
  field,
  value,
  onChange,
  disabled,
}) {
  const { browse, remove, dropProps, isDragging } = useScriptPathField(
    field,
    value,
    onChange,
  );

  const { icon: BrowseIcon, title: browseTitle } = BROWSE[field.type];

  /** The handler for clearing a single path */
  const clear = useCallback(() => remove(value), [remove, value]);

  /** The browse button */
  const browseButton = (
    <IconButton title={browseTitle} disabled={disabled} onClick={browse}>
      <BrowseIcon className="size-4" />
    </IconButton>
  );

  return (
    <div
      {...(disabled ? {} : dropProps)}
      className={cn(
        "flex flex-col gap-2 min-w-0 rounded-xl",
        isDragging && "outline-2 outline-dashed outline-orange-500",
      )}
    >
      {field.multiple ? (
        <>
          {value.length > 0 ? (
            <ul className="flex flex-col gap-1 min-w-0">
              {value.map((path) => (
                <PathRow
                  key={path}
                  path={path}
                  disabled={disabled}
                  onRemove={remove}
                />
              ))}
            </ul>
          ) : null}
          <div className="flex items-center gap-2 min-w-0">
            <p className="grow min-w-0 text-neutral-500 dark:text-neutral-400">
              {value.length > 0
                ? `${value.length} file(s)`
                : "Drop files here, or choose them"}
            </p>
            {browseButton}
          </div>
        </>
      ) : (
        <div className="flex gap-2 min-w-0">
          <Input
            readOnly
            value={value}
            title={value || undefined}
            placeholder={EMPTY_TEXT[field.type]}
            disabled={disabled}
            className="text-ellipsis"
          />
          {value ? (
            <IconButton title="Clear" disabled={disabled} onClick={clear}>
              <LuX className="size-4" />
            </IconButton>
          ) : null}
          {browseButton}
        </div>
      )}
    </div>
  );
});

/** A file, folder or save field bound to a form */
export default memo(function ScriptPathField({ field, disabled }) {
  return (
    <Controller
      name={field.key}
      render={({ field: control, fieldState }) => (
        <FormField
          label={field.label}
          description={field.description}
          error={fieldState.error?.message}
        >
          <PathControl
            field={field}
            value={control.value}
            onChange={control.onChange}
            disabled={disabled}
          />
        </FormField>
      )}
    />
  );
});
