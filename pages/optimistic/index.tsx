import { Option, Some } from "@hazae41/option"
import { Data, State, createQuerySchema, useFetch, useQuery } from "@hazae41/xswr"
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

function pipeData<D, F>(piper: (data: D) => D) {
  return (state: State<D, F>) => Option.wrap(state.data).mapSync(data => data.mapSync(piper))
}

export default function Page() {
  const hello = useHelloQuery()

  const { current, real, fetching, update, refetch, mutate, aborter, optimistic } = hello

  const onRefreshClick = useCallback(() => {
    refetch().then(r => r.ignore())
  }, [refetch])

  const onMutateClick = useCallback(() => {
    mutate(state => new Some(new Data({ name: "Hello World" })))
  }, [mutate])

  const onUpdateClick = useCallback(async () => {
    await update(async function* () {
      yield pipeData(d => ({ ...d, name: d.name.replace("Doe", "Smith") }))
      await new Promise(ok => setTimeout(ok, 1000))
      yield pipeData(d => ({ ...d, name: d.name.replace("Doe", "Johnson") }))
      await new Promise(ok => setTimeout(ok, 1000))
      return fetchAsJson<HelloData>
    })
  }, [update])

  const onAbortClick = useCallback(() => {
    aborter?.abort("aborted lol")
  }, [aborter])

  return <>
    <div>
      Current: {JSON.stringify(current) ?? "undefined"}
    </div>
    <div>
      Real data: {JSON.stringify(real) ?? "undefined"}
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

