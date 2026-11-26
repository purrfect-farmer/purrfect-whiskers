import {
  ALERT_VARIANT,
  TG_GET_BOT_USERNAME,
  TG_GET_SCREEN,
} from "../lib/constants";
import AccountSummary from "./AccountSummary";
import AccountsPicker from "./AccountsPicker";
import AccountsRadioItem from "./AccountsRadioItem";
import Alert from "./Alert";
import AppDialogContent from "./AppDialogContent";
import FormInputField from "./FormInputField";
import { FormProvider } from "react-hook-form";
import LabelToggle from "./LabelToggle";
import { HiOutlineArrowLeft } from "react-icons/hi2";
import { GiSpiderWeb } from "react-icons/gi";
import PrimaryButton from "./PrimaryButton";
import TgGetStatusList from "./TgGetStatusList";
import { useState } from "react";
import { useTgGet } from "./TgGetProvider";

/** A link that steps back to an earlier screen */
function BackLink({ onClick, disabled, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="flex justify-center items-center gap-2 text-sm text-orange-500 hover:underline disabled:opacity-50 disabled:no-underline"
    >
      <HiOutlineArrowLeft className="size-4" /> {children}
    </button>
  );
}

/** A dialog that steps through picking accounts and transferring them */
export default function TgGetDialog() {
  const {
    methods,
    onSubmit,
    mainSelector,
    othersSelector,
    mainList,
    othersList,
    mainPartition,
    others,
    removeAfter,
    setRemoveAfter,
    running,
    steps,
    outcomes,
    progress,
  } = useTgGet();

  /** The current screen of the flow */
  const [screen, setScreen] = useState(TG_GET_SCREEN.MAIN);

  /** The picked main account */
  const mainAccount = mainSelector.selectedAccounts[0];
  /** Whether the status list is shown */
  const showStatus = running || outcomes.size > 0;

  return (
    <AppDialogContent
      title={"TG Get"}
      description={"Transfer accounts to the TG Get bot"}
      icon={GiSpiderWeb}
    >
      {/* Bot link */}
      <p className="text-center text-neutral-500 dark:text-neutral-400">
        Open the{" "}
        <a
          href={`https://t.me/${TG_GET_BOT_USERNAME}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-orange-500"
        >
          TG Get bot
        </a>
        .
      </p>

      {/* Main account */}
      {screen === TG_GET_SCREEN.MAIN ? (
        <>
          <AccountsPicker
            {...mainSelector}
            accounts={mainList}
            title="Main account"
            itemComponent={AccountsRadioItem}
            showToggleAll={false}
            autoFocusSearch={false}
          />

          <PrimaryButton
            disabled={!mainPartition}
            onClick={() => setScreen(TG_GET_SCREEN.OTHERS)}
          >
            Next
          </PrimaryButton>
        </>
      ) : null}

      {/* Accounts to transfer */}
      {screen === TG_GET_SCREEN.OTHERS ? (
        <>
          <BackLink onClick={() => setScreen(TG_GET_SCREEN.MAIN)}>
            Main account
          </BackLink>

          <AccountsPicker
            {...othersSelector}
            accounts={othersList}
            title="Accounts to transfer"
            autoFocusSearch={false}
          />

          <PrimaryButton
            disabled={others.length === 0}
            onClick={() => setScreen(TG_GET_SCREEN.TRANSFER)}
          >
            Next ({others.length})
          </PrimaryButton>
        </>
      ) : null}

      {/* 2FA pool, action and status */}
      {screen === TG_GET_SCREEN.TRANSFER ? (
        <>
          <BackLink
            onClick={() => setScreen(TG_GET_SCREEN.OTHERS)}
            disabled={running}
          >
            Accounts to transfer
          </BackLink>

          {/* Chosen main account */}
          {mainAccount ? <AccountSummary account={mainAccount} /> : null}

          <Alert variant={ALERT_VARIANT.WARNING} className="text-center">
            Each account's 2FA is removed and its chats are cleared before it is
            handed to the bot through the main account. This cannot be undone.
          </Alert>

          {/* 2FA pool and transfer */}
          <FormProvider {...methods}>
            <form onSubmit={onSubmit} className="flex flex-col gap-2 min-w-0">
              <FormInputField
                name="twoFA"
                label="Possible 2FA passwords"
                placeholder="Optional"
                description="Space- or comma-separated. Each is tried to remove an account's 2FA."
                disabled={running}
              />

              <LabelToggle
                checked={removeAfter}
                disabled={running}
                onChange={(event) => setRemoveAfter(event.target.checked)}
              >
                Remove accounts after transfer
              </LabelToggle>

              <PrimaryButton
                type="submit"
                disabled={running || !mainPartition || others.length === 0}
              >
                Transfer ({others.length})
              </PrimaryButton>
            </form>
          </FormProvider>

          {/* Progress and per-account status */}
          {showStatus ? (
            <TgGetStatusList
              accounts={others}
              steps={steps}
              outcomes={outcomes}
              running={running}
              progress={progress}
            />
          ) : null}
        </>
      ) : null}
    </AppDialogContent>
  );
}
