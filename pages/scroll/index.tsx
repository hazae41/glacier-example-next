import { NormalizerMore, createQuerySchema, createScrollQuerySchema, useFetch, useQuery, useScrollQuery } from "@hazae41/xswr"
import { useCallback } from "react"
import { fetchAsJson } from "../../src/fetcher"

interface ElementPage {
  data: (ElementData | ElementRef)[],
  after?: string
}

interface ElementRef {
  ref: true,
  id: string
}

interface ElementData {
  id: string,
  value: number
}

function getElementSchema(id: string) {
  return createQuerySchema(`data:${id}`, undefined)
}

async function getElementRef(data: ElementData | ElementRef, more: NormalizerMore) {
  if ("ref" in data) return data
  const schema = getElementSchema(data.id)
  await schema?.normalize(data, more)
  return { ref: true, id: data.id } as ElementRef
}

function getElementsSchema() {
  async function normalizer(pages: ElementPage[], more: NormalizerMore) {
    return await Promise.all(pages.map(async page => {
      const data = await Promise.all(page.data.map(data => getElementRef(data, more)))
      return { ...page, data } as ElementPage
    }))
  }

  return createScrollQuerySchema((previous) => {
    if (!previous)
      return `/api/scroll`
    if (!previous.after)
      return undefined
    return `/api/scroll?after=${previous.after}`
  }, fetchAsJson<ElementPage>, { normalizer })
}

function useElement(id: string) {
  return useQuery(getElementSchema, [id])
}

function useElements() {
  const query = useScrollQuery(getElementsSchema, [])
  useFetch(query)
  return query
}

function Element(props: { id: string }) {
  const { data } = useElement(props.id)

  return <div>{JSON.stringify(data) ?? "undefined"}</div>
}

export default function Page() {
  const scrolls = useElements()

  const { data, error, fetching, refetch, scroll, aborter } = scrolls

  const onRefreshClick = useCallback(() => {
    refetch()
  }, [refetch])

  const onScrollClick = useCallback(() => {
    scroll()
  }, [scroll])

  const onAbortClick = useCallback(() => {
    aborter!.abort("dd")
  }, [aborter])

  return <>
    {data.inner?.map((page, i) => <div key={i}>
      <div>page {i}</div>
      {page.data.map(ref =>
        <Element
          key={ref.id}
          id={ref.id} />)}
    </div>)}
    <div style={{ color: "red" }}>
      {error instanceof Error
        ? error.message
        : JSON.stringify(error)}
    </div>
    <div>
      {fetching && "Loading..."}
    </div>
    <button onClick={onRefreshClick}>
      Refresh
    </button>
    <button onClick={onScrollClick}>
      Scroll
    </button>
    {aborter &&
      <button onClick={onAbortClick}>
        Abort
      </button>}
  </>
}

