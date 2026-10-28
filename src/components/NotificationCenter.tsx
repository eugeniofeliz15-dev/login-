import { useState } from "react";
import { Bell, LoaderCircle, RefreshCw, X } from "lucide-react";
import { api } from "../services/api";
import type { Role } from "../types";

type EventRow = Record<string, unknown>;

export default function NotificationCenter({ role }: { role: Role }) {
  const [open, setOpen] = useState(false);
  const [events, setEvents] = useState<EventRow[]>([]);
  const [total, setTotal] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function refresh() {
    setBusy(true);
    setError("");
    const roleRequest = role === "cliente" ? api.customerNotifications()
      : role === "cocina" ? api.kitchenNotifications()
        : role === "delivery" ? api.deliveryNotifications()
          : Promise.resolve([] as EventRow[]);
    try {
      const [allEvents, count, roleEvents] = await Promise.all([
        api.notifications({ desde_minutos: 60, limit: 50 }),
        api.notificationCount(),
        roleRequest,
      ]);
      const unique = new Map<string, EventRow>();
      [...allEvents, ...roleEvents].forEach((event, index) => {
        unique.set(String(event.evento_id ?? `${event.tipo}-${event.fecha_creacion}-${index}`), event);
      });
      setEvents([...unique.values()].sort((a, b) => String(b.fecha_creacion ?? "").localeCompare(String(a.fecha_creacion ?? ""))));
      setTotal(Number(count.total ?? 0));
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "No se pudieron cargar las notificaciones.");
    } finally {
      setBusy(false);
    }
  }

  return <div className="relative">
    <button title="Notificaciones" aria-label="Notificaciones" aria-expanded={open} onClick={() => {
      const next = !open;
      setOpen(next);
      if (next) void refresh();
    }} className="relative rounded-lg p-2 text-[#878b80] transition hover:bg-[#ecece5] hover:text-[#405d45]">
      <Bell size={18} />
      {total > 0 && <span className="absolute right-0.5 top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#b46b47] px-1 text-[9px] font-bold text-white">{total > 99 ? "99+" : total}</span>}
    </button>
    {open && <div className="fixed inset-x-3 top-[66px] z-40 mx-auto max-h-[75vh] max-w-md overflow-hidden rounded-2xl border border-[#e7e8e0] bg-white shadow-xl sm:absolute sm:left-auto sm:right-0 sm:top-12 sm:w-[360px]">
      <div className="flex items-center justify-between border-b border-[#efefe9] px-4 py-3"><div><p className="text-sm font-bold text-[#3d4439]">Notificaciones</p><p className="text-[10px] text-[#92968c]">{total} nuevas</p></div><div className="flex gap-1"><button aria-label="Actualizar notificaciones" onClick={() => void refresh()} className="rounded-lg p-2 text-[#66745f] hover:bg-[#f1f3ed]"><RefreshCw size={15} /></button><button aria-label="Cerrar notificaciones" onClick={() => setOpen(false)} className="rounded-lg p-2 text-[#858a80] hover:bg-[#f1f2ed]"><X size={15} /></button></div></div>
      {error && <p role="alert" className="px-4 py-3 text-xs text-red-600">{error}</p>}
      <div className="max-h-[55vh] overflow-y-auto">
        {busy && !events.length ? <div className="flex items-center justify-center gap-2 py-10 text-xs text-[#8a8f84]"><LoaderCircle size={15} className="animate-spin" />Cargando...</div>
          : events.length ? events.map((event, index) => <article key={String(event.evento_id ?? index)} className="border-b border-[#f1f1ec] px-4 py-3 last:border-0"><p className="text-xs font-bold text-[#434a3f]">{String(event.titulo ?? event.tipo ?? "Notificación")}</p><p className="mt-1 text-xs leading-5 text-[#747a70]">{String(event.mensaje ?? "")}</p><p className="mt-1.5 text-[10px] text-[#a0a398]">{event.fecha_creacion ? new Date(String(event.fecha_creacion)).toLocaleString("es-BO") : ""}</p></article>)
            : !error && <p className="px-4 py-10 text-center text-xs text-[#92958a]">No tienes notificaciones recientes.</p>}
      </div>
    </div>}
  </div>;
}
