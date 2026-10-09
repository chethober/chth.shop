import type { Metadata } from 'next'
import { PageContainer } from '@/components/layout/page-container'
import { Badge, type BadgeProps } from '@/components/ui/badge'
import {
  API_BASE_PATH,
  AUTH_ERRORS,
  ENDPOINT_GROUPS,
  STATUS_CODES,
  type Endpoint,
  type HttpMethod,
} from '@/features/api-docs/api-reference'

export const metadata: Metadata = {
  title: 'API Reference',
  description: 'Endpoints, authentication and response format of the CHTH REST API.',
}

const METHOD_VARIANT: Record<HttpMethod, BadgeProps['variant']> = {
  GET: 'info',
  POST: 'success',
  PUT: 'warning',
  DELETE: 'destructive',
}

const ENVELOPE = `// 2xx
{ "success": true, "message"?: "…", "data"?: { … } }
// 4xx / 5xx
{ "success": false, "message": "What went wrong" }`

function CodeBlock({ children }: { children: string }) {
  return (
    <pre className="overflow-x-auto rounded-lg border border-border/60 bg-muted/40 p-3 font-mono text-[12px] leading-relaxed text-foreground">
      {children}
    </pre>
  )
}

function EndpointRow({ endpoint }: { endpoint: Endpoint }) {
  return (
    <li className="space-y-2 py-3">
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant={METHOD_VARIANT[endpoint.method]} className="w-16 justify-center font-mono">
          {endpoint.method}
        </Badge>
        <code className="break-all font-mono text-[13px] text-foreground">{endpoint.path}</code>
        {endpoint.auth !== 'none' && (
          <Badge variant="secondary">{endpoint.auth === 'required' ? 'Auth' : 'Auth optional'}</Badge>
        )}
      </div>
      <p className="text-sm text-muted-foreground">{endpoint.summary}</p>
      {endpoint.body && <CodeBlock>{endpoint.body}</CodeBlock>}
    </li>
  )
}

export default function ApiDocsPage() {
  return (
    <PageContainer>
      <header className="space-y-3 border-b border-border/40 pb-6">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">API Reference</h1>
        <p className="max-w-2xl text-sm text-muted-foreground">
          The CHTH REST API serves the storefront, artist stores, cart and checkout. All endpoints live under{' '}
          <code className="font-mono text-foreground">{API_BASE_PATH}</code> on this site and take and return JSON.
        </p>
        <nav aria-label="API sections" className="flex flex-wrap gap-1.5 pt-1">
          {ENDPOINT_GROUPS.map((group) => (
            <a
              key={group.id}
              href={`#${group.id}`}
              className="rounded-full border border-border px-2.5 py-0.5 text-[11px] text-muted-foreground transition-colors hover:text-foreground"
            >
              {group.title}
            </a>
          ))}
        </nav>
      </header>

      <section className="grid gap-6 border-b border-border/40 py-8 md:grid-cols-2">
        <div className="space-y-3">
          <h2 className="text-base font-semibold">Responses</h2>
          <CodeBlock>{ENVELOPE}</CodeBlock>
          <ul className="space-y-1 text-sm">
            {STATUS_CODES.map(({ status, meaning }) => (
              <li key={status} className="flex gap-3">
                <code className="font-mono text-foreground">{status}</code>
                <span className="text-muted-foreground">{meaning}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="space-y-3">
          <h2 className="text-base font-semibold">Authentication</h2>
          <p className="text-sm text-muted-foreground">
            Sign in with Google, X or Telegram to get a JWT that lasts 7 days, then send it on protected routes:
          </p>
          <CodeBlock>Authorization: Bearer &lt;token&gt;</CodeBlock>
          <ul className="space-y-1 text-sm">
            {AUTH_ERRORS.map(({ message, cause }) => (
              <li key={message}>
                <code className="font-mono text-foreground">401 {message}</code>
                <span className="text-muted-foreground"> · {cause}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {ENDPOINT_GROUPS.map((group) => (
        <section key={group.id} id={group.id} className="scroll-mt-24 border-b border-border/40 py-8 last:border-b-0">
          <h2 className="text-lg font-semibold">{group.title}</h2>
          {group.intro && <p className="mt-1 max-w-3xl text-sm text-muted-foreground">{group.intro}</p>}
          <ul className="mt-2 divide-y divide-border/40">
            {group.endpoints.map((endpoint) => (
              <EndpointRow key={`${endpoint.method} ${endpoint.path}`} endpoint={endpoint} />
            ))}
          </ul>
        </section>
      ))}
    </PageContainer>
  )
}
