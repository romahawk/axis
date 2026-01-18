type Item = { id: string; text: string; done?: boolean };

export default function CheckList({
  title,
  items,
  onToggle,
}: {
  title: string;
  items: Item[];
  onToggle?: (id: string, nextDone: boolean) => void;
}) {
  return (
    <div className="rounded-xl border border-slate-800 p-4">
      <div className="mb-3 text-sm font-semibold text-slate-200">{title}</div>

      <ul className="space-y-2">
        {items.length === 0 ? (
          <li className="text-sm text-slate-500">Empty</li>
        ) : (
          items.map((it) => {
            const checked = Boolean(it.done);
            return (
              <li key={it.id} className="flex items-start gap-3">
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => onToggle?.(it.id, !checked)}
                  className="mt-1 h-4 w-4 cursor-pointer"
                />
                <span
                  className={
                    checked ? "text-slate-400 line-through" : "text-slate-100"
                  }
                >
                  {it.text}
                </span>
              </li>
            );
          })
        )}
      </ul>
    </div>
  );
}
