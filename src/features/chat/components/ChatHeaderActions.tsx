import { Eye, FileText, Play } from 'lucide-react'

import { IconButton } from '#/shared/ui/IconButton'

export function ChatHeaderActions() {
  return (
    <div className="flex items-center gap-1">
      <IconButton aria-label="Preview deliverable">
        <Eye />
      </IconButton>
      <IconButton aria-label="Play draft">
        <Play />
      </IconButton>
      <IconButton aria-label="Open transcript">
        <FileText />
      </IconButton>
    </div>
  )
}
