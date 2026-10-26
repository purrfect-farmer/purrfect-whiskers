import useAccountPickerStore, {
  selectPickerRequest,
} from "../store/useAccountPickerStore";
import { hasTelegramUser } from "../lib/utils";
import { memo, useCallback, useMemo } from "react";

import AccountsPicker from "./AccountsPicker";
import AppDialogContent from "./AppDialogContent";
import { Dialog } from "radix-ui";
import DialogCloseButton from "./DialogCloseButton";
import { LuUserCheck } from "react-icons/lu";
import PrimaryButton from "./PrimaryButton";
import useAccountsSelector from "../hooks/useAccountsSelector";
import useAppStore from "../store/useAppStore";

/** The options of the account selection */
const SELECTOR_OPTIONS = { initiallySelected: false };

/** The description of a request, falling back to its requester */
function describeRequest(request) {
  if (request.description) return request.description;

  return request.title
    ? `Choose accounts for ${request.title}`
    : "Choose accounts";
}

/** The account selection of one picker request */
const AccountPickerContent = memo(function AccountPickerContent({ request }) {
  const accounts = useAppStore((state) => state.accounts);
  const answer = useAccountPickerStore((state) => state.answer);
  const { id, requireTelegram } = request;

  /** The accounts the request may pick from */
  const choices = useMemo(
    () => (requireTelegram ? accounts.filter(hasTelegramUser) : accounts),
    [accounts, requireTelegram],
  );

  /** The selection of accounts to send, starting empty */
  const selector = useAccountsSelector(choices, SELECTOR_OPTIONS);
  const { selectedAccounts } = selector;

  /** The handler for sending the selected accounts */
  const handleSend = useCallback(() => {
    answer(id, selectedAccounts);
  }, [answer, id, selectedAccounts]);

  return (
    <AppDialogContent
      title={"Pick Accounts"}
      description={describeRequest(request)}
      icon={LuUserCheck}
    >
      <AccountsPicker {...selector} />

      <PrimaryButton
        onClick={handleSend}
        disabled={selectedAccounts.length === 0}
      >
        Send ({selectedAccounts.length})
      </PrimaryButton>

      <DialogCloseButton>Cancel</DialogCloseButton>
    </AppDialogContent>
  );
});

/** A dialog that answers requests for accounts, one at a time, for whichever part of the app asked */
export default memo(function AccountPickerDialog() {
  const request = useAccountPickerStore(selectPickerRequest);
  const answer = useAccountPickerStore((state) => state.answer);

  /** The handler for closing the dialog, which cancels the request */
  const handleOpenChange = useCallback(
    (open) => {
      if (!open && request) answer(request.id, null);
    },
    [answer, request],
  );

  return (
    <Dialog.Root open={Boolean(request)} onOpenChange={handleOpenChange}>
      {request ? (
        <AccountPickerContent key={request.id} request={request} />
      ) : null}
    </Dialog.Root>
  );
});
