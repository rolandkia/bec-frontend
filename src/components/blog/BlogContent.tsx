import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

export function BlogContent({ markdown }: { markdown: string }) {
  return (
    <div className="prose prose-slate max-w-none dark:prose-invert prose-headings:text-club-primary dark:prose-headings:text-club-primary-light prose-a:text-club-primary dark:prose-a:text-club-primary-light">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{markdown}</ReactMarkdown>
    </div>
  )
}
