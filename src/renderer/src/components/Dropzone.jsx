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
        "border border-dashed border-orange-500",
        "px-4 py-10 text-center rounded-xl",
        "text-orange-500",
        disabled && "opacity-50",
      )}
    >
      <input {...getInputProps()} />
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
