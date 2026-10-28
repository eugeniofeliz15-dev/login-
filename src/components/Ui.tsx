import { useEffect, type ReactNode } from 'react';
import { LoaderCircle, X } from 'lucide-react';
export function Metric({ icon, value, label }: { icon: ReactNode; value: number; label: string }) {
  return <div className="rounded-xl border border-[#e9e9e1] bg-white p-4"><div className="mb-3 flex h-8 w-8 items-center justify-center rounded-lg bg-[#edf1ea] text-[#5b7558]">{icon}</div><p className="font-display text-2xl font-extrabold tracking-tight text-[#30362e]">{value}</p><p className="mt-0.5 text-xs text-[#8d9187]">{label}</p></div>;
}

export function StatusPill({ status }: { status: string }) {
  const style = status === "Entregado" || status === "Listo para Entrega" ? "bg-[#eaf2e8] text-[#4e7652]"
    : status === "Cancelado" ? "bg-[#f9eae7] text-[#ab6454]"
      : status === "En Reparto" ? "bg-[#e9eef8] text-[#526c9b]"
        : status === "En Cocina" ? "bg-[#fbf0df] text-[#a37b37]"
          : "bg-[#f0f0eb] text-[#757a70]";
  return <span className={`inline-flex w-fit items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold ${style}`}><span className="h-1.5 w-1.5 rounded-full bg-current" />{status}</span>;
}

export function Loading() {
  return <div className="flex min-h-52 items-center justify-center gap-2 text-sm text-[#82877c]"><LoaderCircle size={18} className="animate-spin text-[#567256]" />Cargando...</div>;
}

export function ErrorBanner({ message }: { message: string }) {
  return <div role="alert" className="mb-5 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"><X size={16} />{message}</div>;
}

export function EmptyState({ title, detail, icon, onRetry }: { title: string; detail: string; icon: ReactNode; onRetry?: () => void }) {
  return <div className="flex min-h-64 flex-col items-center justify-center rounded-2xl border border-dashed border-[#dedfd5] bg-white/55 px-5 text-center"><div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#e9ede5] text-[#62785d]">{icon}</div><h3 className="font-display font-bold text-[#42483e]">{title}</h3><p className="mt-1.5 max-w-sm text-sm text-[#92958a]">{detail}</p>{onRetry && <button onClick={onRetry} className="mt-4 text-xs font-bold text-[#4c694d] hover:underline">Intentar de nuevo</button>}</div>;
}

export function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => { if (event.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);
  return <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-[#20281f]/45 p-4 backdrop-blur-[2px]" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
    <div role="dialog" aria-modal="true" aria-labelledby="modal-title" className="animate-rise my-auto w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
      <div className="mb-5 flex items-center justify-between"><h2 id="modal-title" className="font-display text-xl font-bold tracking-[-.03em] text-[#30362e]">{title}</h2><button aria-label="Cerrar" onClick={onClose} className="rounded-lg p-2 text-[#82877c] hover:bg-[#f1f2ed]"><X size={18} /></button></div>
      {children}
    </div>
  </div>;
}

