import FormInputField from "./FormInputField";
import FormNumberField from "./FormNumberField";
import { MAX_TITLE_PADDING } from "../lib/titles";
import { memo } from "react";

/**
 * Prefix and suffix fields, plus the start number and zero padding
 * when `numbered`
 */
export default memo(function NumberedTitleFields({
  numbered = true,
  disabled,
}) {
  return (
    <>
      <FormInputField
        name="prefix"
        label="Title Prefix"
        placeholder="Optional"
        disabled={disabled}
      />

      <FormInputField
        name="suffix"
        label="Title Suffix"
        placeholder="Optional"
        disabled={disabled}
      />

      {numbered ? (
        <>
          <FormNumberField
            name="startNumber"
            label="Start Number"
            disabled={disabled}
          />

          <FormNumberField
            name="padding"
            label="Digits (zero padding)"
            min={0}
            max={MAX_TITLE_PADDING}
            disabled={disabled}
          />
        </>
      ) : null}
    </>
  );
});
