import { Separator } from '@/components/ui/separator'
import { SidebarTrigger } from '@/components/ui/sidebar'

export function SiteHeader({ title }: { title?: string }) {
  return (
    <header className="flex h-12 shrink-0 items-center gap-2 border-b border-slate-800 bg-[#020617] px-4">
      <SidebarTrigger className="-ml-1 text-slate-400 hover:text-orange-400" />
      <Separator orientation="vertical" className="mr-2 h-4 bg-slate-700" />
      {title && (
        <span className="text-sm font-medium text-slate-300">{title}</span>
      )}
    </header>
  )
}
