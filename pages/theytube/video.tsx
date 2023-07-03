import { Optional } from "@hazae41/option";
import { Data, Fetched, NormalizerMore, Times, createQuerySchema, useFetch, useQuery } from "@hazae41/xswr";
import { Comment, CommentRef, NonNormalizedCommentData, getCommentRef } from "./comment";
import { Profile, ProfileData, ProfileRef, getProfileRef } from "./profile";

export type Video =
  | VideoData
  | VideoRef

export interface VideoRef {
  ref: true
  id: string
}

export type VideoData =
  | NormalizedVideoData
  | NonNormalizedVideoData

export interface NonNormalizedVideoData {
  id: string
  title: string
  author: ProfileData
  comments: NonNormalizedCommentData[]
}

export interface NormalizedVideoData {
  id: string
  title: string
  author: ProfileRef
  comments: CommentRef[]
}

export function getVideoSchema(id: string) {
  const normalizer = async (fetched: Optional<Fetched<VideoData, never>>, more: NormalizerMore) =>
    fetched?.map(async video => {
      const author = await getProfileRef(video.author, fetched, more)
      const comments = await Promise.all(video.comments.map(data => getCommentRef(data, fetched, more)))
      return { ...video, author, comments }
    })

  return createQuerySchema<string, VideoData, never>({
    key: `/api/theytube/video?id=${id}`,
    normalizer
  })
}

export async function getVideoRef(video: Video, times: Times, more: NormalizerMore) {
  if ("ref" in video) return video
  const schema = getVideoSchema(video.id)
  await schema?.normalize(new Data(video, times), more)
  return { ref: true, id: video.id } as VideoRef
}

export function useVideo(id: string) {
  const handle = useQuery(getVideoSchema, [id])
  useFetch(handle)
  return handle
}

export function Video(props: { id: string }) {
  const video = useVideo(props.id)

  if (video.data === undefined)
    return null

  return <div className="p-4 border border-solid border-gray-500">
    <div className="flex justify-center items-center w-full aspect-video border border-solid border-gray-500">
      Some video
    </div>
    <div className="py-4">
      <h1 className="text-xl">
        {video.data.inner.title}
      </h1>
      <Profile id={video.data.inner.author.id} />
    </div>
    {video.data.inner.comments.map(ref =>
      <Comment
        key={ref.id}
        id={ref.id} />)}
  </div>
}

export default function Page() {
  return null
}