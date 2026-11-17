import { PageHeader } from '@/components/shared/page-header'
import { Eyebrow } from '@/components/shared/eyebrow'
import { CollabBento } from './collab-bento'

/** The artist program: the pitch and the interactive bento of how selling on CHTH works. */
export function CollabView() {
  return (
    <>
      <PageHeader
        className="mb-0 sm:mb-0"
        eyebrow={<Eyebrow pulse>Artist program</Eyebrow>}
        title={
          <>
            Your art. <span className="text-muted-foreground">Our hustle.</span>
          </>
        }
      />
      <CollabBento />
    </>
  )
}
