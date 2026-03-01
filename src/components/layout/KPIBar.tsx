"use client"

export function KPIBar({ items }: { items: { label: string; value: string; color: string }[] }) {
  return (
    <div className="glass-bright p-4 flex gap-4 justify-between items-center overflow-x-auto">
      {items.map((item) => (
        <div key={item.label} className="text-center flex-1 min-w-[80px]">
          <div className="text-[10px] text-white/50 uppercase tracking-wider">{item.label}</div>
          <div className={`text-2xl sm:text-3xl font-black ${item.color}`}>{item.value}</div>
        </div>
      ))}
    </div>
  )
}
