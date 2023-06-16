import { Option } from "@hazae41/option";
import { NormalizerMore, State, createQuerySchema, useFetch, useQuery } from "@hazae41/xswr";
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
  return createQuerySchema(`/api/array?id=${id}`, fetchAsJson<HelloData>)
}

async function getDataRef(data: HelloData | HelloRef, more: NormalizerMore): Promise<HelloRef> {
  if ("ref" in data) return data
  const schema = getDataSchema(data.id)
  await schema?.normalize(data, more)
  return { ref: true, id: data.id }
}

function getAllHelloSchema() {
  const normalizer = async (data: Hello[], more: NormalizerMore) =>
    await Promise.all(data.map(data => getDataRef(data, more)))

  return createQuerySchema(`/api/array/all`, fetchAsJson<Hello[]>, { normalizer })
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
