export type SlackChannel = {
  id: string
  name: string
  kind: "public" | "private"
  isExtShared: boolean
}

export type SlackUser = {
  id: string
  name: string
  displayName: string
  iconUrl: string
  kind: "single_channel_guest" | "multi_channel_guest" | "connect" | "normal"
}
