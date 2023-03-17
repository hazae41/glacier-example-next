import { getSchema, useFetch, useSchema } from "@hazae41/xswr"
import { useCallback } from "react"
import { fetchAsJson } from "../../src/fetcher"

interface HelloData {
  name: string
}

function getHelloSchema() {
  return getSchema("/api/hello", fetchAsJson<HelloData>)
}

function useHelloData() {
  const handle = useSchema(getHelloSchema, [])
  useFetch(handle)
  return handle
}

export default function Page() {
  const hello = useHelloData()

  const { data, realData, error, time, loading, update, refetch, mutate, aborter, optimistic } = hello

  const onRefreshClick = useCallback(() => {
    refetch()
  }, [refetch])

  const onMutateClick = useCallback(() => {
    mutate(() => ({ data: { name: "Hello World" } }))
  }, [mutate])

  const onUpdateClick = useCallback(async () => {
    await update(async function* ({ signal }) {
      yield (previous) => ({ data: { name: `${previous?.realData?.name} 1` } })

      await new Promise(ok => setTimeout(ok, 2000))

      yield (previous) => ({ data: { name: `${previous?.realData?.name} 2` } })

      return await fetchAsJson<HelloData>("/api/hello", { signal })
    })
  }, [update])

  const onAbortClick = useCallback(() => {
    aborter!.abort("aborted lol")
  }, [aborter])

  return <>
    <div>
      Data: {JSON.stringify(data) ?? "undefined"}
    </div>
    <div>
      Real data: {JSON.stringify(realData) ?? "undefined"}
    </div>
    <div>
      time: {time && ~~(time / 1000)}
    </div>
    <div style={{ color: "red" }}>
      {error instanceof Error
        ? error.message
        : JSON.stringify(error)}
    </div>
    <div>
      {optimistic && "Optimistic"}
    </div>
    <div>
      {loading && "Loading..."}
    </div>
    <button onClick={onRefreshClick}>
      Refresh
    </button>
    <button onClick={onUpdateClick}>
      Update
    </button>
    <button onClick={onMutateClick}>
      Mutate
    </button>
    {aborter &&
      <button onClick={onAbortClick}>
        Abort
      </button>}
  </>
}

