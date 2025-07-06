import toast from "react-hot-toast";
import { useCallback } from "react";
import { useDropzone } from "react-dropzone";

import Alert from "./Alert";
import AppDialogContent from "./AppDialogContent";
import useAppStore from "../store/useAppStore";
import useSettingsStore from "../store/useSettingsStore";
import { HiOutlinePuzzlePiece } from "react-icons/hi2";

export default function LoaderDialog() {
  const setPartitions = useAppStore((state) => state.setPartitions);
  const extensionPath = useSettingsStore((state) => state.extensionPath);

  /** On backup file drop */
  const onDrop = useCallback(
    async (acceptedFiles) => {
      setPartitions([]);
      const file = window.electron.webUtils.getPathForFile(acceptedFiles[0]);

      await window.electron.ipcRenderer.invoke(
        "install-extension",
        file,
        extensionPath
      );

      toast.success("Successfully Installed Extension!");
    },
    [extensionPath, setPartitions]
  );

  /** Dropzone */
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/zip": [".zip"],
    },
    maxFiles: 1,
    multiple: false,
  });

  return (
    <AppDialogContent
      title={"Load Extension"}
      description={"Install Extension Manually"}
      icon={HiOutlinePuzzlePiece}
    >
      <Alert variant={"warning"} className="text-center">
        You are about to install the extension manually. This will replace the
        currently installed version.
      </Alert>

      {/* Drop Zone */}
      <div
        {...getRootProps()}
        className={cn(
          "border border-dashed border-orange-500",
          "px-4 py-10 text-center rounded-xl",
          "text-orange-500"
        )}
      >
        <input {...getInputProps()} />
        {isDragActive ? (
          <p>Drop the extension file here ...</p>
        ) : (
          <p>
            Drag 'n' drop the extension file here, or click to select extension
            file
          </p>
        )}
      </div>
    </AppDialogContent>
  );
}
