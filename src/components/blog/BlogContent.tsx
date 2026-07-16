import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

const VIDEO_EXTENSIONS = /\.(mp4|webm|mov|ogg)$/i

export function BlogContent({ markdown }: { markdown: string }) {
  return (
    <div className="prose prose-slate max-w-none dark:prose-invert prose-headings:text-club-primary dark:prose-headings:text-club-primary-light prose-a:text-club-primary dark:prose-a:text-club-primary-light">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          img: ({ src, alt }) => {
            if (typeof src === 'string' && VIDEO_EXTENSIONS.test(src)) {
              return <video src={src} controls className="w-full rounded-lg" />
            }
            return <img src={src} alt={alt} />
          },
        }}
      >
        {markdown}
      </ReactMarkdown>
    </div>
  )
}
