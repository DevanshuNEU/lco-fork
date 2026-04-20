import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'

export interface ChangelogEntry {
  slug: string
  date: string
  title: string
  tag: string
  content: string
}

const CHANGELOG_DIR = path.join(process.cwd(), 'content', 'changelog')

export function getChangelogEntries(): ChangelogEntry[] {
  if (!fs.existsSync(CHANGELOG_DIR)) return []

  const files = fs
    .readdirSync(CHANGELOG_DIR)
    .filter((f) => f.endsWith('.md'))
    .sort()
    .reverse()

  return files.map((filename) => {
    const slug = filename.replace(/\.md$/, '')
    const raw = fs.readFileSync(path.join(CHANGELOG_DIR, filename), 'utf-8')
    const { data, content } = matter(raw)

    return {
      slug,
      date: String(data.date ?? slug.slice(0, 10)),
      title: String(data.title ?? 'Untitled'),
      tag: String(data.tag ?? 'update'),
      content: content.trim(),
    }
  })
}
