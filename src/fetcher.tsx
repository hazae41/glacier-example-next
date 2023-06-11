import { Data, Fail } from "@hazae41/xswr"

export async function fetchAsJson<T>(url: string, init?: RequestInit) {
  const res = await fetch(url, init)

  const cooldown = Date.now() + (5 * 1000)
  const expiration = Date.now() + (10 * 1000)

  if (!res.ok)
    return new Fail(new Error(await res.text()), { cooldown, expiration })

  return new Data(await res.json() as T, { cooldown, expiration })
}