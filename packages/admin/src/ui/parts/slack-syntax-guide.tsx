import { CopyButton } from "broadcaster-components/copy-button.js"

export const SlackSyntaxGuide = () => {
  return (
    <section
      id="syntax-guide"
      aria-labelledby="show-syntax-guide-trigger"
      className="w-full rounded bg-slate-100 p-2 text-[11px]"
    >
      <table>
        <tbody>
          <tr>
            <td className="pr-4">リンク</td>
            <td className="flex items-center gap-1">
              <div>
                <CopyButton text="<https://example.com|テキスト>" />
              </div>
              <code>{`<https://example.com|テキスト>`}</code>
            </td>
          </tr>
          <tr>
            <td className="pr-4">リンク（単体）</td>
            <td className="flex items-center gap-1">
              <div>
                <CopyButton text="<https://example.com>" />
              </div>
              <code>{`<https://example.com>`}</code>
            </td>
          </tr>
          <tr>
            <td className="pr-4">ユーザーメンション</td>
            <td className="flex items-center gap-1">
              <div>
                <CopyButton text="<@ユーザーID>" />
              </div>
              <code>{`<@ユーザーID>`}</code>
            </td>
          </tr>
          <tr>
            <td className="pr-4">チャンネル</td>
            <td className="flex items-center gap-1">
              <div>
                <CopyButton text="<#チャンネルID>" />
              </div>
              <code>{`<#チャンネルID>`}</code>
            </td>
          </tr>
          <tr>
            <td className="pr-4">太字</td>
            <td className="flex items-center gap-1">
              <div>
                <CopyButton text="*太字*" />
              </div>
              <code>*太字*</code>
            </td>
          </tr>
          <tr>
            <td className="pr-4">イタリック体</td>
            <td className="flex items-center gap-1">
              <div>
                <CopyButton text="_イタリック体_" />
              </div>
              <code>_イタリック体_</code>
            </td>
          </tr>
          <tr>
            <td className="pr-4">打ち消し</td>
            <td className="flex items-center gap-1">
              <div>
                <CopyButton text="~打ち消し~" />
              </div>
              <code>~打ち消し~</code>
            </td>
          </tr>
        </tbody>
      </table>
    </section>
  )
}
