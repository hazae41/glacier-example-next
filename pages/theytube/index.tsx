import { NormalizerMore, createQuerySchema, useFetch, useQuery } from "@hazae41/xswr";
import { useCallback } from "react";
import { fetchAsJson } from "../../src/fetcher";
import { Video, VideoData, VideoRef, getVideoRef } from "./video";

function getAllVideosSchema() {
  async function normalizer(videos: (VideoData | VideoRef)[], more: NormalizerMore) {
    return await Promise.all(videos.map(data => getVideoRef(data, more)))
  }

  return createQuerySchema<(VideoData | VideoRef)[]>(`/api/theytube`, fetchAsJson<VideoData[]>, { normalizer })
}

function useAllVideos() {
  const handle = useQuery(getAllVideosSchema, [])
  useFetch(handle)
  return handle
}

export default function Page() {
  const videos = useAllVideos()

  const onRefetchClick = useCallback(() => {
    videos.refetch()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [videos.refetch])

  if (videos.data.isNone())
    return <>Loading...</>

  return <div className="w-full max-w-xl">
    <button onClick={onRefetchClick}>
      Refetch
    </button>
    <div className="flex flex-col gap-4">
      {videos.data.inner.map(ref =>
        <Video
          key={ref.id}
          id={ref.id} />)}
    </div>
  </div>
}
