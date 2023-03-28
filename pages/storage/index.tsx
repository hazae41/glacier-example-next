import { AsyncLocalStorage, getSchema, useAsyncLocalStorage, useDebug, useSchema } from "@hazae41/xswr";
import { gunzipSync, gzipSync } from "zlib";
import { fetchAsJson } from "../../src/fetcher";

export namespace GZIP {

  export function stringify(value?: any) {
    const text = JSON.stringify(value)
    const buffer = Buffer.from(text)
    const zbuffer = gzipSync(buffer)
    const ztext = zbuffer.toString("base64")

    return ztext
  }

  export function parse(ztext: string) {
    const zbuffer = Buffer.from(ztext, "base64")
    const buffer = gunzipSync(zbuffer)
    const text = buffer.toString()
    const value = JSON.parse(text)

    return value
  }

}

/**
 * Fetcher that accepts an object key
 * @param key 
 * @param init 
 * @returns 
 */
async function fetchAsJsonWithObjectKey<T>(key: { url: string }, init?: RequestInit) {
  return await fetchAsJson<T>(key.url, init)
}

function getHelloSchema(storage?: AsyncLocalStorage) {
  if (!storage) return

  return getSchema({ url: "/api/hello?stored" }, fetchAsJsonWithObjectKey<unknown>, {
    keySerializer: GZIP, // Will transform { url: string } into string (default is JSON)
    storage: { storage, serializer: GZIP }
  })
}

function useStoredHello() {
  const storage = useAsyncLocalStorage("cache:")
  const handle = useSchema(getHelloSchema, [storage])
  useDebug(handle, "hello")
  return handle
}

export default function Page() {
  const { data, fetch, clear } = useStoredHello()

  return <>
    <div>
      {JSON.stringify(data) ?? "undefined"}
    </div>
    <button onClick={() => fetch()}>
      Fetch
    </button>
    <button onClick={() => clear()}>
      Delete
    </button>
  </>
}
