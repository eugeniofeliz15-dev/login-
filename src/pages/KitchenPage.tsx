import { useCallback, useEffect, useState } from 'react';
import { Check, ChefHat, Clock3, PackageCheck, UtensilsCrossed } from 'lucide-react';
import { api } from '../services/api';
import type { KitchenOrder } from '../types';
import { EmptyState, ErrorBanner, Loading, Metric, StatusPill } from '../components/Ui';
import { PageHeading } from './CustomerPage';
export function KitchenBoard() {
  const [orders, setOrders] = useState<KitchenOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const load = useCallback(() => {
    setLoading(true);
    setError("");
    api.kitchenOrders().then(setOrders).catch((reason) => setError(reason instanceof Error ? reason.message : "No se pudo cargar la cocina.")).finally(() => setLoading(false));
  }, []);
  useEffect(() => { load(); }, [load]);
  async function update(order: KitchenOrder) {
    try {
      await api.updateKitchenOrder(order.pedido_id, order.estado === "Confirmado" ? "En Cocina" : "Listo para Entrega");
      load();
    } catch (reason) { setError(reason instanceof Error ? reason.message : "No se pudo actualizar el pedido."); }
  }
  return <>
    <PageHeading eyebrow="OPERACIÓN · COCINA" title="La cocina" detail="Pedidos confirmados y en preparación." action={<button onClick={load} className="flex items-center gap-2 rounded-lg border border-[#e3e4dc] bg-white px-3.5 py-2 text-xs font-bold text-[#566653]"><Clock3 size={14} />Actualizar</button>} />
    <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3"><Metric icon={<ChefHat />} value={orders.length} label="Pedidos en cola" /><Metric icon={<Clock3 />} value={orders.filter((order) => order.estado === "En Cocina").length} label="En preparación" /><Metric icon={<PackageCheck />} value={orders.filter((order) => order.estado === "Confirmado").length} label="Por comenzar" /></div>
    {error && <ErrorBanner message={error} />}
    {loading ? <Loading /> : orders.length ? <div className="grid gap-4 xl:grid-cols-2">{orders.map((order) => <article key={order.pedido_id} className={`overflow-hidden rounded-2xl border bg-white shadow-[0_6px_22px_-16px_rgba(45,58,43,.45)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_14px_28px_-17px_rgba(45,58,43,.42)] ${order.estado === "En Cocina" ? "border-l-4 border-l-[#c28b3c] border-y-[#e6dfd0] border-r-[#e6dfd0]" : "border-l-4 border-l-[#668365] border-y-[#dfe5dc] border-r-[#dfe5dc]"}`}>
      <div className="p-5 sm:p-6">
      <div className="flex items-start justify-between"><div><p className="text-[10px] font-bold uppercase tracking-[.15em] text-[#747d70]">PEDIDO #{order.pedido_id}</p><h2 className="mt-1 font-display text-lg font-bold text-[#32382f]">{order.cliente_nombre}</h2><p className="mt-1 text-xs text-[#737b70]">{order.token_recoger}{order.minutos_desde_pedido != null && ` · hace ${order.minutos_desde_pedido} min`}</p></div><StatusPill status={order.estado} /></div>
      <div className="my-5 space-y-3 border-y border-[#e5e8e0] py-4">{order.items.map((item) => <div key={item.item_id} className="flex gap-3"><span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#e6ece2] text-xs font-extrabold text-[#405d45]">{item.cantidad}×</span><div className="min-w-0"><p className="text-sm font-semibold text-[#3f463c]">{item.plato_principal}</p><p className="mt-1 text-xs text-[#747b71]">{[item.bebida, item.postre].filter(Boolean).join(" · ")}</p>{item.exclusiones.length > 0 && <p className="mt-2 rounded-md bg-[#fff4e8] px-2 py-1 text-xs font-bold text-[#a35f35]">Sin: {item.exclusiones.join(", ")}</p>}</div></div>)}</div>
      <button onClick={() => update(order)} className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#405d45] py-3 text-sm font-bold text-white shadow-sm transition hover:bg-[#2f4934] active:scale-[.99]">{order.estado === "Confirmado" ? <><ChefHat size={16} />Comenzar preparación</> : <><Check size={16} />Marcar listo para entrega</>}</button>
      </div>
    </article>)}</div> : <EmptyState title="Cocina al día" detail="No hay pedidos pendientes por preparar." icon={<ChefHat />} onRetry={load} />}
  </>;
}

export function KitchenHistory() {
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [orders, setOrders] = useState<KitchenOrder[]>([]);
  const [stats, setStats] = useState<Record<string, unknown> | null>(null);
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState("");
  const load = useCallback(async () => {
    setBusy(true); setError("");
    try {
      const [history, summary] = await Promise.all([api.kitchenHistory(date), api.kitchenStats(date)]);
      setOrders(history);
      setStats(summary);
    } catch (reason) { setError(reason instanceof Error ? reason.message : "No se pudo cargar el historial de cocina."); }
    finally { setBusy(false); }
  }, [date]);
  useEffect(() => { void load(); }, [load]);
  return <>
    <PageHeading eyebrow="OPERACIÓN · COCINA" title="Historial y estadísticas" detail="Rendimiento de cocina y pedidos procesados." action={<div className="flex gap-2"><input aria-label="Fecha del historial" type="date" value={date} onChange={(event) => setDate(event.target.value)} className="input" /><button onClick={() => void load()} className="rounded-lg border border-[#e3e4dc] bg-white px-3 py-2 text-xs font-bold text-[#566653]">Actualizar</button></div>} />
    {error && <ErrorBanner message={error} />}
    {busy ? <Loading /> : <>
      {stats && <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4"><Metric icon={<PackageCheck />} value={Number(stats.total_pedidos_procesados ?? 0)} label="Procesados" /><Metric icon={<ChefHat />} value={Number(stats.pedidos_en_proceso ?? 0)} label="En proceso" /><Metric icon={<UtensilsCrossed />} value={Number(stats.platos_preparados ?? 0)} label="Platos preparados" /><Metric icon={<Clock3 />} value={Number(stats.tiempo_promedio_preparacion ?? 0)} label="Minutos promedio" /></div>}
      {orders.length ? <div className="overflow-hidden rounded-2xl border border-[#e9e9e1] bg-white">{orders.map((order) => <div key={order.pedido_id} className="flex flex-wrap items-center justify-between gap-3 border-b border-[#f0f0eb] px-5 py-4 last:border-0"><div><p className="text-sm font-bold text-[#343a32]">Pedido #{order.pedido_id} · {order.cliente_nombre}</p><p className="mt-1 text-xs text-[#8b9085]">{order.items.map((item) => `${item.cantidad}× ${item.plato_principal}`).join(" · ")}</p></div><StatusPill status={order.estado} /></div>)}</div> : <EmptyState title="Sin pedidos en esta fecha" detail="El historial de cocina aparecerá aquí." icon={<Clock3 />} />}
    </>}
  </>;
}
