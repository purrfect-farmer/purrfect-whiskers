import PrimaryButton from "./PrimaryButton";
import { memo } from "react";
import { useFormState } from "react-hook-form";

/** Submit button that reads the form's submitting state itself */
export default memo(function SubmitButton({
  children = "Save",
  pendingText = "Saving...",
  className,
  disabled,
  form,
  variant,
}) {
  const { isSubmitting } = useFormState();

  return (
    <PrimaryButton
      type="submit"
      form={form}
      variant={variant}
      className={className}
      disabled={disabled || isSubmitting}
    >
      {isSubmitting ? pendingText : children}
    </PrimaryButton>
  );
});
