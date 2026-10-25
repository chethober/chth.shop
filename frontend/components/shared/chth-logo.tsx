import type { SVGProps } from 'react'

/** The CHTH mark, drawn in `currentColor` so it follows the theme. */
export function ChthLogo(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="870 424 844 380" fill="currentColor" aria-hidden="true" {...props}>
      <g fill="none" stroke="currentColor" strokeWidth={26} strokeLinecap="round" strokeLinejoin="round">
        <path d="M 893 612 C 893 720, 980 780, 1075 780 C 1170 780, 1230 710, 1290 615 C 1350 520, 1410 447, 1520 447 C 1620 447, 1690 520, 1690 635" />
        <path d="M 1037 452 C 1140 452, 1220 520, 1290 615 C 1350 700, 1420 780, 1525 780" />
      </g>
      <circle cx="988" cy="464" r="22" />
      <circle cx="937" cy="503" r="20" />
      <circle cx="904" cy="558" r="19" />
      <circle cx="1668" cy="684" r="20" />
      <circle cx="1633" cy="731" r="19" />
      <circle cx="1593" cy="768" r="18" />
    </svg>
  )
}
