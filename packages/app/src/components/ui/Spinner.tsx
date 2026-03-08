interface SpinnerProps {
  readonly className?: string
  readonly label?: string
}

export function Spinner({ className = 'w-4 h-4', label = 'Caricamento...' }: SpinnerProps) {
  return (
    <span role="status" aria-label={label} className="inline-flex">
      <span className={`${className} rounded-full border-2 border-brand-line border-t-brand-blue-l animate-spin`} aria-hidden="true" />
      <span className="sr-only">{label}</span>
    </span>
  )
}
