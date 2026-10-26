import { Controller, FormProvider, useWatch } from "react-hook-form";
import {
  HiOutlineArrowLeft,
  HiOutlineCurrencyDollar,
  HiXMark,
} from "react-icons/hi2";
import { memo } from "react";

import FormField from "./FormField";
import FormInputField from "./FormInputField";
import FormNumberField from "./FormNumberField";
import LabelToggle from "./LabelToggle";
import { MAX_SPIDER_BATCH } from "../hooks/useSpiderAccountsForm";
import NumberedTitleFields from "./NumberedTitleFields";
import PrimaryButton from "./PrimaryButton";
import { Progress } from "./Progress";
import Slider from "./Slider";
import TagsInput from "./TagsInput";
import { formatNumberedTitle } from "../lib/titles";
import { useSpider } from "./SpiderProvider";

const TITLE_FIELDS = ["prefix", "suffix", "startNumber", "padding", "count"];

/** The total price of the accounts being bought */
const SpiderTotalPrice = memo(function SpiderTotalPrice({ price }) {
  const count = useWatch({ name: "count" });

  return (
    <p className="text-center text-purple-500 dark:text-purple-300 font-bold">
      Total: ${(count * price).toFixed(2)}
    </p>
  );
});

/** The title fields with a preview of the titles */
const SpiderTitleFields = memo(function SpiderTitleFields({ disabled }) {
  const [prefix, suffix, startNumber, padding, count] = useWatch({
    name: TITLE_FIELDS,
  });

  /** Whether the titles are numbered */
  const numbered = Boolean(prefix || suffix);

  /** The title at an offset from the start number */
  const formatAt = (offset) =>
    formatNumberedTitle({
      prefix,
      suffix,
      number: startNumber + offset,
      padding,
    }).trim();

  /** The preview of the first and last titles */
  const titlePreview = numbered
    ? count > 1
      ? `${formatAt(0)} … ${formatAt(count - 1)}`
      : formatAt(0)
    : "Spider <phone number>";

  return (
    <>
      <NumberedTitleFields numbered={numbered} disabled={disabled} />

      {/* Title Preview */}
      <p className="text-center text-neutral-500 dark:text-neutral-400 px-2 wrap-break-word">
        Accounts will be named{" "}
        <span className="font-bold text-orange-500">{titlePreview}</span>
      </p>
    </>
  );
});

/** The purchase button, progress and cancel button */
const SpiderPurchaseActions = memo(function SpiderPurchaseActions({
  maxCount,
  isPending,
  progress,
  cancelPurchase,
}) {
  const count = useWatch({ name: "count" });

  /** Exceeds available stock */
  const exceedsStock = count > maxCount;

  return (
    <>
      <PrimaryButton type="submit" disabled={isPending || exceedsStock}>
        <HiOutlineCurrencyDollar className="size-5" />
        {isPending ? "Purchasing..." : "Purchase Accounts"}
      </PrimaryButton>

      {/* Progress */}
      {isPending ? <Progress current={progress} max={count} /> : null}

      {/* Cancel button */}
      {isPending ? (
        <button
          type="button"
          onClick={cancelPurchase}
          className="p-2 text-red-500 inline-flex justify-center items-center gap-2"
        >
          <HiXMark className="size-5" />
          Cancel operation
        </button>
      ) : null}
    </>
  );
});

export default function SpiderAccountsForm({ country, clearSelection }) {
  const { form } = useSpider();
  const { methods, onSubmit, mutation, progress, maxCount, cancelPurchase } =
    form;

  const isPending = mutation.isPending;

  return (
    <FormProvider {...methods}>
      <form onSubmit={onSubmit} className="flex flex-col gap-2 min-w-0">
        {/* Country Information */}
        <h2 className="text-lg flex justify-center items-center gap-2 text-orange-500 font-bold min-w-0">
          <span>{country.emoji}</span>
          <span className="truncate">
            {country.name} ({country.code})
          </span>
        </h2>

        {/* Country Price */}
        <div className="flex flex-col gap-1">
          <p className="text-center text-sky-500 dark:text-sky-300 font-bold">
            ${country.price} (Per Account)
          </p>

          <SpiderTotalPrice price={country.price} />

          <p className="text-center text-emerald-500 dark:text-emerald-300 font-bold">
            {maxCount} available
          </p>
        </div>

        {/* Return to Countries */}
        <button
          type="button"
          onClick={clearSelection}
          className="flex justify-center items-center gap-2 text-sm text-orange-500 hover:underline"
        >
          <HiOutlineArrowLeft className="size-4" /> Return to Countries
        </button>

        {/* Number of Accounts */}
        <FormNumberField
          name="count"
          label="Number of Accounts"
          max={Math.max(1, maxCount)}
          disabled={isPending}
        />

        {/* Batch */}
        <Controller
          name="batch"
          render={({ field }) => (
            <div className="flex flex-col">
              <label className="text-orange-500 text-center">
                Batch: <span className="font-bold">{field.value}</span>
              </label>
              <Slider
                step={1}
                min={1}
                max={MAX_SPIDER_BATCH}
                value={[field.value]}
                disabled={isPending}
                onValueChange={(value) => field.onChange(value[0])}
              />
            </div>
          )}
        />

        {/* Title */}
        <SpiderTitleFields disabled={isPending} />

        {/* Tags */}
        <FormField label="Tags">
          <Controller
            name="tags"
            render={({ field }) => (
              <TagsInput
                value={field.value}
                onChange={field.onChange}
                disabled={isPending}
              />
            )}
          />
        </FormField>

        {/* Enable Local Telegram Session */}
        <Controller
          name="enableLocalTelegramSession"
          render={({ field }) => (
            <LabelToggle
              checked={field.value}
              onChange={(ev) => field.onChange(ev.target.checked)}
              disabled={isPending}
            >
              Enable Local Telegram Session
            </LabelToggle>
          )}
        />

        {/* 2FA */}
        <FormInputField
          name="password"
          label="2FA"
          placeholder="Optional"
          disabled={isPending}
        />

        {/* 2FA Information */}
        <p className="text-center text-neutral-500 dark:text-neutral-400 px-2">
          Leave empty if you do not want to change the 2FA password of the new
          accounts.
        </p>

        <SpiderPurchaseActions
          maxCount={maxCount}
          isPending={isPending}
          progress={progress}
          cancelPurchase={cancelPurchase}
        />
      </form>
    </FormProvider>
  );
}
