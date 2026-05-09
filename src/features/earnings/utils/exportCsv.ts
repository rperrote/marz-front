import type { CreatorEarningsPeriod } from '#/shared/api/generated/model'

interface DownloadCsvBlobInput {
  blob: Blob
  filename: string
}

export function downloadCsvBlob({ blob, filename }: DownloadCsvBlobInput) {
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  anchor.rel = 'noopener'
  document.body.append(anchor)
  anchor.click()
  anchor.remove()
  URL.revokeObjectURL(url)
}

export function buildEarningsCsvFilename(
  period: CreatorEarningsPeriod,
  date = new Date(),
) {
  return `marz-earnings-${period}-${formatDateStamp(date)}.csv`
}

function formatDateStamp(date: Date) {
  const year = date.getFullYear().toString()
  const month = (date.getMonth() + 1).toString().padStart(2, '0')
  const day = date.getDate().toString().padStart(2, '0')
  return `${year}${month}${day}`
}
