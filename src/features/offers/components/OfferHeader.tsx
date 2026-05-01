interface OfferHeaderProps {
  campaignName: string
}

export function OfferHeader({ campaignName }: OfferHeaderProps) {
  return (
    <h3 className="text-lg font-semibold text-foreground">{campaignName}</h3>
  )
}
