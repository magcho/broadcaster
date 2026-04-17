import type { ComponentProps } from "react"

type Props = {
  fullWidth?: boolean
}

export const Form = ({
  fullWidth,
  ...props
}: ComponentProps<"form"> & Props) => (
  <form
    {...props}
    className={`flex w-full ${fullWidth ? "max-w-full" : "max-w-[600px]"} flex-col gap-6 p-4`}
  />
)
