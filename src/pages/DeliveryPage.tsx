import { useCallback, useEffect, useState } from 'react';
import { ArrowUpRight, Bell, Bike, Check, Clock3, MapPin, PackageCheck } from 'lucide-react';
import { api } from '../services/api';
import type { DeliveryOrder } from '../types';
import { EmptyState, ErrorBanner, Loading, Metric, StatusPill } from '../components/Ui';
import { PageHeading } from './CustomerPage';
import { money } from '../utils/format';
export function DeliveryBoard() {
  const [orders, setOrders] = useState<DeliveryOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const load = useCallback(() => {
    setLoading(true);
    setError("");
    api.deliveryOrders().then(setOrders).catch((reason) => setError(reason instanceof Error ? reason.message : "No se pudieron cargar las entregas.")).finally(() => setLoading(false));
  }, []);
  useEffect(() => { load(); }, [load]);
  async function act(order: DeliveryOrder) {
    try {
      if (order.estado === "Listo para Entrega") await api.takeDelivery(order.pedido_id);
      else await api.finishDelivery(order.pedido_id, order.metodo_pago === "Efectivo" && !order.esta_pagado);
      load();
    } catch (reason) { setError(reason instanceof Error ? reason.message : "No se pudo actualizar la entrega."); }
  }
  async function notifyArrival(order: DeliveryOrder) {
    try { await api.notifyArrival(order.pedido_id); setError(""); }
    catch (reason) { setError(reason instanceof Error ? reason.message : "No se pudo notificar la llegada."); }
  }
  return <>
    <PageHeading eyebrow="OPERACIÓN · REPARTO" title="Tus entregas" detail="Tu próxima parada, a un toque de distancia." action={<button onClick={load} className="flex items-center gap-2 rounded-lg border border-[#e3e4dc] bg-white px-3.5 py-2 text-xs font-bold text-[#566653]"><Clock3 size={14} />Actualizar</button>} />
    <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3"><Metric icon={<Bike />} value={orders.length} label="Pedidos asignados" /><Metric icon={<ArrowUpRight />} value={orders.filter((order) => order.estado === "En Reparto").length} label="En camino" /><Metric icon={<Check />} value={orders.filter((order) => order.estado === "Entregado").length} label="Entregados" /></div>
    {error && <ErrorBanner message={error} />}
    {loading ? <Loading /> : orders.length ? <div className="grid gap-4 xl:grid-cols-2">{orders.map((order) => <article key={order.pedido_id} className={`rounded-2xl border bg-white p-5 shadow-[0_6px_22px_-16px_rgba(45,58,43,.45)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_14px_28px_-17px_rgba(45,58,43,.42)] sm:p-6 ${order.estado === "En Reparto" ? "border-l-4 border-l-[#5c78a9] border-y-[#dfe5ef] border-r-[#dfe5ef]" : order.estado === "Entregado" ? "border-l-4 border-l-[#668365] border-y-[#dfe5dc] border-r-[#dfe5dc]" : "border-l-4 border-l-[#c28b3c] border-y-[#e8e2d5] border-r-[#e8e2d5]"}`}>
      <div className="flex items-start justify-between"><div><p className="text-[10px] font-bold uppercase tracking-[.15em] text-[#92978b]">ENTREGA #{order.pedido_id}</p><h2 className="mt-1 font-display text-lg font-bold text-[#32382f]">{order.cliente_nombre}</h2><p className="mt-1 text-xs text-[#92968b]">{order.zona_nombre} · {order.token_recoger}</p></div><StatusPill status={order.estado} /></div>
      <div className="my-5 rounded-xl bg-[#f6f7f3] p-4"><div className="flex gap-2 text-sm text-[#596054]"><MapPin size={16} className="mt-0.5 shrink-0 text-[#6c8568]" /><span>{order.direccion_referencia || "Sin referencia de dirección"}</span></div>{order.google_maps_link && <a href={order.google_maps_link} target="_blank" rel="noreferrer" className="ml-6 mt-2 inline-flex items-center gap-1 text-xs font-bold text-[#58765a] hover:underline">Abrir en Maps <ArrowUpRight size={12} /></a>}</div>
      <div className="mb-4 flex items-center justify-between text-xs text-[#858a7f]"><span>{order.cantidad_items} artículos · {order.metodo_pago}</span><span className="font-display text-base font-extrabold text-[#3c5740]">{money(order.total_pedido)}</span></div>
      {order.estado === "En Reparto" && <button onClick={() => void notifyArrival(order)} className="mb-2 flex w-full items-center justify-center gap-2 rounded-xl border border-[#dfe5dc] bg-[#f4f6f1] py-2.5 text-xs font-bold text-[#46634a]"><Bell size={14} />Notificar llegada al cliente</button>}
      {order.estado !== "Entregado" && <button onClick={() => act(order)} className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#405d45] py-3 text-sm font-bold text-white hover:bg-[#334b38]">{order.estado === "Listo para Entrega" ? <><Bike size={16} />Tomar pedido</> : <><PackageCheck size={16} />Confirmar entrega{order.metodo_pago === "Efectivo" && !order.esta_pagado ? " y pago" : ""}</>}</button>}
    </article>)}</div> : <EmptyState title="Todo entregado" detail="Cuando tengas un nuevo pedido asignado, lo verás aquí." icon={<Bike />} onRetry={load} />}
  </>;
}
