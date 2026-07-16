import DOMPurify from 'dompurify'
import jsPDF from 'jspdf'
import type { BlogPostOut } from '../api/types'

const ALLOWED_TAGS = [
  'p', 'br', 'h1', 'h2', 'h3', 'h4', 'strong', 'em', 'u', 's',
  'ul', 'ol', 'li', 'blockquote', 'a', 'figure', 'figcaption', 'img', 'video',
]
const ALLOWED_ATTR = ['href', 'title', 'src', 'alt', 'class', 'width', 'controls', 'rel', 'target', 'style']

const MARGIN = 48
const CLUB_RED: [number, number, number] = [216, 31, 42]
const TEXT: [number, number, number] = [15, 23, 42] // slate-900
const GRAY: [number, number, number] = [71, 85, 105] // slate-600
const LIGHT: [number, number, number] = [148, 163, 184] // slate-400

const BODY_SIZE = 11
const BODY_LINE = 16

type Run = {
  text: string
  bold: boolean
  italic: boolean
  underline: boolean
  strike: boolean
  href: string | null
}

type LoadedImage = { dataUrl: string; width: number; height: number; format: 'PNG' | 'JPEG' }

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}

/** Charge une image et la convertit en dataURL PNG/JPEG (les seuls formats
 * que jsPDF décode de façon fiable). Renvoie null en cas d'échec. */
async function loadImage(url: string): Promise<LoadedImage | null> {
  try {
    const res = await fetch(url)
    if (!res.ok) return null
    const blob = await res.blob()
    const bitmap = await createImageBitmap(blob)
    try {
      if (blob.type === 'image/jpeg' || blob.type === 'image/png') {
        return {
          dataUrl: await blobToDataUrl(blob),
          width: bitmap.width,
          height: bitmap.height,
          format: blob.type === 'image/png' ? 'PNG' : 'JPEG',
        }
      }
      // webp, gif… : ré-encodage via canvas
      const canvas = document.createElement('canvas')
      canvas.width = bitmap.width
      canvas.height = bitmap.height
      const ctx = canvas.getContext('2d')
      if (!ctx) return null
      ctx.drawImage(bitmap, 0, 0)
      return {
        dataUrl: canvas.toDataURL('image/jpeg', 0.9),
        width: bitmap.width,
        height: bitmap.height,
        format: 'JPEG',
      }
    } finally {
      bitmap.close()
    }
  } catch {
    return null
  }
}

/** Aplati un sous-arbre HTML en « runs » de texte stylé (gras, italique…). */
function collectRuns(node: Node, style: Omit<Run, 'text'>, out: Run[]): void {
  if (node.nodeType === Node.TEXT_NODE) {
    const text = node.textContent ?? ''
    if (text) out.push({ ...style, text })
    return
  }
  if (node.nodeType !== Node.ELEMENT_NODE) return
  const el = node as Element
  const tag = el.tagName.toLowerCase()
  const next = { ...style }
  if (tag === 'strong' || tag === 'b') next.bold = true
  if (tag === 'em' || tag === 'i') next.italic = true
  if (tag === 'u') next.underline = true
  if (tag === 's' || tag === 'del' || tag === 'strike') next.strike = true
  if (tag === 'a') next.href = el.getAttribute('href')
  if (tag === 'br') {
    out.push({ ...style, text: '\n' })
    return
  }
  el.childNodes.forEach((child) => collectRuns(child, next, out))
}

/** Largeur d'affichage d'une figure : style inline `width: NN%` ou classe
 * fig-w-NN, sinon pleine largeur. */
function figureWidthPct(figure: Element): number {
  const style = figure.getAttribute('style') ?? ''
  const styleMatch = /width:\s*([\d.]+)%/.exec(style)
  if (styleMatch) return Math.min(100, Number(styleMatch[1]))
  const classMatch = /fig-w-(\d+)/.exec(figure.getAttribute('class') ?? '')
  if (classMatch) return Math.min(100, Number(classMatch[1]))
  return 100
}

class PdfWriter {
  doc: jsPDF
  y = MARGIN
  pageWidth: number
  pageHeight: number
  contentWidth: number

  constructor() {
    this.doc = new jsPDF({ unit: 'pt', format: 'a4' })
    this.pageWidth = this.doc.internal.pageSize.getWidth()
    this.pageHeight = this.doc.internal.pageSize.getHeight()
    this.contentWidth = this.pageWidth - 2 * MARGIN
  }

  ensureSpace(height: number): void {
    if (this.y + height > this.pageHeight - MARGIN) {
      this.doc.addPage()
      this.y = MARGIN
    }
  }

  private setRunFont(run: Run, fontSize: number): void {
    const styleName =
      run.bold && run.italic ? 'bolditalic' : run.bold ? 'bold' : run.italic ? 'italic' : 'normal'
    this.doc.setFont('helvetica', styleName)
    this.doc.setFontSize(fontSize)
  }

  /** Rend des runs avec retour à la ligne mot à mot (gère styles mixtes). */
  renderRuns(
    runs: Run[],
    opts: {
      x: number
      width: number
      fontSize?: number
      lineHeight?: number
      color?: [number, number, number]
      spacingAfter?: number
    },
  ): void {
    const fontSize = opts.fontSize ?? BODY_SIZE
    const lineHeight = opts.lineHeight ?? BODY_LINE
    const color = opts.color ?? TEXT

    type Word = { text: string; run: Run }
    const words: Word[] = []
    for (const run of runs) {
      for (const part of run.text.split(/(\n)/)) {
        if (part === '\n') words.push({ text: '\n', run })
        else for (const w of part.split(/\s+/).filter(Boolean)) words.push({ text: w, run })
      }
    }
    if (words.length === 0) return

    let line: Word[] = []
    let lineWidth = 0

    const measure = (word: Word): number => {
      this.setRunFont(word.run, fontSize)
      return this.doc.getTextWidth(word.text)
    }

    const flush = () => {
      if (line.length === 0) return
      this.ensureSpace(lineHeight)
      const baseline = this.y + fontSize * 0.85
      let x = opts.x
      for (const word of line) {
        this.setRunFont(word.run, fontSize)
        const w = this.doc.getTextWidth(word.text)
        if (word.run.href) {
          this.doc.setTextColor(...CLUB_RED)
          this.doc.textWithLink(word.text, x, baseline, { url: word.run.href })
        } else {
          this.doc.setTextColor(...color)
          this.doc.text(word.text, x, baseline)
        }
        if (word.run.underline || word.run.href) {
          this.doc.setDrawColor(...(word.run.href ? CLUB_RED : color))
          this.doc.setLineWidth(0.5)
          this.doc.line(x, baseline + 1.5, x + w, baseline + 1.5)
        }
        if (word.run.strike) {
          this.doc.setDrawColor(...color)
          this.doc.setLineWidth(0.5)
          this.doc.line(x, baseline - fontSize * 0.3, x + w, baseline - fontSize * 0.3)
        }
        x += w + this.doc.getTextWidth(' ')
      }
      this.y += lineHeight
      line = []
      lineWidth = 0
    }

    for (const word of words) {
      if (word.text === '\n') {
        flush()
        continue
      }
      let text = word.text
      // Mot plus large que la colonne : découpage caractère par caractère.
      while (measure({ ...word, text }) > opts.width && text.length > 1) {
        let cut = text.length - 1
        while (cut > 1 && measure({ ...word, text: text.slice(0, cut) }) > opts.width) cut--
        flush()
        line = [{ run: word.run, text: text.slice(0, cut) }]
        flush()
        text = text.slice(cut)
      }
      const wordWidth = measure({ ...word, text })
      const spaceWidth = line.length > 0 ? this.doc.getTextWidth(' ') : 0
      if (line.length > 0 && lineWidth + spaceWidth + wordWidth > opts.width) flush()
      line.push({ run: word.run, text })
      lineWidth += (line.length > 1 ? spaceWidth : 0) + wordWidth
    }
    flush()
    this.y += opts.spacingAfter ?? 0
  }

  renderImage(img: LoadedImage, maxWidth: number, caption?: string | null): void {
    let drawW = Math.min(maxWidth, this.contentWidth)
    let drawH = (img.height * drawW) / img.width
    const maxHeight = this.pageHeight - 2 * MARGIN - (caption ? 24 : 0)
    if (drawH > maxHeight) {
      drawH = maxHeight
      drawW = (img.width * drawH) / img.height
    }
    this.ensureSpace(drawH + (caption ? 20 : 0))
    const x = MARGIN + (this.contentWidth - drawW) / 2
    this.doc.addImage(img.dataUrl, img.format, x, this.y, drawW, drawH)
    this.y += drawH
    if (caption) {
      this.y += 6
      this.doc.setFont('helvetica', 'normal')
      this.doc.setFontSize(9)
      this.doc.setTextColor(...GRAY)
      const lines = this.doc.splitTextToSize(caption, this.contentWidth) as string[]
      for (const lineText of lines) {
        this.ensureSpace(12)
        this.doc.text(lineText, this.pageWidth / 2, this.y + 8, { align: 'center' })
        this.y += 12
      }
    }
    this.y += 12
  }

  renderPlaceholder(label: string): void {
    this.ensureSpace(BODY_LINE)
    this.doc.setFont('helvetica', 'italic')
    this.doc.setFontSize(BODY_SIZE)
    this.doc.setTextColor(...LIGHT)
    this.doc.text(label, MARGIN, this.y + BODY_SIZE * 0.85)
    this.y += BODY_LINE + 8
  }
}

const HEADING_SIZES: Record<string, number> = { h1: 18, h2: 15, h3: 13, h4: 12 }

async function renderBlock(w: PdfWriter, el: Element, indent = 0): Promise<void> {
  const tag = el.tagName.toLowerCase()
  const x = MARGIN + indent
  const width = w.contentWidth - indent

  if (tag in HEADING_SIZES) {
    const size = HEADING_SIZES[tag]
    const runs: Run[] = []
    collectRuns(el, { bold: true, italic: false, underline: false, strike: false, href: null }, runs)
    w.y += 10
    // Anti-titre orphelin : le titre et au moins une ligne de texte ensemble.
    w.ensureSpace(size * 1.4 + BODY_LINE)
    w.renderRuns(runs, { x, width, fontSize: size, lineHeight: size * 1.4, color: CLUB_RED, spacingAfter: 4 })
    return
  }

  if (tag === 'p') {
    const runs: Run[] = []
    collectRuns(el, { bold: false, italic: false, underline: false, strike: false, href: null }, runs)
    w.renderRuns(runs, { x, width, spacingAfter: 8 })
    return
  }

  if (tag === 'ul' || tag === 'ol') {
    let index = 1
    for (const li of Array.from(el.children).filter((c) => c.tagName.toLowerCase() === 'li')) {
      const prefix = tag === 'ol' ? `${index}.` : '•'
      index++
      w.ensureSpace(BODY_LINE)
      w.doc.setFont('helvetica', 'normal')
      w.doc.setFontSize(BODY_SIZE)
      w.doc.setTextColor(...TEXT)
      w.doc.text(prefix, x, w.y + BODY_SIZE * 0.85)
      const itemIndent = indent + 16
      // Contenu du <li> : texte inline + éventuels blocs imbriqués (listes…)
      const inline: Run[] = []
      const blocks: Element[] = []
      li.childNodes.forEach((child) => {
        const childTag = child.nodeType === Node.ELEMENT_NODE ? (child as Element).tagName.toLowerCase() : null
        if (childTag && ['ul', 'ol', 'p', 'blockquote', 'figure'].includes(childTag)) {
          blocks.push(child as Element)
        } else {
          collectRuns(child, { bold: false, italic: false, underline: false, strike: false, href: null }, inline)
        }
      })
      w.renderRuns(inline, { x: MARGIN + itemIndent, width: w.contentWidth - itemIndent, spacingAfter: 3 })
      for (const block of blocks) await renderBlock(w, block, itemIndent)
    }
    w.y += 6
    return
  }

  if (tag === 'blockquote') {
    const startY = w.y
    const startPage = w.doc.getCurrentPageInfo().pageNumber
    const quoteIndent = indent + 14
    const children = Array.from(el.children)
    if (children.length === 0) {
      const runs: Run[] = []
      collectRuns(el, { bold: false, italic: true, underline: false, strike: false, href: null }, runs)
      w.renderRuns(runs, { x: MARGIN + quoteIndent, width: w.contentWidth - quoteIndent, color: GRAY, spacingAfter: 4 })
    } else {
      for (const child of children) await renderBlock(w, child, quoteIndent)
    }
    // Filet vertical (sur la page courante uniquement en cas de saut de page).
    const ruleTop = w.doc.getCurrentPageInfo().pageNumber === startPage ? startY : MARGIN
    w.doc.setDrawColor(...LIGHT)
    w.doc.setLineWidth(2)
    w.doc.line(x + 4, ruleTop + 2, x + 4, w.y - 6)
    w.y += 6
    return
  }

  if (tag === 'figure') {
    const img = el.querySelector('img')
    const video = el.querySelector('video')
    const caption = el.querySelector('figcaption')?.textContent?.trim() || null
    if (img?.getAttribute('src')) {
      const loaded = await loadImage(img.getAttribute('src') as string)
      if (loaded) {
        const pct = figureWidthPct(el)
        w.renderImage(loaded, (w.contentWidth * pct) / 100, caption)
      } else {
        w.renderPlaceholder('[Image non disponible]')
      }
    } else if (video?.getAttribute('src')) {
      const src = video.getAttribute('src') as string
      w.renderRuns(
        [{ text: `Vidéo : ${src}`, bold: false, italic: true, underline: false, strike: false, href: src }],
        { x, width, color: GRAY, spacingAfter: 8 },
      )
      if (caption) {
        w.renderRuns([{ text: caption, bold: false, italic: true, underline: false, strike: false, href: null }], {
          x, width, fontSize: 9, lineHeight: 12, color: GRAY, spacingAfter: 8,
        })
      }
    }
    return
  }

  // Bloc inconnu : rendu du texte brut s'il y en a.
  const fallback: Run[] = []
  collectRuns(el, { bold: false, italic: false, underline: false, strike: false, href: null }, fallback)
  if (fallback.some((r) => r.text.trim())) {
    w.renderRuns(fallback, { x, width, spacingAfter: 8 })
  }
}

/** Exporte un article en vrai PDF texte (sélectionnable), avec couverture,
 * titre, résumé et contenu mis en forme. */
export async function exportBlogPdf(post: BlogPostOut): Promise<void> {
  const clean = DOMPurify.sanitize(post.content_html, {
    ALLOWED_TAGS,
    ALLOWED_ATTR,
    ADD_ATTR: ['controls'],
  })
  const body = new DOMParser().parseFromString(clean, 'text/html').body

  const w = new PdfWriter()

  // Image de couverture
  if (post.cover_image_url) {
    const cover = await loadImage(post.cover_image_url)
    if (cover) {
      let drawW = w.contentWidth
      let drawH = (cover.height * drawW) / cover.width
      const maxCoverH = w.pageHeight * 0.4
      if (drawH > maxCoverH) {
        drawH = maxCoverH
        drawW = (cover.width * drawH) / cover.height
      }
      const x = MARGIN + (w.contentWidth - drawW) / 2
      w.doc.addImage(cover.dataUrl, cover.format, x, w.y, drawW, drawH)
      w.y += drawH + 20
    }
  }

  // Titre
  w.doc.setFont('helvetica', 'bold')
  w.doc.setFontSize(22)
  w.doc.setTextColor(...CLUB_RED)
  const titleLines = w.doc.splitTextToSize(post.title, w.contentWidth) as string[]
  for (const lineText of titleLines) {
    w.ensureSpace(28)
    w.doc.text(lineText, MARGIN, w.y + 19)
    w.y += 28
  }
  w.y += 6

  // Résumé
  if (post.summary) {
    const summaryX = MARGIN + 12
    const startY = w.y
    const startPage = w.doc.getCurrentPageInfo().pageNumber
    w.renderRuns(
      [{ text: post.summary, bold: false, italic: true, underline: false, strike: false, href: null }],
      { x: summaryX, width: w.contentWidth - 12, fontSize: 11, lineHeight: 15, color: GRAY, spacingAfter: 0 },
    )
    const ruleTop = w.doc.getCurrentPageInfo().pageNumber === startPage ? startY : MARGIN
    w.doc.setDrawColor(...CLUB_RED)
    w.doc.setLineWidth(2)
    w.doc.line(MARGIN + 3, ruleTop + 2, MARGIN + 3, w.y - 3)
    w.y += 16
  }

  // Contenu
  for (const el of Array.from(body.children)) {
    await renderBlock(w, el)
  }

  w.doc.save(`${post.slug}.pdf`)
}
