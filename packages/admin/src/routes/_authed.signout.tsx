import { createFileRoute } from "@tanstack/react-router"
import { Button } from "broadcaster-components/button.js"
import { authClient } from "../libs/better-auth/client.js"

export const Route = createFileRoute("/_authed/signout")({
  component: SignOutPage,
})

function SignOutPage() {
  const handleSignOut = async () => {
    await authClient.signOut()
    window.location.replace("/signin")
  }

  return (
    <div className="p-4">
      <Button type="button" onClick={handleSignOut}>
        ログアウトする
      </Button>
    </div>
  )
}
