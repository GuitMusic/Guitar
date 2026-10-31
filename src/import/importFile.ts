import { asciiTabToTex } from './asciiTab'
import type { SongRecord } from '../library/db'
import { newId } from '../library/db'

const BINARY_EXTENSIONS = ['gp', 'gp3', 'gp4', 'gp5', 'gpx', 'xml', 'musicxml', 'mxl', 'cap', 'capx']
const TEXT_EXTENSIONS = ['txt', 'tab', 'text']

export const ACCEPTED_FILES = [...BINARY_EXTENSIONS, ...TEXT_EXTENSIONS].map((e) => `.${e}`).join(',')

function baseName(fileName: string): string {
  return fileName.replace(/\.[^.]+$/, '').replace(/[_]+/g, ' ').trim()
}

/** Turns a file the user picked into a song record. Text files are treated as ASCII tab. */
export async function songFromFile(file: File): Promise<SongRecord> {
  const ext = file.name.split('.').pop()?.toLowerCase() ?? ''
  const title = baseName(file.name)
  if (TEXT_EXTENSIONS.includes(ext)) {
    return songFromAsciiTab(await file.text(), title)
  }
  if (!BINARY_EXTENSIONS.includes(ext)) {
    throw new Error(`"${file.name}" is not a supported file. Use Guitar Pro, MusicXML or a text tab.`)
  }
  return {
    id: newId(),
    title,
    format: 'binary',
    data: await file.arrayBuffer(),
    fileName: file.name,
    addedAt: Date.now(),
  }
}

export function songFromAsciiTab(text: string, title: string, capo?: number, tempo?: number): SongRecord {
  const result = asciiTabToTex(text, { title, capo, tempo })
  return {
    id: newId(),
    title: title.trim() || 'Imported tab',
    format: 'tex',
    data: result.tex,
    addedAt: Date.now(),
  }
}
