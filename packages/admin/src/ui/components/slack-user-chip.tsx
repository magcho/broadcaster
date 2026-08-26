import type { SlackUser } from "../../domain/model/SlackChannel"

type Props = {
  user: SlackUser
}

export const SlackUserChip = ({ user }: Props) => {
  return (
    <div className="flex items-center gap-1">
      <img src={user.iconUrl} width={20} height={20} className="rounded-full" />
      {user.displayName || user.name}
    </div>
  )
}
