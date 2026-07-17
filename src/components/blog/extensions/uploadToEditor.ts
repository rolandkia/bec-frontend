import { isAxiosError } from 'axios'
import type { Node as PMNode } from '@tiptap/pm/model'
import type { EditorView } from '@tiptap/pm/view'
import { uploadMedia } from '../../../api/media'
import { isMediaNode, MEDIA_GRID_NAME } from './MediaGrid'
import { findPlaceholder, uploadPlaceholderKey } from './mediaUploadPlaceholder'

export interface UploadCallbacks {
  onStart?: () => void
  onError?: (message: string) => void
  onSettled?: () => void
}

export function isSupportedMediaFile(file: File): boolean {
  return file.type.startsWith('image/') || file.type.startsWith('video/')
}

/** Ramène une position quelconque à la frontière de bloc top-level la plus
 *  naturelle : début du bloc si on pointe son début, sinon juste après lui
 *  (un média est un bloc, il ne peut pas vivre au milieu d'un paragraphe). */
function clampToBlockGap(doc: PMNode, pos: number): number {
  const $pos = doc.resolve(Math.max(0, Math.min(pos, doc.content.size)))
  if ($pos.depth === 0) return $pos.pos
  return $pos.parentOffset === 0 ? $pos.before(1) : $pos.after(1)
}

/** En fin de document, TipTap (trailing node) ajoute un ¶ vide après chaque
 *  média inséré ; le placeholder suivant est mappé APRÈS ce ¶ et un envoi
 *  groupé s'entrelacerait de paragraphes vides (img, ¶, img, ¶…). Si la
 *  position est la toute fin et qu'on est juste derrière ce ¶ vide, on
 *  revient devant lui pour que les médias restent contigus. */
function skipTrailingGap(doc: PMNode, pos: number): number {
  if (pos !== doc.content.size) return pos
  const trailing = doc.resolve(pos).nodeBefore
  if (!trailing || trailing.type.name !== 'paragraph' || trailing.content.size > 0) return pos
  const beforeTrailing = doc.resolve(pos - trailing.nodeSize).nodeBefore
  if (!beforeTrailing) return pos
  if (!isMediaNode(beforeTrailing) && beforeTrailing.type.name !== MEDIA_GRID_NAME) return pos
  return pos - trailing.nodeSize
}

let uploadSeq = 0

/** Envoie un fichier média (toolbar, drop OS ou collage) : pose un placeholder
 *  au point d'insertion — sa position suit les éditions pendant l'envoi — puis
 *  le remplace par la figure/vidéo Cloudinary. Si la zone a été supprimée
 *  entre-temps, le résultat est abandonné. */
export async function uploadFileAt(
  view: EditorView,
  file: File,
  pos: number,
  callbacks?: UploadCallbacks,
): Promise<void> {
  if (!isSupportedMediaFile(file)) return
  const id = `upload-${++uploadSeq}`
  const isImage = file.type.startsWith('image/')
  const previewUrl = isImage ? URL.createObjectURL(file) : null

  {
    const tr = view.state.tr
    tr.setMeta(uploadPlaceholderKey, {
      add: { id, pos: clampToBlockGap(view.state.doc, pos), previewUrl },
    })
    view.dispatch(tr)
  }
  callbacks?.onStart?.()

  try {
    const { url, resource_type } = await uploadMedia(file)
    const placeholderPos = findPlaceholder(view.state, id)
    if (placeholderPos == null) return // zone supprimée pendant l'envoi
    const schema = view.state.schema
    const node =
      resource_type === 'video'
        ? schema.nodes.video.create({ src: url })
        : schema.nodes.figureImage.create({ src: url, alt: file.name })
    const tr = view.state.tr
    tr.insert(skipTrailingGap(tr.doc, clampToBlockGap(tr.doc, placeholderPos)), node)
    tr.setMeta(uploadPlaceholderKey, { remove: { id } })
    view.dispatch(tr)
  } catch (err) {
    const tr = view.state.tr
    tr.setMeta(uploadPlaceholderKey, { remove: { id } })
    view.dispatch(tr)
    callbacks?.onError?.(
      isAxiosError(err) && err.response?.data?.detail
        ? String(err.response.data.detail)
        : "Échec de l'envoi du fichier.",
    )
  } finally {
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    callbacks?.onSettled?.()
  }
}
