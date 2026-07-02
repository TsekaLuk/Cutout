import {
  CheckCircle2,
  Clapperboard,
  Code2,
  DownloadCloud,
  FolderGit2,
  GalleryVerticalEnd,
  Image,
  Library,
  MonitorCog,
  Palette,
  PanelTop,
  Plus,
  ScanSearch,
  Scissors,
} from 'lucide-react'
import { DropZone } from '@/components/source/DropZone'
import { SourceCanvas } from '@/components/source/SourceCanvas'
import { SourceMeta } from '@/components/source/SourceMeta'
import { ParameterControls } from '@/components/source/ParameterControls'
import { PreviewPanel } from '@/components/preview/PreviewPanel'
import { SliceGrid } from '@/components/slices/SliceGrid'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useExport } from '@/hooks/useExport'
import { useSource, useSlices, useStatus } from '@/store/selectors'

const toolModes = [
  { label: 'Add Source', icon: Plus, state: 'active' },
  { label: 'Workspace', icon: FolderGit2, state: 'pending' },
  { label: 'Reference', icon: Image, state: 'pending' },
  { label: 'Scene', icon: MonitorCog, state: 'pending' },
  { label: 'Cutout', icon: Scissors, state: 'ready' },
  { label: 'Library', icon: Library, state: 'pending' },
  { label: 'Inspect', icon: ScanSearch, state: 'pending' },
] as const

const sourceTypes = [
  ['Text', 'Pending'],
  ['Image', 'Ready'],
  ['Video', 'Pending'],
  ['Figma', 'Pending'],
  ['Framer', 'Pending'],
  ['Pencil', 'Pending'],
] as const

const scenePresets = [
  'Dashboard',
  'Mobile App',
  'Desktop App',
  'Embedded',
] as const

export function WorkspaceLayout() {
  const source = useSource()
  const slices = useSlices()
  const status = useStatus()
  const { exportAll, exportAllPending } = useExport()
  const hasSource = source.bitmap !== null
  const hasSlices = slices.length > 0
  const kitStatus =
    status === 'running'
      ? 'Analyzing'
      : hasSlices
        ? 'Ready'
        : hasSource
          ? 'No regions'
          : 'Waiting'

  return (
    <div className="flex min-h-0 flex-1 overflow-hidden bg-[#080c11]">
      <ToolRail />

      <section className="cutout-canvas-bg relative min-w-0 flex-1 overflow-hidden">
        <div className="h-full overflow-auto">
          <div className="grid min-h-[760px] min-w-[1220px] grid-cols-[310px_600px_270px] grid-rows-[390px_260px] gap-8 p-8">
            <SourceNode hasSource={hasSource} />
            <WorkspaceNode />
            <CutoutNode hasSource={hasSource} />
            <ReferenceNode />
            <AssetKitNode count={slices.length} status={kitStatus} />
            <SceneNode />
          </div>
        </div>

        <div className="pointer-events-none absolute inset-x-[104px] bottom-10 hidden xl:block">
          <div className="pointer-events-auto mx-auto grid max-w-5xl grid-cols-[280px_1fr_auto] gap-3 rounded-lg border border-white/10 bg-[#101821]/90 p-3 shadow-2xl backdrop-blur">
            <div className="flex min-w-0 items-center gap-3 border-r border-white/10 pr-3">
              <div className="flex size-11 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/[0.04]">
                <Image className="size-4 text-cyan-300" />
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">
                  {hasSource ? source.name : 'No source selected'}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {hasSource
                    ? `${source.width}×${source.height} · Cutout source`
                    : 'Drop an asset sheet to extract transparent PNGs.'}
                </p>
              </div>
            </div>
            <div className="flex min-w-0 items-center gap-2 rounded-lg border border-white/10 bg-white/[0.03] px-3 text-sm text-muted-foreground">
              <span className="min-w-0 flex-1 truncate">
                Add context or describe the UI kit
              </span>
              <Button type="button" size="sm" variant="outline" disabled>
                Text
              </Button>
              <Button type="button" size="sm" variant="outline" disabled>
                Media
              </Button>
              <Button type="button" size="sm" variant="outline" disabled>
                Workspace
              </Button>
            </div>
            <Button type="button" disabled>
              Create Reference
            </Button>
          </div>
        </div>
      </section>

      <InspectorRail
        count={slices.length}
        hasSlices={hasSlices}
        status={status}
        exportAll={exportAll}
        exportAllPending={exportAllPending}
      />
    </div>
  )
}

function ToolRail() {
  return (
    <aside className="grid w-[86px] shrink-0 content-start gap-2 border-r border-white/10 bg-[#090f16] p-2">
      {toolModes.map(({ label, icon: Icon, state }) => (
        <button
          key={label}
          type="button"
          disabled={state === 'pending'}
          className={
            state === 'active'
              ? 'grid min-h-16 place-items-center gap-1 rounded-lg border border-blue-400/60 bg-blue-600 px-1 py-2 text-center text-[11px] font-medium text-white shadow-lg shadow-blue-950/30'
              : 'grid min-h-16 place-items-center gap-1 rounded-lg border border-white/10 bg-white/[0.04] px-1 py-2 text-center text-[11px] text-muted-foreground transition hover:bg-white/[0.07] disabled:cursor-not-allowed disabled:opacity-50'
          }
        >
          <Icon className="size-4" />
          <span>{label}</span>
        </button>
      ))}
    </aside>
  )
}

function SourceNode({ hasSource }: { readonly hasSource: boolean }) {
  return (
    <Node className="row-span-1">
      <NodeHeader eyebrow="Sources" title="Add source context" state="Active" />
      <DropZone variant={hasSource ? 'compact' : 'node'} />
      <div className="mt-3 grid grid-cols-2 gap-2">
        {sourceTypes.map(([name, state]) => (
          <div
            key={name}
            className="flex items-center justify-between rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-xs"
          >
            <span>{name}</span>
            <span className="text-[10px] font-semibold tracking-wide text-muted-foreground uppercase">
              {state}
            </span>
          </div>
        ))}
      </div>
    </Node>
  )
}

function WorkspaceNode() {
  return (
    <Node className="row-start-2">
      <NodeHeader eyebrow="Workspace" title="Project context" state="Pending" />
      <div className="grid grid-cols-2 gap-2">
        <Button type="button" variant="outline" disabled>
          <FolderGit2 />
          Open local project
        </Button>
        <Button type="button" variant="outline" disabled>
          <Code2 />
          Clone Git
        </Button>
      </div>
      <p className="mt-3 text-xs leading-5 text-muted-foreground">
        Later: cite files, tokens, components, screenshots, and generated
        prototypes from the workspace.
      </p>
    </Node>
  )
}

function CutoutNode({ hasSource }: { readonly hasSource: boolean }) {
  const source = useSource()
  return (
    <Node className="col-start-2">
      <NodeHeader
        eyebrow="Cutout Sheet"
        title={hasSource ? source.name : 'No source loaded'}
        state={hasSource ? `${source.width}×${source.height}` : 'No image'}
      />
      <div className="grid h-[300px] grid-cols-2 gap-3">
        <div className="flex min-h-0 flex-col rounded-lg border border-white/10 bg-white/[0.04] p-2">
          <div className="mb-2 flex items-center justify-between text-xs text-muted-foreground">
            <span>Original</span>
            <span>{hasSource ? 'Loaded' : 'Waiting'}</span>
          </div>
          {hasSource ? (
            <SourceCanvas />
          ) : (
            <EmptyChecker label="Drop a source sheet" />
          )}
        </div>
        <div className="min-h-0 overflow-hidden rounded-lg border border-white/10 bg-white/[0.04]">
          <PreviewPanel />
        </div>
      </div>
      {hasSource ? <div className="mt-3"><SourceMeta /></div> : null}
    </Node>
  )
}

function ReferenceNode() {
  return (
    <Node className="col-start-3">
      <NodeHeader
        eyebrow="Reference Proto"
        title="Generated prototype"
        state="Pending"
      />
      <div className="grid h-[136px] place-items-center rounded-lg border border-dashed border-white/15 bg-white/[0.04] text-center text-xs text-muted-foreground">
        Reference image will appear here.
      </div>
      <p className="mt-3 text-xs leading-5 text-muted-foreground">
        Text, media, Workspace, Figma, Framer, and Pencil context will compile
        into proto images.
      </p>
    </Node>
  )
}

function SceneNode() {
  return (
    <Node className="col-start-3 row-start-2">
      <NodeHeader eyebrow="Scene Surface" title="Target output" state="Pending" />
      <div className="grid grid-cols-2 gap-2">
        {scenePresets.map((preset) => (
          <span
            key={preset}
            className="rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-xs"
          >
            {preset}
          </span>
        ))}
      </div>
      <p className="mt-3 text-xs leading-5 text-muted-foreground">
        Later: choose frame size, aspect ratio, safe area, and export scale.
      </p>
    </Node>
  )
}

function AssetKitNode({
  count,
  status,
}: {
  readonly count: number
  readonly status: string
}) {
  return (
    <Node className="col-start-2 row-start-2">
      <NodeHeader eyebrow="Asset Kit" title={`${count} assets`} state={status} />
      <div className="h-[190px] overflow-y-auto rounded-lg border border-white/10 bg-white/[0.03]">
        <SliceGrid />
      </div>
    </Node>
  )
}

function InspectorRail({
  count,
  hasSlices,
  status,
  exportAll,
  exportAllPending,
}: {
  readonly count: number
  readonly hasSlices: boolean
  readonly status: string
  readonly exportAll: () => void
  readonly exportAllPending: boolean
}) {
  return (
    <aside className="grid w-[360px] shrink-0 grid-rows-[auto_auto_auto_auto_minmax(0,1fr)] overflow-y-auto border-l border-white/10 bg-[#0d131b]">
      <div className="grid grid-cols-4 border-b border-white/10 px-3 pt-3">
        {['Assets', 'Reference', 'Scene', 'Export'].map((tab, index) => (
          <button
            key={tab}
            type="button"
            disabled={index !== 0}
            className={
              index === 0
                ? 'border-b-2 border-blue-400 pb-3 text-sm font-semibold text-white'
                : 'pb-3 text-sm text-muted-foreground opacity-50'
            }
          >
            {tab}
          </button>
        ))}
      </div>

      <section className="border-b border-white/10 p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[11px] font-bold tracking-[0.14em] text-cyan-300 uppercase">
              Current mode
            </p>
            <h2 className="mt-1 text-lg font-semibold">Cutout extraction</h2>
          </div>
          <Badge className="bg-emerald-500/15 text-emerald-200">
            {status === 'running' ? 'Running' : 'Ready'}
          </Badge>
        </div>
        <p className="mt-3 text-xs leading-5 text-muted-foreground">
          Existing capability is live: remove white background, split connected
          regions, and export transparent PNG files.
        </p>
      </section>

      <section className="border-b border-white/10 p-4">
        <ParameterControls />
      </section>

      <section className="border-b border-white/10 p-4">
        <h3 className="mb-3 text-sm font-semibold">Pending lines</h3>
        <div className="grid gap-2">
          <PendingLine
            icon={FolderGit2}
            title="Workspace"
            body="Local / Git project citation"
          />
          <PendingLine
            icon={PanelTop}
            title="Reference Proto"
            body="Multimodal proto generation"
          />
          <PendingLine
            icon={Palette}
            title="Scene Surface"
            body="Frame presets and safe area"
          />
        </div>
      </section>

      <section className="p-4">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold">Export queue</h3>
          <span className="text-sm tabular-nums text-muted-foreground">
            {count} PNG
          </span>
        </div>
        <Button
          type="button"
          className="mb-3 w-full"
          disabled={!hasSlices || exportAllPending}
          onClick={exportAll}
        >
          <DownloadCloud />
          Export Kit
        </Button>
        <div className="grid gap-2 text-xs">
          <ExportFormat icon={CheckCircle2} label="Transparent PNG" />
          <ExportFormat icon={GalleryVerticalEnd} label="Sprite sheet" pending />
          <ExportFormat icon={Clapperboard} label="JSON manifest" pending />
        </div>
      </section>
    </aside>
  )
}

function Node({
  className,
  children,
}: {
  readonly className?: string
  readonly children: React.ReactNode
}) {
  return (
    <article
      className={`rounded-lg border border-white/10 bg-[#111923]/92 p-4 shadow-2xl shadow-black/25 backdrop-blur ${className ?? ''}`}
    >
      {children}
    </article>
  )
}

function NodeHeader({
  eyebrow,
  title,
  state,
}: {
  readonly eyebrow: string
  readonly title: string
  readonly state: string
}) {
  const pending = state === 'Pending'
  return (
    <header className="mb-3 flex items-start justify-between gap-3">
      <div className="min-w-0">
        <p className="text-[11px] font-bold tracking-[0.14em] text-cyan-300 uppercase">
          {eyebrow}
        </p>
        <h2 className="mt-1 truncate text-base font-semibold text-white">
          {title}
        </h2>
      </div>
      <Badge
        variant="outline"
        className={
          pending
            ? 'border-amber-300/20 bg-amber-300/10 text-amber-100'
            : 'border-white/10 bg-white/[0.04] text-muted-foreground'
        }
      >
        {state}
      </Badge>
    </header>
  )
}

function EmptyChecker({ label }: { readonly label: string }) {
  return (
    <div className="bg-checker grid min-h-0 flex-1 place-items-center rounded-lg border border-white/10 text-xs text-muted-foreground">
      {label}
    </div>
  )
}

function PendingLine({
  icon: Icon,
  title,
  body,
}: {
  readonly icon: typeof FolderGit2
  readonly title: string
  readonly body: string
}) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-white/10 bg-white/[0.04] p-3">
      <Icon className="size-4 shrink-0 text-muted-foreground" />
      <div>
        <p className="text-sm font-medium">{title}</p>
        <p className="text-xs text-muted-foreground">{body}</p>
      </div>
    </div>
  )
}

function ExportFormat({
  icon: Icon,
  label,
  pending,
}: {
  readonly icon: typeof CheckCircle2
  readonly label: string
  readonly pending?: boolean
}) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2">
      <span className="flex items-center gap-2">
        <Icon className={pending ? 'size-3.5 text-muted-foreground' : 'size-3.5 text-emerald-300'} />
        {label}
      </span>
      {pending ? (
        <span className="font-semibold tracking-wide text-muted-foreground uppercase">
          Pending
        </span>
      ) : null}
    </div>
  )
}
