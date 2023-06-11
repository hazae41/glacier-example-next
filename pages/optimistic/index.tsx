import { Option, Some } from "@hazae41/option"
import { Data, createQuerySchema, useFetch, useQuery } from "@hazae41/xswr"
import { useCallback } from "react"
import { fetchAsJson } from "../../src/fetcher"

interface HelloData {
  name: string
}

function createHelloSchema() {
  return createQuerySchema("/api/hello", fetchAsJson<HelloData>)
}

function useHelloQuery() {
  const query = useQuery(createHelloSchema, [])
  useFetch(query)
  return query
}

export default function Page() {
  const hello = useHelloQuery()

  const { data, error, time, real, fetching, update, refetch, mutate, aborter, optimistic } = hello

  const onRefreshClick = useCallback(() => {
    refetch().then(r => r.ignore())
  }, [refetch])

  const onMutateClick = useCallback(() => {
    mutate(state => new Some(new Data({ name: "Hello World" })))
  }, [mutate])

  const onUpdateClick = useCallback(async () => {
    await update(async function* () {
      yield (previous) =>
        Option.from(previous.current?.data).mapSync(data =>
          new Data({ name: data.inner.name.replace("Doe", "Smith") }))

      await new Promise(ok => setTimeout(ok, 1000))

      yield (previous) =>
        Option.from(previous.current?.data).mapSync(data =>
          new Data({ name: data.inner.name.replace("Doe", "Johnson") }))

      await new Promise(ok => setTimeout(ok, 1000))

      return async (url, { signal }) => await fetchAsJson<HelloData>(url, { signal })
    })
  }, [update])

  const onAbortClick = useCallback(() => {
    aborter?.abort("aborted lol")
  }, [aborter])

  return <>
    <div>
      Data: {JSON.stringify(data.inner) ?? "undefined"}
    </div>
    <div>
      Real data: {JSON.stringify(real.data.inner) ?? "undefined"}
    </div>
    <div>
      time: {time}
    </div>
    <div style={{ color: "red" }}>
      {error.inner instanceof Error
        ? error.inner.message
        : JSON.stringify(error.inner)}
    </div>
    <div>
      {optimistic && "Optimistic"}
    </div>
    <div>
      {fetching && "Loading..."}
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

