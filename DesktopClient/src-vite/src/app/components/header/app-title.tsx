import { igniteViewDragRegion } from '@/utils/igniteViewDragRegion'
import { LazyLoadImage } from 'react-lazy-load-image-component'

export function AppTitle() {
  return (
    <div {...igniteViewDragRegion} className="flex gap-2 items-center">
      <LazyLoadImage
        {...igniteViewDragRegion}
        src="/icon_transparent.svg"
        alt="Aonsoku icon"
        className="w-6 h-6"
      />
      <span
        {...igniteViewDragRegion}
        className="leading-7 text-sm font-medium text-muted-foreground"
      >
        Aonsoku
      </span>
    </div>
  )
}
