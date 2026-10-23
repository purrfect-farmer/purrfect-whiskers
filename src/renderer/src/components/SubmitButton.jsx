import PrimaryButton from "./PrimaryButton";
import { memo } from "react";
import { useFormState } from "react-hook-form";

/** Submit button that reads the form's submitting state itself */
export default memo(function SubmitButton({
  children = "Save",
  pendingText = "Saving...",
  className,
}) {
  const { isSubmitting } = useFormState();

  return (
    <PrimaryButton type="submit" className={className} disabled={isSubmitting}>
      {isSubmitting ? pendingText : children}
    </PrimaryButton>
  );
});
