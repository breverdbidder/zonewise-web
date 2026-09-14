import { Separator } from '@/components/ui/separator'
import { SidebarTrigger } from '@/components/ui/sidebar'

export function SiteHeader({ title }: { title?: string }) {
  return (
    <header className="flex h-12 shrink-0 items-center gap-2 border-b border-[rgb(var(--zw-border2))] bg-[rgb(var(--zw-page))] px-4">
      <SidebarTrigger className="-ml-1 text-[rgb(var(--zw-ink2))] hover:text-[rgb(var(--zw-brand))]" aria-label="Toggle sidebar" />
      <Separator orientation="vertical" className="mr-2 h-4 bg-[rgb(var(--zw-elev))]" />
      {title && (
        <span className="text-sm font-medium text-[rgb(var(--zw-ink2))]">{title}</span>
      )}
    </header>
  )
}
