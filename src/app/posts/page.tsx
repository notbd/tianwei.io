import { allPosts } from 'content-collections'

export default function Posts() {
  return (
    <ul
      className="flex flex-col gap-y-6"
    >
      {allPosts.map(post => (
        <li
          key={post._meta.path}
        >
          <a href={`/posts/${post._meta.path}`}>
            <h3>{post.title}</h3>
            <p>{post.summary}</p>
          </a>
        </li>
      ))}
    </ul>
  )
}
