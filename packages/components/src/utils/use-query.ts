import { useEffect, useRef, useState } from "react"
import { AssertNever } from "../libs/assert-never"

type PromiseState<Data> =
  | { status: "loading" | "not-started" }
  | { status: "success"; data: Data }
  | { status: "error"; error: unknown }

type Fetcher<Data> = (abortSignal: AbortSignal) => Promise<Data>

type UseQueryReturn<Data> = {
  revalidate: () => void
} & (
  | {
      status: "not-started"
      isLoading: true
      isError: false
      data: undefined
    }
  | {
      status: "loading"
      isLoading: true
      isError: false
      data: undefined
    }
  | {
      status: "error"
      isLoading: false
      isError: true
      data: undefined
    }
  | {
      status: "success"
      isLoading: false
      isError: false
      data: Data
    }
)

type UseQueryOption = {
  lazy?: boolean
}
export const useQuery = <Data>(
  fetcher: Fetcher<Data>,
  { lazy = false }: UseQueryOption = {},
  deps: string[] = [],
): UseQueryReturn<Data> => {
  const [state, setState] = useState<PromiseState<Data>>({
    status: "not-started",
  })
  const acRef = useRef<AbortController | null>(null)

  const doFetch = () => {
    const ac = new AbortController()
    acRef.current = ac

    setState({ status: "loading" })
    fetcher(ac.signal)
      .then((res) => {
        if (ac.signal.aborted) return
        setState({ status: "success", data: res })
      })
      .catch((err) => {
        if (ac.signal.aborted) return
        setState({ status: "error", error: err })
      })
      .finally(() => {
        acRef.current = null
      })
    return ac
  }

  useEffect(() => {
    if (!lazy) {
      const ac = doFetch()
      return () => ac.abort()
    }
  }, [lazy, ...deps])

  const revalidate = () => {
    doFetch()
  }

  if (state.status === "loading") {
    return {
      status: "loading",
      isLoading: true,
      isError: false,
      data: undefined,
      revalidate,
    }
  } else if (state.status === "not-started") {
    return {
      status: "not-started",
      isLoading: true,
      isError: false,
      data: undefined,
      revalidate,
    }
  } else if (state.status === "error") {
    return {
      status: "error",
      isLoading: false,
      isError: true,
      data: undefined,
      revalidate,
    }
  } else if (state.status === "success") {
    return {
      status: "success",
      isLoading: false,
      isError: false,
      data: state.data,
      revalidate,
    }
  } else {
    throw new AssertNever(state.status)
  }
}
