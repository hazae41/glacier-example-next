import { AesGcmCoder, AsyncPipeBicoder, HmacEncoder, IDBStorage, PBKDF2, Storage, createQuerySchema, useDebug, useQuery } from "@hazae41/xswr";
import { DependencyList, useEffect, useState } from "react";
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

function getHelloSchema(storage?: Storage) {
  if (!storage) return

  return createQuerySchema({
    key: { url: "/api/hello?stored" },
    fetcher: fetchAsJsonWithObjectKey<unknown>,
    keySerializer: GZIP,
    storage
  })
}

function useStoredHello(storage?: Storage) {
  const query = useQuery(getHelloSchema, [storage])
  useDebug(query, "hello")
  return query
}

function useAsyncMemo<T>(factory: () => Promise<T>, deps: DependencyList) {
  const [state, setState] = useState<T>()

  useEffect(() => {
    factory()
      .then(setState)
      .catch(e => setState(() => { throw e }))
  }, deps)

  return state
}

export default function Page() {

  const storage = useAsyncMemo(async () => {
    const pbkdf2 = await PBKDF2.from("password")

    const salt = Buffer.from("zCjjKo0sd0EF6w9C40ud7Q==", "base64")

    const keySerializer = await HmacEncoder.fromPBKDF2(pbkdf2, salt, 1_000_000)
    const innerSerializer = await AesGcmCoder.fromPBKDF2(pbkdf2, salt, 1_000_000)
    const valueSerializer = new AsyncPipeBicoder(JSON, innerSerializer)

    return IDBStorage.tryCreate({ name: "cache", keySerializer, valueSerializer }).unwrap()
  }, [])

  const query = useStoredHello(storage)
  const { cacheKey, data, fetch, clear } = query

  console.log("gzipped key", cacheKey)

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
