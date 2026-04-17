import { CheckboxOption } from "broadcaster-components/control/checkbox.js"
import { RadioPanel } from "broadcaster-components/control/radio-panel.js"
import { useId } from "react"
import type { Label, Sponsor } from "../../domain/model/Sponsor.js"
import { LabelDisplay } from "../components/label-display.js"

type Props = {
  targetType: "Label" | "Sponsor"
  onChangeTargetType: (value: "Label" | "Sponsor") => void
  sponsorIds: string[]
  labelIds: string[]
  onChangeSponsorIds: (values: string[]) => void
  onChangeLabelIds: (values: string[]) => void
  labels: Label[]
  sponsors: Sponsor[]
}

const getLabelSponsorMap = (sponsors: Sponsor[]) => {
  return sponsors.reduce(
    (acc, sponsor) => {
      sponsor.labels.forEach((label) => {
        if (acc[label.id] == null) {
          acc[label.id] = []
        }
        acc[label.id]!.push(sponsor.id)
      })
      return acc
    },
    {} as Record<string, string[]>,
  )
}

export const SponsorTargetInput = ({
  targetType,
  onChangeTargetType,
  sponsorIds,
  onChangeSponsorIds,
  labelIds,
  onChangeLabelIds,
  labels,
  sponsors,
}: Props) => {
  const id = useId()
  const labelSponsorMap = getLabelSponsorMap(sponsors)

  const selectedSponsorCount =
    targetType === "Label"
      ? new Set(labelIds.flatMap((labelId) => labelSponsorMap[labelId] ?? []))
          .size
      : sponsorIds.length

  return (
    <div>
      <RadioPanel.Root>
        <RadioPanel.Panel
          name={id}
          checked={targetType === "Label"}
          onChecked={(checked) => {
            if (checked) {
              onChangeTargetType("Label")
            }
          }}
          label="ラベルで指定する"
          trailing={
            targetType === "Label" ? `${selectedSponsorCount}社` : undefined
          }
        >
          <div className="flex flex-wrap gap-4">
            {labels.map((label) => {
              return (
                <CheckboxOption
                  key={label.id}
                  checked={labelIds.includes(label.id)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      onChangeLabelIds([...labelIds, label.id])
                    } else {
                      onChangeLabelIds(labelIds.filter((id) => id !== label.id))
                    }
                  }}
                >
                  <LabelDisplay label={label} />
                </CheckboxOption>
              )
            })}
          </div>
        </RadioPanel.Panel>

        <RadioPanel.Hr />

        <RadioPanel.Panel
          name={id}
          checked={targetType === "Sponsor"}
          onChecked={(checked) => {
            if (checked) {
              onChangeTargetType("Sponsor")
            }
          }}
          label="個別に指定する"
          trailing={
            targetType === "Sponsor" ? `${selectedSponsorCount}社` : undefined
          }
        >
          <div className="flex flex-wrap gap-4">
            {sponsors.map((sponsor) => (
              <CheckboxOption
                key={sponsor.id}
                checked={sponsorIds.includes(sponsor.id)}
                onChange={(e) => {
                  if (e.target.checked) {
                    onChangeSponsorIds([...sponsorIds, sponsor.id])
                  } else {
                    onChangeSponsorIds(
                      sponsorIds.filter((id) => id !== sponsor.id),
                    )
                  }
                }}
              >
                {sponsor.name}
              </CheckboxOption>
            ))}
          </div>
        </RadioPanel.Panel>
      </RadioPanel.Root>
    </div>
  )
}
