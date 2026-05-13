import { useRef } from 'react'
import { t } from '@lingui/core/macro'

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
} from '#/components/ui/sheet'
import { Button } from '#/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '#/components/ui/dialog'
import { useActiveCampaigns } from '#/shared/api/activeCampaigns'

import { useSendOfferSheetStore } from '../store/sendOfferSheetStore'
import type { OfferType } from '../store/sendOfferSheetStore'
import { OfferTypeChooser } from './OfferTypeChooser'
import { SingleEditor } from './SingleEditor'
import { BundleEditor } from './BundleEditor'
import { MultiStageEditor } from './MultiStageEditor'

interface SendOfferSidesheetProps {
  creatorName: string
}

export function SendOfferSidesheet({ creatorName }: SendOfferSidesheetProps) {
  const {
    isOpen,
    offerType,
    isTypeChangeConfirmationOpen,
    close,
    setOfferType,
    confirmTypeChange,
    cancelTypeChange,
  } = useSendOfferSheetStore()
  const campaignsQuery = useActiveCampaigns()
  const editorDirtyRef = useRef(false)

  const campaigns = campaignsQuery.data ?? []
  const hasCampaigns = campaigns.length > 0

  function handleTypeChange(type: OfferType) {
    const hasData = editorDirtyRef.current
    setOfferType(type, { hasData })
    if (!hasData) {
      editorDirtyRef.current = false
    }
  }

  function handleConfirmTypeChange() {
    editorDirtyRef.current = false
    confirmTypeChange()
  }

  function handleClose() {
    editorDirtyRef.current = false
    close()
  }

  return (
    <Sheet
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) handleClose()
      }}
    >
      <SheetContent
        side="right"
        showCloseButton={false}
        className="flex h-full w-full flex-col sm:max-w-lg"
      >
        <SheetTitle className="sr-only">{t`Send Offer`}</SheetTitle>
        <SheetDescription className="sr-only">
          {t`Send an offer to ${creatorName}`}
        </SheetDescription>

        {campaignsQuery.isError ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 p-6">
            <p className="text-center text-sm text-destructive">
              {t`Failed to load campaigns. Please try again.`}
            </p>
            <Button
              variant="outline"
              onClick={() => void campaignsQuery.refetch()}
            >
              {t`Retry`}
            </Button>
          </div>
        ) : !hasCampaigns && !campaignsQuery.isLoading ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 p-6">
            <p className="text-center text-sm text-muted-foreground">
              {t`You don't have any active campaigns. Create a campaign first to send offers.`}
            </p>
            <Button variant="outline" onClick={close}>
              {t`Close`}
            </Button>
          </div>
        ) : (
          <>
            <header className="flex items-start justify-between gap-4 border-b border-border p-5">
              <div>
                <h2 className="text-2xl font-semibold text-foreground">
                  {t`Send Offer`}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {t`To ${creatorName}`}
                </p>
              </div>
            </header>

            <div className="px-5 pt-5">
              <OfferTypeChooser value={offerType} onChange={handleTypeChange} />
            </div>

            {offerType === 'single' && (
              <SingleEditor
                key={offerType}
                onClose={handleClose}
                dirtyRef={editorDirtyRef}
              />
            )}

            {offerType === 'bundle' && (
              <BundleEditor
                key={offerType}
                onClose={handleClose}
                dirtyRef={editorDirtyRef}
              />
            )}

            {offerType === 'multistage' && (
              <MultiStageEditor
                key={offerType}
                onClose={handleClose}
                dirtyRef={editorDirtyRef}
              />
            )}
          </>
        )}

        <Dialog
          open={isTypeChangeConfirmationOpen}
          onOpenChange={(open) => {
            if (!open) cancelTypeChange()
          }}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t`Change offer type?`}</DialogTitle>
              <DialogDescription>
                {t`Changing the offer type will discard the entered data. Continue?`}
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={cancelTypeChange}>
                {t`Cancel`}
              </Button>
              <Button onClick={handleConfirmTypeChange}>{t`Continue`}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </SheetContent>
    </Sheet>
  )
}
