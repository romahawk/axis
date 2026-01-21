// frontend/src/components/axis-guide/AxisGuideContent.tsx

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
      <header className="space-y-1">
        <div className="text-sm uppercase tracking-wide text-slate-300">
          {AXIS_GUIDE_SUBTITLE}
        </div>
        <h2 className="text-xl font-semibold text-slate-100">
          {AXIS_GUIDE_TITLE}
        </h2>
      </header>

      {/* TOC */}
      <nav className="rounded-xl border border-slate-700/60 bg-slate-950/30 p-3">
        <div className="text-xs font-medium text-slate-300 mb-2">Sections</div>
        <div className="flex flex-wrap gap-2">
          {AXIS_GUIDE_SECTIONS.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => onJump?.(s.id)}
              className="text-xs px-2 py-1 rounded-lg border border-slate-700/60 bg-slate-900/40 text-slate-100 hover:bg-slate-800/60 transition"
            >
              {s.title}
            </button>
          ))}
        </div>
      </nav>

      <div className="space-y-8">
        {AXIS_GUIDE_SECTIONS.map((section) => (
          <section key={section.id} id={section.id} className="scroll-mt-24">
            <h3 className="text-base font-semibold mb-3 text-slate-100">
              {section.title}
            </h3>

            <div className="space-y-3">
              {section.body.map((block, idx) => {
                if (block.type === "h") {
                  return (
                    <div key={idx} className="text-sm font-semibold text-slate-200">
                      {block.text}
                    </div>
                  );
                }
                if (block.type === "p") {
                  return (
                    <p key={idx} className="text-sm leading-6 text-slate-200">
                      {block.text}
                    </p>
                  );
                }
                if (block.type === "ul") {
                  return (
                    <ul key={idx} className="list-disc pl-5 text-sm leading-6 space-y-1 text-slate-200">
                      {block.items.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  );
                }
                if (block.type === "quote") {
                  return (
                    <blockquote
                      key={idx}
                      className="text-sm leading-6 border-l-2 pl-3 border-slate-600 text-slate-200"
                    >
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
