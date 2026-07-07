import { IntentWorkspace } from '@/components/workspace/IntentWorkspace'

export function PipelineCanvas({
  onArchiveProject,
}: {
  readonly onArchiveProject: () => void
}) {
  return (
    <div className="flex h-full min-h-0 flex-1 bg-background">
      <IntentWorkspace onArchiveProject={onArchiveProject} />
    </div>
  )
}
