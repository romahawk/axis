type Item = { id: string; text: string; done?: boolean };

export default function CheckList({
  title,
  items,
}: {
  title: string;
  items: Item[];
}) {
  return (
    <div className="rounded-xl border border-slate-800 p-4">
      <div className="mb-3 text-sm font-semibold text-slate-200">{title}</div>

      <ul className="space-y-2">
        {items.length === 0 ? (
          <li className="text-sm text-slate-500">Empty</li>
        ) : (
          items.map((it) => (
            <li key={it.id} className="flex items-start gap-3">
              <input
                type="checkbox"
                checked={Boolean(it.done)}
                readOnly
                className="mt-1 h-4 w-4"
              />
              <span
                className={
                  it.done ? "text-slate-400 line-through" : "text-slate-100"
                }
              >
                {it.text}
              </span>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}
