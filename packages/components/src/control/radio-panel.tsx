import { Activity } from "react"
import { RadioOption } from "./radio.js"

const Root = ({ children }: { children: React.ReactNode }) => (
  <div className="flex flex-col rounded-lg border border-slate-200">{children}</div>
)

const Hr = () => <hr className="border-t border-t-slate-200" />

type PanelProps = {
  name?: string
  checked: boolean
  onChecked: (checked: boolean) => void
  label: string
  children?: React.ReactNode
  trailing?: string
}
const Panel = ({ name, checked, onChecked, label, children, trailing }: PanelProps) => {
  return (
    <div className="group px-3 py-4">
      <div className="flex items-center justify-between">
        <RadioOption name={name} checked={checked} onChange={(e) => onChecked(e.target.checked)}>
          {label}
        </RadioOption>
        {trailing != null && <span className="ml-2 text-slate-500 text-sm">{trailing}</span>}
      </div>
      {children != null && (
        <Activity mode={checked ? "visible" : "hidden"}>
          <div className="flex flex-col pl-7">
            <hr className="my-3 border-t border-t-slate-200" />
            {children}
          </div>
        </Activity>
      )}
    </div>
  )
}

export const RadioPanel = {
  Root,
  Hr,
  Panel,
}
