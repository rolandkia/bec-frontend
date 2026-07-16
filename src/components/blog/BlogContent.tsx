import DOMPurify from 'dompurify'

const ALLOWED_TAGS = [
  'p', 'br', 'h1', 'h2', 'h3', 'h4', 'strong', 'em', 'u', 's',
  'ul', 'ol', 'li', 'blockquote', 'a', 'figure', 'figcaption', 'img', 'video',
]
const ALLOWED_ATTR = ['href', 'title', 'src', 'alt', 'class', 'width', 'controls', 'rel', 'target', 'style']

export function BlogContent({ html }: { html: string }) {
  const clean = DOMPurify.sanitize(html, {
    ALLOWED_TAGS,
    ALLOWED_ATTR,
    ADD_ATTR: ['controls'],
  })

  return (
    <div className="prose prose-slate max-w-none dark:prose-invert prose-headings:text-club-primary dark:prose-headings:text-club-primary-light prose-a:text-club-primary dark:prose-a:text-club-primary-light">
      <div className="blog-rendered" dangerouslySetInnerHTML={{ __html: clean }} />
    </div>
  )
}
