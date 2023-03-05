import { getSchema, NormalizerMore, useFetch, useSchema } from "@hazae41/xswr";
import { useCallback } from "react";
import { fetchAsJson } from "../../src/fetcher";

interface Ref {
  ref: true
  id: string
}

interface Data {
  id: string
  name: string
}

type F<D, K> = (k: K) => void

interface P<K> {
  lol?: K
}

function getDataSchema(id: string) {
  return getSchema(`/api/array?id=${id}`, fetchAsJson<Data>)
}

async function getDataRef(data: Data | Ref, more: NormalizerMore) {
  if ("ref" in data) return data
  const schema = getDataSchema(data.id)
  await schema.normalize(data, more)
  return { ref: true, id: data.id } as Ref
}

function getAllDataSchema() {
  async function normalizer(data: (Data | Ref)[], more: NormalizerMore) {
    return await Promise.all(data.map(data => getDataRef(data, more)))
  }

  return getSchema<(Data | Ref)[]>(
    `/api/array/all`,
    fetchAsJson<Data[]>,
    { normalizer })
}

function useAllData() {
  const handle = useSchema(getAllDataSchema, [])
  useFetch(handle)
  return handle
}

function useData(id: string) {
  const handle = useSchema(getDataSchema, [id])
  useFetch(handle)
  return handle
}

export default function Page() {
  const { data, refetch } = useAllData()

  const onRefetchClick = useCallback(() => {
    refetch()
  }, [refetch])

  console.log("all", data)

  if (!data) return <>Loading...</>

  return <>
    {data?.map(ref =>
      <Element
        key={ref.id}
        id={ref.id} />)}
    <button onClick={onRefetchClick}>
      Refetch
    </button>
  </>
}

function Element(props: { id: string }) {
  const { data, mutate } = useData(props.id)

  const onMutateClick = useCallback(() => {
    mutate(c => c && ({ data: c.data && { ...c.data, name: "Unde Fined" } }))
  }, [mutate])

  console.log(props.id, data)

  return <div>
    {JSON.stringify(data) ?? "undefined"}
    <button onClick={onMutateClick}>
      Mutate
    </button>
  </div>
}
