import Link from 'next/link'

export function SiteFooter() {
  return (
    <footer className="mt-auto w-full border-t border-border/40 bg-card/40 py-2.5">
      <div className="mx-auto flex w-full max-w-5xl flex-col items-center justify-between gap-2 px-4 text-[11px] text-muted-foreground sm:flex-row sm:px-6">
        <div className="flex items-center gap-2.5 tracking-wide">
          <span>© {new Date().getFullYear()} CHTH</span>
          <span className="text-border">·</span>
          <Link href="/terms" className="transition-colors hover:text-foreground">
            Terms of Service
          </Link>
        </div>

        <a
          href="https://chth.wtf"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="CHTH (chth.wtf)"
          title="chth.wtf"
          className="group flex items-center justify-center rounded-full p-1.5 transition-all duration-300 ease-out hover:scale-110 hover:bg-muted/70 active:scale-95"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logo-black.png"
            alt=""
            className="block size-6 object-contain opacity-70 transition-all duration-300 group-hover:rotate-[-3deg] group-hover:opacity-100 sm:size-7 dark:hidden"
          />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logo-white.png"
            alt=""
            className="hidden size-6 object-contain opacity-70 transition-all duration-300 group-hover:rotate-[-3deg] group-hover:opacity-100 sm:size-7 dark:block"
          />
        </a>
      </div>
    </footer>
  )
}
