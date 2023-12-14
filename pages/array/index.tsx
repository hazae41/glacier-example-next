import { Data, Fetched, NormalizerMore, State, Times, createQuery, useFetch, useQuery } from "@hazae41/glacier";
import { Nullable, Option } from "@hazae41/option";
import { useCallback } from "react";
import { fetchAsJson } from "../../src/fetcher";

export type Hello =
  | HelloData
  | HelloRef

export interface HelloRef {
  ref: true
  id: string
}

export interface HelloData {
  id: string
  name: string
}

function getDataSchema(id: string) {
  return createQuery({
    key: `/api/array?id=${id}`,
    fetcher: fetchAsJson<HelloData>
  })
}

async function getDataRef(data: Hello, times: Times, more: NormalizerMore): Promise<HelloRef> {
  if ("ref" in data) return data
  const schema = getDataSchema(data.id)
  await schema?.normalize(new Data(data, times), more)
  return { ref: true, id: data.id }
}

function getAllHelloSchema() {
  const normalizer = async (fetched: Nullable<Fetched<Hello[], Error>>, more: NormalizerMore) =>
    await fetched?.map(async (data) => await Promise.all(data.map(data => getDataRef(data, fetched, more))))

  return createQuery<string, Hello[], Error>({
    key: `/api/array/all`,
    fetcher: fetchAsJson<Hello[]>,
    normalizer
  })
}

function useAllHello() {
  const query = useQuery(getAllHelloSchema, [])
  useFetch(query)
  return query
}

function useHello(id: string) {
  const query = useQuery(getDataSchema, [id])
  useFetch(query)
  return query
}

export default function Page() {
  const { data, refetch } = useAllHello()

  const onRefetchClick = useCallback(() => {
    refetch()
  }, [refetch])

  console.log("all", data)

  if (data === undefined)
    return <>Loading...</>

  return <>
    {data.inner?.map(ref =>
      <Element
        key={ref.id}
        id={ref.id} />)}
    <button onClick={onRefetchClick}>
      Refetch
    </button>
  </>
}

function pipeData<D, F>(piper: (data: D) => D) {
  return (state: State<D, F>) => Option.wrap(state.data).mapSync(data => data.mapSync(piper))
}

function Element(props: { id: string }) {
  const { data, mutate } = useHello(props.id)

  const onMutateClick = useCallback(() => {
    mutate(pipeData(d => ({ ...d, name: "Hello World" })))
  }, [mutate])

  console.log(props.id, data)

  return <div>
    {JSON.stringify(data) ?? "undefined"}
    <button onClick={onMutateClick}>
      Mutate
    </button>
  </div>
}
