import { Option } from "@hazae41/option";
import { Data, NormalizerMore, State, Times, createQuerySchema, useFetch, useQuery } from "@hazae41/xswr";
import { useCallback } from "react";

export type Profile =
  | ProfileData
  | ProfileRef

export interface ProfileRef {
  ref: true
  id: string
}

export interface ProfileData {
  id: string
  nickname: string
}

export function getProfileSchema(id: string) {
  return createQuerySchema<string, ProfileData, never>({
    key: `/api/theytube/profile?id=${id}`
  })
}

export async function getProfileRef(profile: Profile, times: Times, more: NormalizerMore) {
  if ("ref" in profile) return profile
  const schema = getProfileSchema(profile.id)
  await schema?.normalize(new Data(profile, times), more)
  return { ref: true, id: profile.id } as ProfileRef
}

export function useProfile(id: string) {
  const handle = useQuery(getProfileSchema, [id])
  useFetch(handle)
  return handle
}

function pipeData<D, F>(piper: (data: D) => D) {
  return (state: State<D, F>) => Option.wrap(state.data).mapSync(data => data.mapSync(piper))
}

export function Profile(props: { id: string }) {
  const profile = useProfile(props.id)

  const onRenameClick = useCallback(() => {
    if (!profile.data) return

    profile.mutate(pipeData(d => ({ ...d, nickname: "John Doe" })))

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile.data, profile.mutate])

  if (profile.data === undefined)
    return null

  return <div className="text-gray-500">
    {profile.data.inner.nickname}
    <button onClick={onRenameClick}>
      Rename
    </button>
  </div>
}

export default function Page() {
  return null
}