import { Optional } from "@hazae41/option";
import { Fetched, NormalizerMore, createQuerySchema, useFetch, useQuery } from "@hazae41/xswr";
import { useCallback } from "react";
import { fetchAsJson } from "../../src/fetcher";
import { Video, VideoData, getVideoRef } from "./video";

function getAllVideosSchema() {
  const normalizer = async (fetched: Optional<Fetched<Video[], Error>>, more: NormalizerMore) =>
    fetched?.map(async videos => await Promise.all(videos.map(data => getVideoRef(data, fetched, more))))

  return createQuerySchema<string, Video[], Error>({
    key: `/api/theytube`,
    fetcher: fetchAsJson<VideoData[]>,
    normalizer
  })
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

  if (videos.data === undefined)
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
