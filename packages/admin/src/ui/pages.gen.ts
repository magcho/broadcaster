// deno-fmt-ignore-file
// biome-ignore format: generated types do not need formatting
// prettier-ignore
import type { GetConfigResponse, PathsForPages } from 'waku/router';

// prettier-ignore
import type { getConfig as File_AuthedChannelChannelIndex_getConfig } from "./pages/(authed)/channel/[channel]/index.js"
// prettier-ignore
import type { getConfig as File_AuthedLabelsLabelIdDelete_getConfig } from "./pages/(authed)/labels/[labelId]/delete.js"
// prettier-ignore
import type { getConfig as File_AuthedLabelsLabelIdEdit_getConfig } from "./pages/(authed)/labels/[labelId]/edit.js"
// prettier-ignore
import type { getConfig as File_AuthedLabelsAssign_getConfig } from "./pages/(authed)/labels/assign.js"
// prettier-ignore
import type { getConfig as File_AuthedLabelsIndex_getConfig } from "./pages/(authed)/labels/index.js"
// prettier-ignore
import type { getConfig as File_AuthedMessageIndex_getConfig } from "./pages/(authed)/message/index.js"
// prettier-ignore
import type { getConfig as File_AuthedMessageSend_getConfig } from "./pages/(authed)/message/send"
// prettier-ignore
import type { getConfig as File_AuthedSponsorsSponsorIdDelete_getConfig } from "./pages/(authed)/sponsors/[sponsorId]/delete.js"
// prettier-ignore
import type { getConfig as File_AuthedSponsorsSponsorIdEdit_getConfig } from "./pages/(authed)/sponsors/[sponsorId]/edit.js"
// prettier-ignore
import type { getConfig as File_AuthedSponsorsIndex_getConfig } from "./pages/(authed)/sponsors/index.js"
// prettier-ignore
import type { getConfig as File_AuthedSponsorsNew_getConfig } from "./pages/(authed)/sponsors/new.js"
// prettier-ignore
import type { getConfig as File_Tmp_getConfig } from "./pages/tmp.js"

// prettier-ignore
type Page =
  | ({ path: "/channel/[channel]" } & GetConfigResponse<
      typeof File_AuthedChannelChannelIndex_getConfig
    >)
  | ({ path: "/labels/[labelId]/delete" } & GetConfigResponse<
      typeof File_AuthedLabelsLabelIdDelete_getConfig
    >)
  | ({ path: "/labels/[labelId]/edit" } & GetConfigResponse<
      typeof File_AuthedLabelsLabelIdEdit_getConfig
    >)
  | ({ path: "/labels/assign" } & GetConfigResponse<
      typeof File_AuthedLabelsAssign_getConfig
    >)
  | ({ path: "/labels" } & GetConfigResponse<
      typeof File_AuthedLabelsIndex_getConfig
    >)
  | { path: "/labels/new"; render: "static" }
  | ({ path: "/message" } & GetConfigResponse<
      typeof File_AuthedMessageIndex_getConfig
    >)
  | ({ path: "/message/send" } & GetConfigResponse<
      typeof File_AuthedMessageSend_getConfig
    >)
  | { path: "/signout"; render: "static" }
  | ({ path: "/sponsors/[sponsorId]/delete" } & GetConfigResponse<
      typeof File_AuthedSponsorsSponsorIdDelete_getConfig
    >)
  | ({ path: "/sponsors/[sponsorId]/edit" } & GetConfigResponse<
      typeof File_AuthedSponsorsSponsorIdEdit_getConfig
    >)
  | ({ path: "/sponsors" } & GetConfigResponse<
      typeof File_AuthedSponsorsIndex_getConfig
    >)
  | ({ path: "/sponsors/new" } & GetConfigResponse<
      typeof File_AuthedSponsorsNew_getConfig
    >)
  | { path: "/"; render: "static" }
  | { path: "/signin"; render: "static" }
  | ({ path: "/tmp" } & GetConfigResponse<typeof File_Tmp_getConfig>)

// prettier-ignore
declare module "waku/router" {
  interface RouteConfig {
    paths: PathsForPages<Page>
  }
  interface CreatePagesConfig {
    pages: Page
  }
}
