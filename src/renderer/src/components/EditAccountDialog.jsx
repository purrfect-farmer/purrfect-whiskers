import { Dialog } from 'radix-ui'
import { GoPerson } from 'react-icons/go'

import AccountForm from './AccountForm'
import useAppStore from '../store/useAppStore'
import { cn } from '../lib/utils'

export default function EditAccountDialog({ account }) {
  const updateAccount = useAppStore((state) => state.updateAccount)

  return (
    <Dialog.Portal>
      <Dialog.Overlay className="fixed inset-0 bg-black/50" />
      <Dialog.Content
        className={cn(
          'fixed top-1/2 left-1/2 w-[90vw] max-w-[450px]',
          '-translate-x-1/2 -translate-y-1/2 rounded-xl bg-white p-6',
          'flex flex-col gap-2'
        )}
      >
        <GoPerson className="size-10 mx-auto text-blue-500" />
        <Dialog.Title className="text-lg text-blue-500 font-light text-center">
          Edit Account
        </Dialog.Title>
        <Dialog.Description className="sr-only">Update Account Details</Dialog.Description>

        <AccountForm account={account} handleFormSubmit={(data) => updateAccount(data)} />

        <Dialog.Close className={cn('px-4 py-2.5 bg-blue-100 text-blue-800 rounded-xl')}>
          Close
        </Dialog.Close>
      </Dialog.Content>
    </Dialog.Portal>
  )
}
