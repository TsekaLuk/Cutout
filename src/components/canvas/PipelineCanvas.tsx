import { IntentWorkspace } from '@/components/workspace/IntentWorkspace'

export function PipelineCanvas({
  onOpenFileWorkspace,
  onArchiveProject,
}: {
  readonly onOpenFileWorkspace: () => void
  readonly onArchiveProject: () => void
}) {
  return (
    <div className="flex h-full min-h-0 flex-1 bg-background">
      <IntentWorkspace
        onOpenFileWorkspace={onOpenFileWorkspace}
        onArchiveProject={onArchiveProject}
      />
    </div>
  )
}
