import { createQuerySchema, useFetch, useQuery, } from "@hazae41/xswr"
import { useCallback, useState } from "react"
import { fetchAsJson } from "../../src/fetcher"

function getHelloSchema() {
  return createQuerySchema("/api/hello", fetchAsJson<unknown>)
}

function useHello() {
  const query = useQuery(getHelloSchema, [])
  useFetch(query)
  return query
}

function Consumer() {
  const hello = useHello()

  return <div>
    {JSON.stringify(hello.data) ?? "undefined"}
  </div>
}

export default function Page() {
  const [count, setCount] = useState(0)

  const increase = useCallback(() => {
    setCount(Math.min(count + 1, 10))
  }, [count])

  const decrease = useCallback(() => {
    setCount(Math.max(count - 1, 0))
  }, [count])

  return <>
    {[...Array(count)].map((_, i) =>
      <Consumer key={i} />)}
    <div>
      <button onClick={increase}>
        +
      </button>
      <button onClick={decrease}>
        -
      </button>
    </div>
  </>
}