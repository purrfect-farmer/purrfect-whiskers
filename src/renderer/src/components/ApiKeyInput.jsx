import Input from "./Input";
import PrimaryButton from "./PrimaryButton";
import { memo } from "react";
import toast from "react-hot-toast";
import { useState } from "react";

/** An API key input with a save button */
export default memo(function ApiKeyInput({ value, onSave, label }) {
  /** The unsaved key */
  const [draft, setDraft] = useState(value || "");

  /** The handler for saving the key */
  const handleSave = () => {
    onSave(draft.trim() || null);
    toast.success(`${label} saved!`);
  };

  return (
    <div className="flex gap-2">
      <Input
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        placeholder={`Enter your ${label}`}
      />

      <PrimaryButton
        variant="neutral"
        onClick={handleSave}
        className="w-auto shrink-0"
      >
        Save
      </PrimaryButton>
    </div>
  );
});
