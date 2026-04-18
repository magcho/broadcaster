import { createFileRoute } from "@tanstack/react-router"
import { Button } from "broadcaster-components/button.js"
import { authClient } from "../libs/better-auth/client.js"

export const Route = createFileRoute("/signin")({
  component: SignInPage,
})

function SignInPage() {
  const handleSignin = async () => {
    await authClient.signIn.social({
      provider: "google",
      callbackURL: window.location.origin,
    })
  }

  return (
    <div>
      <div className="p-4">
        <Button type="button" onClick={handleSignin}>
          Googleアカウントでログイン
        </Button>
      </div>
    </div>
  )
}
