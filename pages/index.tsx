import Link from "next/link";

export default function Page() {
  return <div className="flex flex-col font-sans gap-4">
    <Link href="/theytube" shallow>
      Theytube: a complex store normalization example
    </Link>
    <Link href="/array" shallow>
      Normalized array: a simple store normalization example
    </Link>
    <Link href="/scroll" shallow>
      Normalized scroll pagination
    </Link>
    <Link href="/garbage" shallow>
      Garbage collection
    </Link>
    <Link href="/keys" shallow>
      Arbitrary keys
    </Link>
    <Link href="/optimistic" shallow>
      Optimistic updates
    </Link>
    <Link href="/storage" shallow>
      Encrypted persistent storage
    </Link>
    <Link href="/suspense" shallow>
      React Suspense
    </Link>
  </div>
}