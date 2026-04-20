'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { AnimatePresence, motion } from 'framer-motion'
import { Home, BookOpen, Chrome, FolderOpen } from 'lucide-react'

const routes = [
  { label: 'Home', path: '/', icon: Home, hint: 'Landing page' },
  { label: 'Why Saar', path: '/why', icon: BookOpen, hint: 'The thesis' },
  { label: 'Install', path: '/install', icon: Chrome, hint: 'Get the extension' },
  { label: 'Changelog', path: '/changelog', icon: FolderOpen, hint: 'What shipped' },
]

export default function CmdPalette() {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const router = useRouter()

  const close = useCallback(() => {
    setOpen(false)
    setQuery('')
  }, [])

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setOpen((prev) => !prev)
      }
      if (e.key === 'Escape') close()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [close])

  const filtered = routes.filter(
    (r) =>
      query === '' ||
      r.label.toLowerCase().includes(query.toLowerCase()) ||
      r.hint.toLowerCase().includes(query.toLowerCase()),
  )

  const navigate = (path: string) => {
    router.push(path)
    close()
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-50 bg-black/50"
            onClick={close}
          />
          <motion.div
            key="palette"
            initial={{ opacity: 0, scale: 0.97, y: -8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: -8 }}
            transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
            className="fixed top-[20%] left-1/2 -translate-x-1/2 z-50 w-full max-w-md"
          >
            <div className="mx-4 rounded-xl border border-saar-border bg-saar-card shadow-2xl overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-3 border-b border-saar-border">
                <span className="text-saar-muted text-xs font-mono">cmd+k</span>
                <input
                  autoFocus
                  type="text"
                  placeholder="Go to..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="flex-1 bg-transparent text-saar-text text-sm outline-none placeholder:text-saar-muted"
                />
              </div>
              <ul className="py-2">
                {filtered.map((route) => {
                  const Icon = route.icon
                  return (
                    <li key={route.path}>
                      <button
                        onClick={() => navigate(route.path)}
                        className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-saar-hover transition-colors text-left"
                      >
                        <Icon
                          width={16}
                          height={16}
                          className="text-saar-accent flex-shrink-0"
                        />
                        <span className="text-sm text-saar-text">{route.label}</span>
                        <span className="ml-auto text-xs text-saar-muted">{route.hint}</span>
                      </button>
                    </li>
                  )
                })}
              </ul>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
