const slackApiBaseUrl = "https://slack.com/api/"

type ConversationsListResponse = {
  ok: boolean
  channels: {
    id: string
    name: string
    is_channel: boolean
    is_private: boolean
    is_shared: boolean
  }[]
}
const conversationsList = async (token: string) => {
  const url = new URL("users.conversations", slackApiBaseUrl)
  url.searchParams.append("limit", "500")
  url.searchParams.append("types", "public_channel,private_channel")
  url.searchParams.append("exclude_archived", "true")

  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })

  if (!res.ok) {
    console.error(res)
    throw new Error()
  }

  const result: ConversationsListResponse = await res.json()
  return result.channels
}

type ConversationsInfoResponse = {
  ok: boolean
  channel: {
    id: string
    name: string
    is_channel: boolean
    is_private: boolean
    is_shared: boolean
  }
}
const conversationsInfo = async (token: string, channelId: string) => {
  const url = new URL("conversations.info", slackApiBaseUrl)
  url.searchParams.append("channel", channelId)

  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })

  if (!res.ok) {
    console.error(res)
    throw new Error()
  }

  const result: ConversationsInfoResponse = await res.json()
  return result.channel
}

type ConversationsMembersReponse = {
  members: string[]
  response_metadata: {
    next_cursor: string
  }
}
const conversationsMembers = async (token: string, channelId: string) => {
  const url = new URL("conversations.members", slackApiBaseUrl)
  url.searchParams.append("limit", "30")
  url.searchParams.append("channel", channelId)

  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })

  if (!res.ok) {
    console.error(res)
    throw new Error()
  }

  const result: ConversationsMembersReponse = await res.json()
  const members = await Promise.all(
    result.members.slice(0, 30).map((memberId) => usersInfo(token, memberId)),
  )

  return members
}

type UserInfoResponse = {
  ok: boolean
  user: {
    id: string
    team_id: string
    real_name: string
    deleted: boolean
    profile: {
      display_name: string
      image_48: "https://.../avatar/e3b51ca72dee4ef87916ae2b9240df50.jpg"
    }
    is_restricted: false
    is_ultra_restricted: false
    is_bot: false
    is_app_user: false
  }
}
const usersInfo = async (token: string, userId: string) => {
  const url = new URL("users.info", slackApiBaseUrl)
  url.searchParams.append("user", userId)
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })
  if (!res.ok) {
    console.error(res)
    throw new Error()
  }

  const result: UserInfoResponse = await res.json()
  if (!result.ok) {
    console.error(res)
    throw new Error()
  }
  return {
    id: result.user.id,
    real_name: result.user.real_name,
    displayName: result.user.profile.display_name,
    iconUrl: result.user.profile.image_48,
    teamId: result.user.team_id,
    deleted: result.user.deleted,
    isRestricted: result.user.is_restricted,
    isUltraRestricted: result.user.is_ultra_restricted,
    isBot: result.user.is_bot,
    isAppUser: result.user.is_app_user,
  }
}

export const slackApi = {
  conversationsInfo,
  conversationsList,
  conversationsMembers,
  usersInfo,
}
