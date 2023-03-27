import { AsyncLocalStorage, getSchema, useAsyncLocalStorage, useDebug, useSchema } from "@hazae41/xswr";
import { gunzipSync, gzipSync } from "zlib";
import { fetchAsJson } from "../../src/fetcher";

export namespace GZIP {

  export function stringify(value?: any) {
    return serialize(value)
  }

  export function serialize(value?: any) {
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

function getHelloSchema(storage?: AsyncLocalStorage) {
  if (!storage) return

  return getSchema("/api/hello?stored", fetchAsJson<unknown>, {
    keySerializer: GZIP,
    storage: { storage, serializer: GZIP }
  })
}

function useStoredHello() {
  const storage = useAsyncLocalStorage("cache")
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
