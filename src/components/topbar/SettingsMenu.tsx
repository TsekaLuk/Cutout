/**
 * SettingsMenu (spec §4c) — a small dropdown: reset params, about.
 *
 * Deliberately tiny in v1 (no cmdk, few actions). Reset mirrors the inline
 * button in ParameterControls; "About" toasts the build identity for now.
 */
import { Settings2, RotateCcw, Info } from 'lucide-react'
import { toast } from 'sonner'
import { useStore } from '@/store'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu'

export function SettingsMenu() {
  const resetParams = useStore((s) => s.resetParams)

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon-sm" aria-label="Settings">
          <Settings2 />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        <DropdownMenuLabel>Settings</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => resetParams()}>
          <RotateCcw />
          Reset parameters
        </DropdownMenuItem>
        <DropdownMenuItem
          onSelect={() =>
            toast('Cutout', {
              description: 'AI-Native UI/UX · Tauri 2 · React 19 — local, offline-first.',
            })
          }
        >
          <Info />
          About
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
