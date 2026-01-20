export default function Home() {
  return (
    <div className="py-16">
      <section className="grid gap-12 lg:grid-cols-[1.2fr_1fr]">
        <div className="space-y-6">
          <p className="text-xs uppercase tracking-[0.28em] text-muted-foreground">
            Staff product designer
          </p>
          <h1 className="text-4xl font-semibold leading-tight">
            Hi, I&apos;m Simon.
          </h1>
          <p className="max-w-lg text-base leading-7 text-muted-foreground">
            Visual-first portfolio focused on product systems, platform work,
            and the details that make complex tools feel calm.
          </p>
          <div className="inline-flex items-center text-sm text-muted-foreground">
            Hover to learn more about me → Info
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-surface p-6">
          <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">
            Recent work
          </p>
          <div className="mt-4 space-y-3 text-sm text-muted-foreground">
            <div className="flex items-center justify-between">
              <span>Langflow</span>
              <span>Staff Product Designer</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Datastax</span>
              <span>Product Design Lead</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Capital One</span>
              <span>Senior Product Designer</span>
            </div>
          </div>
        </div>
      </section>

      <section className="mt-16">
        <div className="grid gap-6 md:grid-cols-2">
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              key={`work-card-${index}`}
              className="group relative h-48 overflow-hidden rounded-2xl border border-white/10 bg-surface/70 p-6 transition-colors"
            >
              <div className="text-xs uppercase tracking-[0.22em] text-muted-foreground">
                Project
              </div>
              <div className="mt-3 text-lg font-medium">Project Title</div>
              <div className="mt-1 text-sm text-muted-foreground">
                Platform redesign
              </div>
              <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity group-hover:opacity-100">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.08),_transparent_55%)]" />
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
