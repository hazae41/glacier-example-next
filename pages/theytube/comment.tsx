import { Option } from "@hazae41/option";
import { NormalizerMore, State, createQuerySchema, useFetch, useQuery, useXSWR } from "@hazae41/xswr";
import { useCallback } from "react";
import { Profile, ProfileData, ProfileRef, getProfileRef, getProfileSchema } from "./profile";

export interface CommentRef {
  ref: true
  id: string
}

export type CommentData =
  | NormalizedCommentData
  | NonNormalizedCommentData

export interface NonNormalizedCommentData {
  id: string,
  author: ProfileData,
  text: string
}

export interface NormalizedCommentData {
  id: string,
  author: ProfileRef,
  text: string
}

export function getCommentSchema(id: string) {
  async function normalizer(comment: CommentData, more: NormalizerMore) {
    const author = await getProfileRef(comment.author, more)
    return { ...comment, author }
  }

  return createQuerySchema<string, CommentData, never>(`/api/theytube/comment?id=${id}`, undefined, { normalizer })
}

export async function getCommentRef(comment: CommentData | CommentRef, more: NormalizerMore) {
  if ("ref" in comment) return comment
  const schema = getCommentSchema(comment.id)
  await schema?.normalize(comment, more)
  return { ref: true, id: comment.id } as CommentRef
}

export function useComment(id: string) {
  const handle = useQuery(getCommentSchema, [id])
  useFetch(handle)
  return handle
}

function pipeData<D, F>(piper: (data: D) => D) {
  return (state: State<D, F>) => Option.wrap(state.data).mapSync(data => data.mapSync(piper))
}

export function Comment(props: { id: string }) {
  const { make } = useXSWR()
  const comment = useComment(props.id)

  const onChangeAuthorClick = useCallback(async () => {
    if (!comment.data)
      return

    const sJohn69 = getProfileSchema("1518516160")

    if (!sJohn69)
      return

    const John69 = await make(sJohn69)

    const author = John69.state.data?.inner

    if (!author)
      return

    comment.mutate(pipeData(d => ({ ...d, author })))

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [comment.data, comment.mutate])

  if (comment.data === undefined)
    return null

  return <div className="p-4 border border-solid border-gray-500">
    <Profile id={comment.data.inner.author.id} />
    <pre className="whitespace-pre-wrap">
      {comment.data.inner.text}
    </pre>
    <button onClick={onChangeAuthorClick}>
      Change author
    </button>
  </div>
}

export default function Page() {
  return null
}