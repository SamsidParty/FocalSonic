import { SVGProps } from 'react'

export default function RepeatOne(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      width={24}
      height={24}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      stroke="currentColor"
      {...props}
    >
      <path
        d="M17 2l4 4-4 4"
        strokeWidth={props.strokeWidth ?? 2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M3 11v-1a4 4 0 014-4h14M7 22l-4-4 4-4"
        strokeWidth={props.strokeWidth ?? 2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M21 13v1a4 4 0 01-4 4H3M10 10l2-1v6"
        strokeWidth={props.strokeWidth ?? 2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
