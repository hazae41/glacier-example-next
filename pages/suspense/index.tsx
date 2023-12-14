import { createQuery, useFetch, useQuery } from "@hazae41/glacier"
import { Suspense, useEffect, useState } from "react"
import { fetchAsJson } from "../../src/fetcher"

function getHelloSchema() {
  return createQuery({
    key: "/api/hello",
    fetcher: fetchAsJson<unknown>
  })
}

function useHelloData() {
  const query = useQuery(getHelloSchema, [])
  useFetch(query)
  return query
}

function Child() {
  const hello = useHelloData()

  // Suspend until next state change
  if (!hello.data) throw hello.suspend()

  return <div>
    Child: {JSON.stringify(hello.data)}
  </div>
}

function Parent() {
  const hello = useHelloData()

  console.log(hello)

  if (hello.error)
    throw hello.error.inner

  // Suspend until next state change
  if (!hello.data)
    throw hello.suspend()

  return <div>
    Parent: {JSON.stringify(hello.data)}
    <Suspense fallback={<div>Child loading...</div>}>
      <Child />
    </Suspense>
  </div>
}

export default function Page() {
  const [client, setClient] = useState(false)
  useEffect(() => setClient(true), [])
  if (!client) return <>SSR</>

  return <div>
    <Suspense fallback={<div>Loading...</div>}>
      <Parent />
    </Suspense>
    <Suspense fallback={<div>Loading...</div>}>
      <Parent />
    </Suspense>
  </div>
}