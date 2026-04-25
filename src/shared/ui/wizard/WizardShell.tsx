import type { ReactNode } from 'react'
import { cn } from '#/lib/utils'
import { WizardTopbar } from './WizardTopbar'
import { WizardProgress } from './WizardProgress'
import { WizardFooter } from './WizardFooter'

interface WizardShellProps {
  stepLabel: string
  percent: number
  onBack?: () => void
  onNext: () => void
  nextDisabled?: boolean
  nextLabel?: string
  backLabel?: string
  isLoading?: boolean
  onExit?: () => void
  exitLabel?: string
  hideFooter?: boolean
  children: ReactNode
  className?: string
}

export function WizardShell({
  stepLabel,
  percent,
  onBack,
  onNext,
  nextDisabled,
  nextLabel,
  backLabel,
  isLoading,
  onExit,
  exitLabel,
  hideFooter,
  children,
  className,
}: WizardShellProps) {
  return (
    <div className="flex h-screen w-full flex-col overflow-hidden bg-background">
      <WizardTopbar
        stepLabel={stepLabel}
        onExit={onExit}
        exitLabel={exitLabel}
      />
      <WizardProgress percent={percent} />
      <main
        className={cn(
          'flex flex-1 flex-col items-center justify-center overflow-y-auto px-24 py-12',
          className,
        )}
      >
        <div className="flex w-full flex-col items-center gap-12">
          {children}
          {!hideFooter && (
            <WizardFooter
              onBack={onBack}
              onNext={onNext}
              nextDisabled={nextDisabled}
              nextLabel={nextLabel}
              backLabel={backLabel}
              isLoading={isLoading}
            />
          )}
        </div>
      </main>
    </div>
  )
}
