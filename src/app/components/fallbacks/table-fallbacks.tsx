import clsx from 'clsx'
import { Skeleton } from '@/app/components/ui/skeleton'

interface TableFallbackProps {
  variant?: 'classic' | 'modern'
}

export function TableFallback({ variant = 'classic' }: TableFallbackProps) {
  const isClassic = variant === 'classic'
  const isModern = variant === 'modern'

  return (
    <div
      className={clsx(
        'w-full rounded-md',
        isClassic && 'bg-background border',
        isModern && 'bg-transparent',
      )}
    >
      <div
        className={clsx(
          'grid grid-cols-table-fallback px-2 h-12 items-center',
          isModern && 'mb-2 border-b',
        )}
      >
        <Skeleton className="w-5 h-5 ml-2" />
        <Skeleton className="w-8 h-5" />
        <Skeleton className="w-16 h-5" />
        <Skeleton className="w-16 h-5" />
        <Skeleton className="w-12 h-5" />
        <Skeleton className="w-16 h-5" />
        <Skeleton className="w-12 h-5" />
        <Skeleton className="w-5 h-5 ml-auto mr-2" />
      </div>
      {Array.from({ length: 10 }).map((_, index) => (
        <div
          key={index}
          className={clsx(
            'grid grid-cols-table-fallback p-2 items-center',
            isClassic && 'border-t',
          )}
        >
          <Skeleton className="w-5 h-5 ml-2" />
          <div className="flex items-center gap-2">
            <Skeleton className="w-10 h-10" />
            <Skeleton className="w-36 h-5" />
          </div>
          <Skeleton className="w-36 h-5" />
          <Skeleton className="w-12 h-5" />
          <Skeleton className="w-6 h-5" />
          <Skeleton className="w-20 h-5" />
          <Skeleton className="w-14 h-5 rounded-full" />
          <div className="flex items-center justify-end gap-4 w-full">
            <Skeleton className="w-5 h-5 rounded-full" />
            <Skeleton className="w-5 h-5 rounded-full" />
            <Skeleton className="w-5 h-5 mr-2" />
          </div>
        </div>
      ))}
    </div>
  )
}

export function TopSongsTableFallback() {
  return (
    <div className="w-full">
      <Skeleton className="w-28 h-8 mb-4 mt-6 rounded" />

      <TableFallback variant="modern" />
    </div>
  )
}
