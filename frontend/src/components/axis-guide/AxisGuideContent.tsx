import {
  AXIS_GUIDE_SECTIONS,
  AXIS_GUIDE_SUBTITLE,
  AXIS_GUIDE_TITLE,
} from "./AxisGuideContentData";

type Props = {
  onJump?: (id: string) => void;
};

export function AxisGuideContent({ onJump }: Props) {
  return (
    <div className="space-y-6">
      {/* Hero */}
      <header className="relative overflow-hidden rounded-2xl border border-indigo-400/15 bg-slate-950/30 p-4">
        <div className="pointer-events-none absolute -left-10 -top-10 h-40 w-40 rounded-full bg-indigo-500/10 blur-2xl" />
        <div className="pointer-events-none absolute -right-10 -bottom-10 h-40 w-40 rounded-full bg-cyan-500/10 blur-2xl" />

        <div className="text-[11px] uppercase tracking-[0.22em] text-indigo-200/80">
          {AXIS_GUIDE_SUBTITLE}
        </div>
        <h2 className="mt-1 text-xl font-semibold text-slate-100">
          {AXIS_GUIDE_TITLE}
        </h2>
        <div className="mt-2 text-sm text-slate-300/95 leading-6">
          Use this as a quick reference. If you’re scrolling, you’re probably avoiding execution.
        </div>
      </header>

      {/* TOC */}
      <nav className="rounded-2xl border border-indigo-400/15 bg-slate-950/25 p-3">
        <div className="mb-2 text-[11px] uppercase tracking-[0.18em] text-slate-300/90">
          Sections
        </div>

        <div className="flex flex-wrap gap-2">
          {AXIS_GUIDE_SECTIONS.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => onJump?.(s.id)}
              className={[
                "text-xs px-2.5 py-1.5 rounded-xl",
                "border border-indigo-400/20",
                "bg-slate-900/40 hover:bg-slate-800/60",
                "text-slate-100",
                "shadow-[0_0_0_1px_rgba(99,102,241,0.08)_inset]",
                "transition",
              ].join(" ")}
            >
              {s.title}
            </button>
          ))}
        </div>
      </nav>

      <div className="space-y-10">
        {AXIS_GUIDE_SECTIONS.map((section) => (
          <section
            key={section.id}
            id={section.id}
            className="scroll-mt-24 rounded-2xl border border-slate-800/50 bg-slate-950/15 p-4"
          >
            <div className="mb-3 flex items-baseline justify-between gap-3">
              <h3 className="text-base font-semibold text-slate-100">
                {section.title}
              </h3>
              <div className="text-[10px] uppercase tracking-[0.2em] text-slate-400">
                Protocol
              </div>
            </div>

            <div className="space-y-3">
              {section.body.map((block, idx) => {
                if (block.type === "h") {
                  return (
                    <div
                      key={idx}
                      className="text-sm font-semibold text-indigo-100"
                    >
                      {block.text}
                    </div>
                  );
                }

                if (block.type === "p") {
                  return (
                    <p key={idx} className="text-sm leading-6 text-slate-200/95">
                      {block.text}
                    </p>
                  );
                }

                if (block.type === "ul") {
                  return (
                    <ul
                      key={idx}
                      className="list-disc pl-5 text-sm leading-6 space-y-1 text-slate-200/95 marker:text-indigo-300/70"
                    >
                      {block.items.map((item) => (
                        <li key={item} className="pl-1">
                          {item}
                        </li>
                      ))}
                    </ul>
                  );
                }

                if (block.type === "quote") {
                  return (
                    <blockquote
                      key={idx}
                      className={[
                        "rounded-xl border border-indigo-400/15",
                        "bg-gradient-to-r from-indigo-950/25 to-slate-950/10",
                        "px-3 py-2",
                        "text-sm leading-6 text-slate-200/95",
                        "shadow-[0_0_0_1px_rgba(99,102,241,0.10)_inset]",
                      ].join(" ")}
                    >
                      <div className="text-[10px] uppercase tracking-[0.2em] text-indigo-200/70 mb-1">
                        Principle
                      </div>
                      {block.text}
                    </blockquote>
                  );
                }

                return null;
              })}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
