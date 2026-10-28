import { Leaf } from 'lucide-react';
import type { ReactNode } from 'react';
export function Brand({ inverse = false }: { inverse?: boolean }) {
  return <div className={`relative z-10 flex items-center gap-2.5 ${inverse ? "text-white" : "text-[#354e3a]"}`}>
    <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${inverse ? "bg-white/10" : "bg-[#e7ece3]"}`}><Leaf size={21} strokeWidth={2.2} /></div>
    <span className="font-display text-[21px] font-extrabold tracking-[-.06em]">delinut<span className="text-[#d2aa70]">.</span></span>
  </div>;
}

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return <label className="block"><span className="mb-1.5 block text-xs font-semibold text-[#484c43]">{label}</span>{children}</label>;
}
