import { useTranslation } from 'react-i18next'
import { Keyboard } from '@/app/components/command/keyboard-key'
import { IShortcut } from '@/types/shortcuts'

interface ShortcutsGroupProps {
  title: string
  shortcuts: IShortcut[]
}

export function ShortcutsGroup({ title, shortcuts }: ShortcutsGroupProps) {
  const { t } = useTranslation()

  return (
    <div className="space-y-3">
      <span className="font-medium block">{title}</span>
      <div className="space-y-2">
        {shortcuts.map(({ label, shortcuts: keys }) => (
          <div
            key={label}
            className="flex justify-between relative text-muted-foreground"
          >
            <p className="text-sm">{t(label)}</p>
            <div className="flex gap-1">
              {keys.map((key) => (
                <Keyboard text={key} className="top-0 relative" key={key} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
