import { Form } from "broadcaster-components/form/form.js"
import { FormControl } from "broadcaster-components/form/form-control.js"
import { SubmitButton } from "broadcaster-components/form/form-submit-button.js"
import { useForm } from "broadcaster-components/libs/use-form.js"
import { UnstyledSlackPreview } from "broadcaster-components/slack-preview.js"
import { cn } from "broadcaster-components/utils/cn.js"
import { useRef, useState, useTransition } from "react"
import { TbChevronRight } from "react-icons/tb"
import { parseMrkdwn } from "slack-parser"
import { createAndSendSlackMessageController } from "../../controller/slack-message-create-and-send.js"
import { CreateAndSendSlackMessageSchema } from "../../controller/slack-message-create-and-send-schema.js"
import type { Label, Sponsor } from "../../domain/model/Sponsor.js"
import { ScheduleInput } from "../parts/ScheduleInput.js"
import { SponsorTargetInput } from "../parts/SponsorTargetInput.js"
import { SlackSyntaxGuide } from "../parts/slack-syntax-guide.js"

type Props = {
  sponsors: Sponsor[]
  labels: Label[]
  onComplete?: () => void
}

export const SendMessageForm = ({ sponsors, labels, onComplete }: Props) => {
  const { values, setValue, registerTextarea, getValidValues } = useForm(
    CreateAndSendSlackMessageSchema,
    {
      message: "",
      addMention: true,
      scheduledAt: "Immediate" as Date | "Immediate",
      targetType: "Label" as "Label" | "Sponsor",
      sponsorIds: [] as string[],
      labelIds: [] as string[],
    },
  )

  const [isPending, startTransition] = useTransition()

  const handleSubmit = () => {
    startTransition(async () => {
      const value = getValidValues()
      if (value == null) {
        return
      }
      await createAndSendSlackMessageController({ data: value })
      onComplete?.()
    })
  }

  const handleTestSend = () => {
    startTransition(async () => {
      const message = values.message
      if (message.trim() === "") {
        window.alert("メッセージが空です。メッセージを入力してください。")
        return
      }

      await createAndSendSlackMessageController({
        data: {
          message,
          addMention: false,
          scheduledAt: "Immediate",
          targetType: "Test",
          sponsorIds: [],
          labelIds: [],
        },
      })
    })
  }

  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const [showSyntaxGuide, setShowSyntaxGuide] = useState(false)

  return (
    <Form action={handleSubmit} fullWidth>
      <div className="flex flex-col">
        <FormControl label="メッセージ" required>
          {/** biome-ignore lint/a11y/noStaticElementInteractions: 補助的な役割のonClickなので許容する */}
          {/** biome-ignore lint/a11y/useKeyWithClickEvents: 補助的な役割のonClickなので許容する */}
          <div
            className="flex w-full max-w-[600px] cursor-text flex-col items-start gap-4 rounded-lg border border-slate-200 p-4"
            onClick={() => textareaRef.current?.focus()}
          >
            {/* 入力欄 */}
            <div className="min-h-[72px] w-full pb-4">
              <textarea
                {...registerTextarea("message")}
                className="field-sizing-content w-full resize-none placeholder:text-slate-400 focus:outline-none"
                placeholder="メッセージを入力してください..."
                ref={textareaRef}
              />
            </div>

            {/* プレビュー */}
            <div className="flex w-full gap-3 rounded-lg p-4 shadow-main">
              <img src="/slack-icon.png" alt="Slack Icon" className="size-8" />
              <div className="flex flex-col gap-1">
                <div className="font-bold text-[13px]">プレビュー</div>
                <UnstyledSlackPreview
                  message={parseMrkdwn(values.message).document}
                />
              </div>
            </div>

            {/* Footer */}
            <div className="flex w-full justify-between">
              <button
                type="button"
                id="show-syntax-guide-trigger"
                aria-expanded={showSyntaxGuide ? "true" : "false"}
                aria-controls="syntax-guide"
                onClick={() => setShowSyntaxGuide((prev) => !prev)}
                className="flex items-center gap-1 rounded px-2 py-1 text-slate-600 text-sm hover:underline"
              >
                <TbChevronRight
                  className={cn(showSyntaxGuide && "rotate-90", "transition")}
                />
                文法を確認
              </button>
              <button
                type="button"
                onClick={handleTestSend}
                className="rounded px-2 py-1 text-sky-600 text-sm enabled:hover:underline disabled:text-slate-400"
                disabled={isPending}
              >
                {isPending ? "テスト送信中..." : "テスト送信する →"}
              </button>
            </div>

            {showSyntaxGuide && <SlackSyntaxGuide />}
          </div>
        </FormControl>
      </div>

      <div className="flex max-w-[600px] flex-col gap-4">
        {/* 送信先 */}
        <FormControl label="送信先" required>
          <SponsorTargetInput
            targetType={values.targetType as "Label" | "Sponsor"}
            onChangeTargetType={(val) => setValue("targetType", val)}
            sponsorIds={values.sponsorIds}
            onChangeSponsorIds={(vals) => setValue("sponsorIds", vals)}
            labelIds={values.labelIds}
            onChangeLabelIds={(vals) => setValue("labelIds", vals)}
            labels={labels}
            sponsors={sponsors}
          />
        </FormControl>

        {/* 送信タイミング */}
        <FormControl label="送信日時" required>
          <ScheduleInput
            scheduledAt={values.scheduledAt}
            onChangeScheduledAt={(val) => setValue("scheduledAt", val)}
          />
        </FormControl>
      </div>

      <div>
        <SubmitButton type="submit" disabled={isPending}>
          送信
        </SubmitButton>
      </div>
    </Form>
  )
}
