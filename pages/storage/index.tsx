import { AesGcmCoder, AsyncJson, AsyncPipeBicoder, HmacEncoder, IDBStorage, RawState, Storage, createQuery, useDebug, useQuery } from "@hazae41/glacier";
import { DependencyList, useEffect, useState } from "react";
import { gunzipSync, gzipSync } from "zlib";
import { fetchAsJson } from "../../src/fetcher";

export namespace GZIP {

  export function encodeOrThrow(value?: any) {
    const text = JSON.stringify(value)
    const buffer = Buffer.from(text)
    const zbuffer = gzipSync(buffer)
    const ztext = zbuffer.toString("base64")

    return ztext
  }

  export function decodeOrThrow(ztext: string) {
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

  return createQuery({
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
    const pbkdf2 = await crypto.subtle.importKey("raw", new TextEncoder().encode("password"), { name: "PBKDF2" }, false, ["deriveBits", "deriveKey"])

    const keyParams = {
      derivedKeyType: {
        name: "HMAC",
        hash: "SHA-256"
      },
      algorithm: {
        name: "PBKDF2",
        hash: "SHA-256",
        iterations: 1_000_000,
        salt: Buffer.from("zCjjKo0sd0EF6w9C40ud7Q==", "base64")
      }
    }

    const valueParams = {
      derivedKeyType: {
        name: "AES-GCM",
        length: 256
      },
      algorithm: {
        name: "PBKDF2",
        hash: "SHA-256",
        iterations: 1_000_000,
        salt: Buffer.from("zCjjKo0sd0EF6w9C40ud7Q==", "base64")
      }
    }

    const keyKey = await crypto.subtle.deriveKey(keyParams.algorithm, pbkdf2, keyParams.derivedKeyType, false, ["sign"])
    const valueKey = await crypto.subtle.deriveKey(valueParams.algorithm, pbkdf2, valueParams.derivedKeyType, false, ["encrypt", "decrypt"])

    const hasher = new HmacEncoder(keyKey)
    const crypter = new AesGcmCoder(valueKey)

    const keySerializer = hasher
    const valueSerializer = new AsyncPipeBicoder<RawState, string, string>(AsyncJson, crypter)

    return IDBStorage.createOrThrow({ name: "cache", keySerializer, valueSerializer })
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
