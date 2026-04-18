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
            <td>
              <code>{`<altテキスト|https://example.com>`}</code>
            </td>
          </tr>
          <tr>
            <td className="pr-4">ユーザーメンション</td>
            <td>
              <code>{`<@ユーザーID>`}</code>
            </td>
          </tr>
          <tr>
            <td className="pr-4">チャンネル</td>
            <td>
              <code>{`<#チャンネルID>`}</code>
            </td>
          </tr>
          <tr>
            <td className="pr-4">太字</td>
            <td>
              <code>*太字*</code>
            </td>
          </tr>
          <tr>
            <td className="pr-4">イタリック体</td>
            <td>
              <code>_イタリック体_</code>
            </td>
          </tr>
          <tr>
            <td className="pr-4">打ち消し</td>
            <td>
              <code>~打ち消し~</code>
            </td>
          </tr>
        </tbody>
      </table>
    </section>
  )
}
