import { Data, Fetched, FetcherMore, NormalizerMore, Times, createQuery, createScrollableQuery, useFetch, useQuery, useScrollableQuery } from "@hazae41/glacier"
import { Nullable } from "@hazae41/option"
import { useCallback } from "react"
import { fetchAsJson } from "../../src/fetcher"

interface ElementPage {
  data: Element[],
  after?: string
}

type Element =
  | ElementData
  | ElementRef

interface ElementRef {
  ref: true,
  id: string
}

interface ElementData {
  id: string,
  value: number
}

function getElementSchema(id: string) {
  return createQuery({ key: `data:${id}` })
}

async function getElementRef(data: Element, times: Times, more: NormalizerMore) {
  if ("ref" in data) return data
  const schema = getElementSchema(data.id)
  await schema?.normalize(new Data(data, times), more)
  return { ref: true, id: data.id } as ElementRef
}

function getElementsSchema() {
  const fetcher = async (key: string, more?: FetcherMore) =>
    await fetchAsJson<ElementPage>(key, more).then(r => r.mapSync(x => [x]))

  const scroller = (previous: ElementPage) => {
    if (!previous.after)
      return undefined
    return `/api/scroll?after=${previous.after}`
  }

  const normalizer = async (fetched: Nullable<Fetched<ElementPage[], Error>>, more: NormalizerMore) =>
    fetched?.map(async pages =>
      await Promise.all(pages.map(async page =>
        ({ ...page, data: await Promise.all(page.data.map(data => getElementRef(data, fetched, more))) }))))

  return createScrollableQuery<string, ElementPage, Error>({
    key: `/api/scroll`,
    scroller: scroller,
    fetcher: fetcher,
    normalizer
  })
}

function useElement(id: string) {
  return useQuery(getElementSchema, [id])
}

function useElements() {
  const query = useScrollableQuery(getElementsSchema, [])
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
    {data?.inner.map((page, i) => <div key={i}>
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

