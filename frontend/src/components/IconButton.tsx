import type { ReactNode } from 'react'

type IconButtonProps = {
  label: string
  onClick: () => void
  variant?: 'default' | 'danger' | 'success'
  disabled?: boolean
  children: ReactNode
}

export function IconButton({
  label,
  onClick,
  variant = 'default',
  disabled = false,
  children,
}: IconButtonProps) {
  const variantClass =
    variant === 'danger'
      ? 'btn-danger'
      : variant === 'success'
        ? 'btn-success'
        : ''

  return (
    <button
      type="button"
      className={`btn btn-icon ${variantClass}`.trim()}
      title={label}
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
    >
      {children}
    </button>
  )
}

export function EditIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path
        fill="currentColor"
        d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zm2.92 2.33H5v-.92l9.06-9.06.92.92L5.92 19.58zM20.71 7.04a1 1 0 0 0 0-1.41l-2.34-2.34a1 1 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"
      />
    </svg>
  )
}

export function ForSaleIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path
        fill="currentColor"
        d="M21.41 11.58l-9-9A2 2 0 0 0 11 2H4a2 2 0 0 0-2 2v7a2 2 0 0 0 .59 1.41l9 9a2 2 0 0 0 2.82 0l7-7a2 2 0 0 0 0-2.83zM5.5 7A1.5 1.5 0 1 1 7 5.5 1.5 1.5 0 0 1 5.5 7z"
      />
    </svg>
  )
}

export function TrashIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path
        fill="currentColor"
        d="M6 19a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V7H6zm3.46-9.12 1.06 1.06L12 12.94l1.48-1.48 1.06 1.06L13.06 14l1.48 1.48-1.06 1.06L12 15.06l-1.48 1.48-1.06-1.06L10.94 14l-1.48-1.48 1.06-1.06L12 12.94l-1.48-1.48zM15.5 4l-1-1h-5l-1 1H5v2h14V4z"
      />
    </svg>
  )
}
