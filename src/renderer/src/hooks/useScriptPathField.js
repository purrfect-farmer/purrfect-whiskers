import { useCallback, useMemo, useState } from "react";

import { FIELD_TYPE } from "../../../shared/lib/scriptFields";
import { IPC } from "../../../shared/constants/ipc";
import { hasAllowedExtension } from "../../../shared/lib/scriptPathFields";
import toast from "react-hot-toast";

/** The last part of a path */
const getBaseName = (path) => path.split(/[\\/]/).pop();

/** The allowed extensions of a field, as ".csv, .json or .txt" */
const listExtensions = (extensions) => {
  /** The extensions with their dots */
  const names = extensions.map((ext) => `.${ext}`);

  return names.length > 1
    ? `${names.slice(0, -1).join(", ")} or ${names.at(-1)}`
    : names[0];
};

/** The paths of the files dropped in a drag event */
const getDroppedPaths = (event) =>
  [...event.dataTransfer.files]
    .map((file) => window.electron.webUtils.getPathForFile(file))
    .filter(Boolean);

/**
 * A hook for picking a path field's value with the system dialog or by
 * dropping files, merging new files into a multiple field's list
 */
export default function useScriptPathField(field, value, onChange) {
  /** Whether files are dragged over the field */
  const [isDragging, setIsDragging] = useState(false);

  /** Whether files can be dropped on the field */
  const acceptsDrops = field.type !== FIELD_TYPE.SAVE;

  /** Sets new paths, added to the list of a multiple field */
  const setPaths = useCallback(
    (paths) => {
      if (paths.length === 0) return;

      onChange(field.multiple ? [...new Set([...value, ...paths])] : paths[0]);
    },
    [field.multiple, value, onChange],
  );

  /** Opens the system dialog for the field */
  const browse = useCallback(async () => {
    const picked = await window.electron.ipcRenderer.invoke(
      IPC.PICK_SCRIPT_PATH,
      {
        type: field.type,
        extensions: field.extensions,
        multiple: field.multiple,
        defaultName: field.defaultName,
        title: field.label,
      },
    );

    if (picked !== null) setPaths([picked].flat());
  }, [field, setPaths]);

  /** Removes one path, or the whole value of a single field */
  const remove = useCallback(
    (path) =>
      onChange(field.multiple ? value.filter((item) => item !== path) : ""),
    [field.multiple, value, onChange],
  );

  /** The drag and drop handlers of the field */
  const dropProps = useMemo(
    () =>
      acceptsDrops
        ? {
            onDragOver: (event) => {
              event.preventDefault();
              setIsDragging(true);
            },
            onDragLeave: () => setIsDragging(false),
            onDrop: (event) => {
              event.preventDefault();
              setIsDragging(false);

              /** The dropped paths */
              const paths = getDroppedPaths(event);
              /** The dropped paths with an allowed extension */
              const accepted = paths.filter((path) =>
                hasAllowedExtension(field, path),
              );
              /** The names of the dropped files that were refused */
              const refused = paths
                .filter((path) => !accepted.includes(path))
                .map(getBaseName);

              if (refused.length > 0) {
                toast.error(
                  `${refused.join(", ")} isn't a ` +
                    `${listExtensions(field.extensions)} file`,
                );
              }

              setPaths(accepted);
            },
          }
        : {},
    [acceptsDrops, field, setPaths],
  );

  return { browse, remove, dropProps, isDragging, acceptsDrops };
}
