import { LuUpload } from "react-icons/lu";
import { cn } from "../lib/utils";
import { memo } from "react";
import { useDropzone } from "react-dropzone";

/** A drop target for a single file */
export default memo(function Dropzone({ accept, onDrop, disabled, fileLabel }) {
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept,
    maxFiles: 1,
    multiple: false,
    disabled,
  });

  return (
    <div
      {...getRootProps()}
      className={cn(
        "flex flex-col items-center gap-2",
        "px-4 py-8 text-center rounded-xl cursor-pointer",
        "border-2 border-dashed border-orange-500/60",
        "text-neutral-700 dark:text-neutral-200",
        "hover:bg-orange-50 dark:hover:bg-orange-950/30",
        isDragActive && "bg-orange-50 dark:bg-orange-950/30",
        disabled && "opacity-50",
      )}
    >
      <input {...getInputProps()} />
      <LuUpload className="size-6 text-orange-500" />
      {isDragActive ? (
        <p>Drop the {fileLabel} here ...</p>
      ) : (
        <p>
          Drag &apos;n&apos; drop the {fileLabel} here, or click to select{" "}
          {fileLabel}
        </p>
      )}
    </div>
  );
});
