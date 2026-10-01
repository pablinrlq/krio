import { createReadStream } from 'node:fs'
import { mkdir, stat, unlink, writeFile } from 'node:fs/promises'
import { extname, join, resolve } from 'node:path'
import { randomUUID } from 'node:crypto'
import { Readable } from 'node:stream'
import { env } from '../env'
import { db, schema } from '../db'

const pasta = resolve(env.pastaDados, 'uploads')

const TIPOS_OK = /^(image\/(jpeg|png|webp|gif|avif)|video\/(mp4|quicktime|webm)|application\/pdf|audio\/(mpeg|mp4|wav|webm))$/

export class ErroArquivo extends Error {}

export async function salvarArquivo(f: File, donoId: string, publico = false) {
  if (!TIPOS_OK.test(f.type)) throw new ErroArquivo('Tipo de arquivo não aceito. Envie imagem, vídeo, áudio ou PDF.')
  if (f.size > env.limiteUploadMb * 1024 * 1024) throw new ErroArquivo(`O arquivo passa de ${env.limiteUploadMb} MB.`)
  const sub = new Date().toISOString().slice(0, 7)
  await mkdir(join(pasta, sub), { recursive: true })
  const nomeDisco = `${randomUUID()}${extname(f.name).toLowerCase().slice(0, 8)}`
  const caminho = join(sub, nomeDisco)
  await writeFile(join(pasta, caminho), Buffer.from(await f.arrayBuffer()))
  const [a] = await db
    .insert(schema.arquivos)
    .values({ donoId, caminho, nome: f.name.slice(0, 200), tipo: f.type, tamanho: f.size, publico })
    .returning()
  return a
}

export async function abrirArquivo(caminho: string, faixa?: { inicio: number; fim: number }) {
  const completo = resolve(pasta, caminho)
  if (!completo.startsWith(pasta)) throw new ErroArquivo('Caminho inválido')
  const s = await stat(completo)
  const stream = createReadStream(completo, faixa ? { start: faixa.inicio, end: faixa.fim } : undefined)
  return { tamanho: s.size, corpo: Readable.toWeb(stream) as ReadableStream }
}

// Lê o cabeçalho Range (vídeo e áudio no Safari só tocam com ele).
export function lerFaixa(range: string | undefined, tamanho: number) {
  const m = range?.match(/^bytes=(\d*)-(\d*)$/)
  if (!m || (!m[1] && !m[2])) return null
  let inicio = m[1] ? Number(m[1]) : tamanho - Number(m[2])
  let fim = m[1] && m[2] ? Number(m[2]) : tamanho - 1
  inicio = Math.max(0, inicio)
  fim = Math.min(fim, tamanho - 1)
  if (inicio > fim) return null
  return { inicio, fim }
}

export async function apagarArquivo(caminho: string) {
  const completo = resolve(pasta, caminho)
  if (completo.startsWith(pasta)) await unlink(completo).catch(() => {})
}
