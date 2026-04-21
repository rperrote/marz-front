/**
 * Pill shown on hover when the sidebar is collapsed. Light background with
 * shadow — the counterpart to `DarkTooltip` for the sidebar's rail.
 */
export function SidebarTooltip({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center rounded-full border border-border bg-popover px-3 py-1.5 text-xs font-medium text-popover-foreground shadow-md">
      {label}
    </span>
  )
}
