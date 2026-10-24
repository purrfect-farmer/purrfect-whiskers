import Input from "./Input";
import PrimaryButton from "./PrimaryButton";
import { memo } from "react";
import toast from "react-hot-toast";
import { useState } from "react";

/** API key field saved on demand; an empty key is saved as null */
export default memo(function ApiKeyInput({ value, onSave, label }) {
  const [draft, setDraft] = useState(value || "");

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
