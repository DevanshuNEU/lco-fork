export default function Incentives() {
  return (
    <section className="py-24 border-t border-saar-border">
      <div className="max-w-6xl mx-auto px-6">
        <div className="max-w-xl mb-12">
          <p className="font-mono text-xs text-saar-muted uppercase tracking-widest mb-4">
            The real problem
          </p>
          <h2 className="font-serif text-4xl text-saar-text leading-tight">
            They win when you burn. We win when you don&apos;t.
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-3xl">
          {/* Anthropic card */}
          <div className="rounded-xl border border-saar-border bg-saar-card p-6">
            <div className="font-mono text-[10px] tracking-widest uppercase text-saar-muted mb-4">
              The platform
            </div>
            <p className="font-serif text-2xl text-saar-text mb-4 leading-tight">
              &ldquo;Here&apos;s a 1M context window. Use as much as you want.&rdquo;
            </p>
            <div className="h-px bg-saar-border mb-4" />
            <p className="text-sm text-saar-secondary leading-relaxed">
              Providers bill by the token. A longer conversation means more
              revenue. They have no incentive to tell you to start a new chat.
            </p>
            <div className="mt-4 font-mono text-xs text-saar-muted">
              Revenue model: you burn, they earn
            </div>
          </div>

          {/* Saar card */}
          <div className="rounded-xl border border-saar-accent/30 bg-saar-card p-6 relative overflow-hidden">
            <div
              className="absolute inset-0 opacity-5"
              style={{ background: 'radial-gradient(circle at top right, #c15f3c, transparent 60%)' }}
            />
            <div className="relative">
              <div className="font-mono text-[10px] tracking-[0.18em] uppercase text-saar-accent mb-4">
                S A A R
              </div>
              <p className="font-serif text-2xl text-saar-text mb-4 leading-tight">
                &ldquo;Your context is at 71%. Start a new chat for the next task.&rdquo;
              </p>
              <div className="h-px bg-saar-border mb-4" />
              <p className="text-sm text-saar-secondary leading-relaxed">
                Saar is not a platform. It&apos;s a coach sitting beside your
                workflow. It wins when you get better results and use fewer
                tokens to get there.
              </p>
              <div className="mt-4 font-mono text-xs text-saar-accent">
                Aligned with you, not with the bill
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
