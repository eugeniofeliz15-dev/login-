import { useCallback, useEffect, useMemo, useState, type FormEvent, type ReactNode } from 'react';
import { ArrowLeft, ArrowRight, ArrowUpRight, BadgeCheck, Coffee, Leaf, LoaderCircle, MapPin, Plus, Salad, ShoppingBag, Sparkles, UtensilsCrossed, X } from 'lucide-react';
import { api } from '../services/api';
import type { Menu, Order, User, Zone } from '../types';
import { EmptyState, ErrorBanner, Loading, Modal, StatusPill } from '../components/Ui';
import { Field } from '../components/Brand';
import { formatDate, money } from '../utils/format';
export function PageHeading({ eyebrow, title, detail, action }: { eyebrow: string; title: ReactNode; detail: string; action?: ReactNode }) {
  return <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
    <div><p className="mb-2 text-[10px] font-extrabold uppercase tracking-[.2em] text-[#81917d]">{eyebrow}</p><h1 className="font-display text-3xl font-bold tracking-[-.045em] text-[#252a23] sm:text-[34px]">{title}</h1><p className="mt-2 text-sm text-[#85887e]">{detail}</p></div>{action}
  </div>;
}

export function CustomerMenu({ user }: { user: User }) {
  const [menus, setMenus] = useState<Menu[]>([]);
  const [zones, setZones] = useState<Zone[]>([]);
  const [dishes, setDishes] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState<Menu | null>(null);
  const [ingredients, setIngredients] = useState<Record<string, unknown> | null>(null);
  const [orderIngredients, setOrderIngredients] = useState<{ ingrediente_id: number; nombre: string }[]>([]);
  const [excludedIngredients, setExcludedIngredients] = useState<number[]>([]);
  const [coordinates, setCoordinates] = useState<{ latitud: number; longitud: number } | null>(null);
  const [dateFilter, setDateFilter] = useState("");
  const [catalogMode, setCatalogMode] = useState<"range" | "today" | "week" | "day">("range");
  const [quantity, setQuantity] = useState(1);
  const [orderBusy, setOrderBusy] = useState(false);
  const [notice, setNotice] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const menuRequest = catalogMode === "today"
        ? api.todayMenu().then((menu) => [menu])
        : catalogMode === "week"
          ? api.weeklyMenu()
          : catalogMode === "day" && dateFilter
            ? api.menuByDate(dateFilter).then((menu) => [menu])
            : api.menus({ fecha_inicio: dateFilter || undefined, fecha_fin: dateFilter || undefined });
      const [menuList, zoneList, dishList] = await Promise.all([menuRequest, api.zones(), api.catalogDishes()]);
      setMenus(menuList.filter((item) => item.publicado && item.cantidad_disponible > 0).sort((a, b) => a.fecha.localeCompare(b.fecha)));
      setZones(zoneList);
      setDishes(dishList);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "No se pudo cargar el menú.");
    } finally {
      setLoading(false);
    }
  }, [catalogMode, dateFilter]);

  useEffect(() => { void load(); }, [load]);
  const todaysMenu = useMemo(() => menus.find((item) => item.fecha === new Date().toISOString().slice(0, 10)), [menus]);

  async function showIngredients(menu: Menu) {
    try { setIngredients(await api.menuIngredients(menu.menu_dia_id)); }
    catch (reason) { setError(reason instanceof Error ? reason.message : "No se pudieron cargar los ingredientes del menú."); }
  }

  async function openOrder(menu: Menu) {
    setSelected(menu);
    setQuantity(1);
    setExcludedIngredients([]);
    setCoordinates(null);
    try {
      const details = await api.menuIngredients(menu.menu_dia_id);
      setOrderIngredients(Array.isArray(details.ingredientes)
        ? details.ingredientes.flatMap((item) => {
          if (typeof item !== "object" || item === null) return [];
          const row = item as Record<string, unknown>;
          return typeof row.ingrediente_id === "number" && typeof row.nombre === "string"
            ? [{ ingrediente_id: row.ingrediente_id, nombre: row.nombre }]
            : [];
        })
        : []);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "No se pudieron cargar las opciones de ingredientes.");
      setOrderIngredients([]);
    }
  }

  function useCurrentLocation() {
    if (!navigator.geolocation) {
      setError("Este navegador no permite compartir la ubicación.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => { setCoordinates({ latitud: coords.latitude, longitud: coords.longitude }); setError(""); },
      (reason) => setError(`No se pudo obtener la ubicación: ${reason.message}`),
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }

  async function placeOrder(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selected) return;
    setOrderBusy(true);
    setError("");
    const form = new FormData(event.currentTarget);
    try {
      await api.createOrder({
        zona_id: Number(form.get("zone")),
        direccion_referencia: String(form.get("address")),
        google_maps_link: String(form.get("maps") || "") || undefined,
        metodo_pago: String(form.get("payment")),
        ...(coordinates ?? {}),
        items: [{ menu_dia_id: selected.menu_dia_id, cantidad: quantity, exclusiones: excludedIngredients }],
      });
      setSelected(null);
      setQuantity(1);
      setNotice("¡Pedido confirmado! Ya puedes seguirlo desde Mis pedidos.");
      window.setTimeout(() => setNotice(""), 6000);
      await load();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "No se pudo crear el pedido.");
    } finally {
      setOrderBusy(false);
    }
  }

  return <>
    <PageHeading eyebrow="FRESCO, CASERO, TUYO" title={<>¡Buen día, {user.nombre_completo.split(" ")[0]}!</>} detail="Esto es lo que preparamos hoy, directo de nuestra cocina." />
    {notice && <div role="status" className="mb-6 flex items-center gap-2 rounded-xl border border-[#d6e5d3] bg-[#eff5eb] px-4 py-3 text-sm text-[#426149]"><BadgeCheck size={17} />{notice}<button onClick={() => setNotice("")} className="ml-auto"><X size={16} /></button></div>}
    {error && <div role="alert" className="mb-6 flex items-center justify-between rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}<button onClick={() => setError("")}><X size={16} /></button></div>}

    {todaysMenu && <div className="relative mb-8 overflow-hidden rounded-[24px] bg-[#e5e9df]">
      <div className="absolute -right-20 -top-32 h-[390px] w-[390px] rounded-full border border-[#bac5b5]/60" /><div className="absolute -right-5 -top-16 h-[300px] w-[300px] rounded-full border border-[#bac5b5]/60" />
      <div className="relative grid min-h-[205px] items-center gap-6 p-7 sm:p-9 lg:grid-cols-[1fr_auto]">
        <div><div className="mb-4 inline-flex items-center gap-1.5 rounded-full bg-white/70 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[.13em] text-[#526b50]"><Sparkles size={13} />EL FAVORITO DE HOY</div>
          <h2 className="max-w-xl font-display text-2xl font-bold leading-tight tracking-[-.04em] text-[#304531] sm:text-3xl">{todaysMenu.plato_principal.nombre}</h2>
          <p className="mt-2 max-w-lg text-sm leading-6 text-[#687464]">{todaysMenu.plato_principal.descripcion || "Un plato preparado al momento con ingredientes frescos y de temporada."}</p>
          <div className="mt-5 flex flex-wrap gap-2">{todaysMenu.bebida && <FoodTag icon={<Coffee size={13} />} text={todaysMenu.bebida.nombre} />}{todaysMenu.postre && <FoodTag icon={<Sparkles size={13} />} text={todaysMenu.postre.nombre} />}</div>
        </div>
        <div className="relative flex items-center gap-5 lg:pr-4"><div className="text-right"><p className="text-[10px] font-bold uppercase tracking-[.14em] text-[#788370]">MENÚ COMPLETO</p><p className="mt-1 font-display text-2xl font-extrabold tracking-tight text-[#354e3a]">{money(todaysMenu.precio_menu)}</p><p className="mt-1 text-xs text-[#788370]">{todaysMenu.cantidad_disponible} disponibles</p></div>
          <button onClick={() => void openOrder(todaysMenu)} className="flex h-12 items-center gap-2 rounded-xl bg-[#405d45] px-4 text-sm font-bold text-white shadow-sm transition hover:bg-[#334b38]">Pedir ahora <ArrowRight size={16} /></button>
        </div>
      </div>
    </div>}

    <div className="mb-5 flex flex-wrap items-end justify-between gap-3"><div><h2 className="font-display text-xl font-bold tracking-[-.03em] text-[#30352e]">Nuestro menú</h2><p className="mt-1 text-xs text-[#92958b]">Una cocina sencilla, hecha con buenos ingredientes.</p></div><div className="flex flex-wrap items-center gap-2"><button onClick={() => { setCatalogMode("today"); setDateFilter(""); }} className="rounded-lg border border-[#e5e5dc] bg-white px-3 py-2 text-xs font-semibold text-[#7c8276]">Hoy</button><input aria-label="Filtrar menú por fecha" type="date" value={dateFilter} onChange={(event) => { setCatalogMode("range"); setDateFilter(event.target.value); }} className="input !w-auto !py-2 text-xs" /><button onClick={() => setCatalogMode("day")} disabled={!dateFilter} className="rounded-lg bg-[#edf1ea] px-3 py-2 text-xs font-semibold text-[#46634a] disabled:opacity-50">Ver fecha</button><button onClick={() => { setCatalogMode("week"); setDateFilter(""); }} className="rounded-lg border border-[#e5e5dc] bg-white px-3 py-2 text-xs font-semibold text-[#7c8276]">Menú semanal</button></div></div>
    {loading ? <Loading /> : menus.length === 0 ? <EmptyState title="Hoy todavía no hay menú publicado" detail="Vuelve pronto; estamos preparando algo delicioso." icon={<UtensilsCrossed />} onRetry={load} /> : <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
      {menus.map((menu, index) => <MenuCard key={menu.menu_dia_id} menu={menu} index={index} onSelect={() => void openOrder(menu)} onIngredients={() => void showIngredients(menu)} dishes={dishes} />)}
    </div>}

    {ingredients && <Modal title={`Ingredientes · ${String(ingredients.plato_principal && typeof ingredients.plato_principal === "object" ? (ingredients.plato_principal as Record<string, unknown>).nombre ?? "Menú" : "Menú")}`} onClose={() => setIngredients(null)}>
      <div className="space-y-2">{Array.isArray(ingredients.ingredientes) && ingredients.ingredientes.length ? ingredients.ingredientes.map((item, index) => <p key={index} className="rounded-lg bg-[#f3f5ef] px-3 py-2 text-sm text-[#566151]">{typeof item === "object" && item !== null && "nombre" in item ? String(item.nombre) : String(item)}</p>) : <p className="py-4 text-center text-sm text-[#92958a]">No se registraron ingredientes para este menú.</p>}</div>
    </Modal>}
    {selected && <Modal title="Completa tu pedido" onClose={() => setSelected(null)}>
      <form onSubmit={placeOrder} className="space-y-4">
        <div className="rounded-xl bg-[#f2f4ee] p-4"><p className="font-display font-bold text-[#344837]">{selected.plato_principal.nombre}</p><p className="mt-1 text-xs text-[#858a80]">Menú del {formatDate(selected.fecha)} · {money(selected.precio_menu)} por persona</p></div>
        <Field label="Cantidad">
          <div className="flex items-center gap-3"><button type="button" aria-label="Restar cantidad" disabled={quantity <= 1} onClick={() => setQuantity((value) => value - 1)} className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#e2e4dc] disabled:opacity-40"><ArrowLeft size={15} /></button><span className="w-6 text-center font-bold">{quantity}</span><button type="button" aria-label="Sumar cantidad" disabled={quantity >= 10 || quantity >= selected.cantidad_disponible} onClick={() => setQuantity((value) => value + 1)} className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#e2e4dc] disabled:opacity-40"><Plus size={15} /></button><span className="text-xs text-[#92958a]">Máximo 10 por pedido</span></div>
        </Field>
        <Field label="Zona de entrega"><select name="zone" required className="input" defaultValue=""><option value="" disabled>Elige tu zona</option>{zones.map((zone) => <option key={zone.zona_id} value={zone.zona_id}>{zone.nombre_zona}</option>)}</select></Field>
        <Field label="Dirección o referencia"><input name="address" required maxLength={250} placeholder="Calle, número, edificio y una referencia" className="input" /></Field>
        <button type="button" onClick={useCurrentLocation} className="flex items-center gap-2 text-xs font-semibold text-[#557159] hover:underline"><MapPin size={14} />{coordinates ? "Ubicación añadida al pedido" : "Añadir mi ubicación actual"}</button>
        <Field label="Método de pago"><select name="payment" className="input" defaultValue="Efectivo"><option>Efectivo</option><option>QR</option><option>Transferencia</option></select></Field>
        <Field label="Enlace de Google Maps (opcional)"><input name="maps" type="url" placeholder="https://maps.google.com/..." className="input" /></Field>
        {orderIngredients.length > 0 && <fieldset><legend className="mb-2 text-xs font-semibold text-[#484c43]">Preferencias de ingredientes</legend><div className="flex flex-wrap gap-2">{orderIngredients.map((ingredient) => <label key={ingredient.ingrediente_id} className="flex items-center gap-1.5 rounded-lg bg-[#f3f5ef] px-2.5 py-2 text-[11px] text-[#687066]"><input type="checkbox" checked={excludedIngredients.includes(ingredient.ingrediente_id)} onChange={(event) => setExcludedIngredients((current) => event.target.checked ? [...current, ingredient.ingrediente_id] : current.filter((id) => id !== ingredient.ingrediente_id))} />Sin {ingredient.nombre}</label>)}</div></fieldset>}
        <div className="flex items-center justify-between border-t border-[#e8e8e0] pt-4"><span className="text-sm text-[#777d72]">Total</span><span className="font-display text-lg font-extrabold text-[#354e3a]">{money(Number(selected.precio_menu) * quantity)}</span></div>
        {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
        <button disabled={orderBusy || zones.length === 0} className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#405d45] py-3.5 text-sm font-bold text-white disabled:opacity-50">{orderBusy ? <LoaderCircle size={17} className="animate-spin" /> : <ShoppingBag size={16} />}Confirmar pedido</button>
      </form>
    </Modal>}
  </>;
}

function FoodTag({ icon, text }: { icon: ReactNode; text: string }) {
  return <span className="inline-flex items-center gap-1.5 rounded-full bg-white/70 px-3 py-1.5 text-xs font-medium text-[#667360]">{icon}{text}</span>;
}

function MenuCard({ menu, index, onSelect, onIngredients, dishes }: { menu: Menu; index: number; onSelect: () => void; onIngredients: () => void; dishes: Record<string, unknown>[] }) {
  const colors = ["bg-[#e8e9df]", "bg-[#f0e8dc]", "bg-[#e5eae4]"];
  return <article className="group animate-rise overflow-hidden rounded-[20px] border border-[#e3e6dc] bg-white shadow-[0_4px_16px_-13px_rgba(47,64,45,.35)] transition-all duration-200 hover:-translate-y-1 hover:border-[#8da18a] hover:shadow-[0_16px_34px_-18px_rgba(47,64,45,.4)]" style={{ animationDelay: `${index * 70}ms` }}>
    <div className={`relative flex h-40 items-center justify-center overflow-hidden ${colors[index % colors.length]}`}>
      {menu.imagen_url || menu.plato_principal.imagen_url
        ? <img src={menu.imagen_url || menu.plato_principal.imagen_url || ""} alt={menu.plato_principal.nombre} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
        : <div className="relative flex h-28 w-28 items-center justify-center rounded-full bg-white/55"><div className="absolute inset-2 rounded-full border border-[#bec8b9]" /><Salad size={42} strokeWidth={1.25} className="text-[#6b8266]" /></div>}
      <span className="absolute left-4 top-4 rounded-full bg-white/85 px-2.5 py-1 text-[10px] font-bold text-[#66715f]">{formatDate(menu.fecha)}</span>
      <span className="absolute right-4 top-4 flex items-center gap-1 text-[10px] font-semibold text-[#74806d]"><Leaf size={12} />Fresco</span>
    </div>
    <div className="p-5">
      <h3 className="font-display text-lg font-bold tracking-[-.025em] text-[#30362e]">{menu.plato_principal.nombre}</h3>
      <p className="mt-1.5 line-clamp-2 min-h-10 text-xs leading-5 text-[#858980]">{menu.plato_principal.descripcion || String(dishes.find((dish) => Number(dish.plato_id) === menu.plato_principal.plato_id)?.descripcion ?? "Cocinado al momento con ingredientes frescos y de temporada.")}</p>
      <div className="my-4 flex flex-wrap gap-1.5">{menu.bebida && <span className="rounded-md bg-[#f3f4ef] px-2 py-1 text-[10px] font-medium text-[#737b6d]">{menu.bebida.nombre}</span>}{menu.postre && <span className="rounded-md bg-[#f3f4ef] px-2 py-1 text-[10px] font-medium text-[#737b6d]">{menu.postre.nombre}</span>}</div>
      <div className="flex items-center justify-between border-t border-[#e6e9e1] pt-4"><div><p className="font-display text-lg font-extrabold text-[#354e3a]">{money(menu.precio_menu)}</p><p className="text-[10px] text-[#737b70]">{menu.cantidad_disponible} disponibles</p><button onClick={onIngredients} className="mt-1 text-[10px] font-semibold text-[#496b4d] hover:underline">Ver ingredientes</button></div><button onClick={onSelect} className="flex items-center gap-1.5 rounded-lg bg-[#405d45] px-3.5 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-[#334b38] active:scale-95">Elegir <ArrowUpRight size={14} /></button></div>
    </div>
  </article>;
}

export function CustomerOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [detail, setDetail] = useState<Record<string, unknown> | null>(null);
  const [tracking, setTracking] = useState<Record<string, unknown> | null>(null);
  const [trackToken, setTrackToken] = useState("");
  const [busyOrder, setBusyOrder] = useState<number | null>(null);
  const load = useCallback(() => {
    setLoading(true);
    api.myOrders().then(setOrders).catch((reason) => setError(reason instanceof Error ? reason.message : "No se pudieron cargar tus pedidos.")).finally(() => setLoading(false));
  }, []);
  useEffect(() => { load(); }, [load]);
  async function showDetail(id: number) {
    try { setDetail(await api.orderDetail(id)); }
    catch (reason) { setError(reason instanceof Error ? reason.message : "No se pudo consultar el pedido."); }
  }
  async function track(token: string) {
    try { setTracking(await api.trackOrder(token)); }
    catch (reason) { setError(reason instanceof Error ? reason.message : "No se pudo rastrear el pedido."); }
  }
  async function cancel(order: Order) {
    if (!window.confirm(`¿Cancelar el pedido #${order.pedido_id}?`)) return;
    setBusyOrder(order.pedido_id);
    try { await api.cancelOrder(order.pedido_id); await load(); }
    catch (reason) { setError(reason instanceof Error ? reason.message : "No se pudo cancelar el pedido."); }
    finally { setBusyOrder(null); }
  }
  return <>
    <PageHeading eyebrow="TU HISTORIAL" title="Mis pedidos" detail="Todo lo que pediste, en un solo lugar." action={<button onClick={load} className="rounded-lg border border-[#e3e4dc] bg-white px-3.5 py-2 text-xs font-bold text-[#566653] hover:bg-[#f1f3ed]">Actualizar</button>} />
    {error && <ErrorBanner message={error} />}
    <form onSubmit={(event) => { event.preventDefault(); void track(trackToken.trim()); }} className="mb-5 flex gap-2 rounded-xl border border-[#e9e9e1] bg-white p-3"><input aria-label="Token para rastrear un pedido" value={trackToken} onChange={(event) => setTrackToken(event.target.value)} placeholder="Rastrea un pedido con su token" className="input min-w-0 flex-1 !border-0 !py-2" /><button disabled={!trackToken.trim()} className="rounded-lg bg-[#edf1ea] px-3 py-2 text-xs font-bold text-[#46634a] disabled:opacity-50">Rastrear</button></form>
    {tracking && <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#dfe8dc] bg-[#f0f4ed] p-4"><div><p className="text-sm font-bold text-[#3d5942]">Pedido #{String(tracking.pedido_id)} · {String(tracking.estado)}</p><p className="mt-1 text-xs text-[#778171]">Token {String(tracking.token_recoger)} · {tracking.nombre_delivery ? `Repartidor: ${String(tracking.nombre_delivery)}` : "Aún sin repartidor"}</p></div><button onClick={() => setTracking(null)} aria-label="Cerrar seguimiento" className="text-[#71806d]"><X size={16} /></button></div>}
    {loading ? <Loading /> : orders.length ? <div className="overflow-hidden rounded-2xl border border-[#e9e9e1] bg-white">
      <div className="hidden grid-cols-[1.1fr_1.2fr_1fr_1fr_.7fr] gap-4 border-b border-[#eeeeea] bg-[#fbfbf9] px-5 py-3 text-[10px] font-bold uppercase tracking-[.12em] text-[#9a9d92] sm:grid"><span>Pedido</span><span>Fecha</span><span>Estado</span><span>Pago</span><span className="text-right">Total</span></div>
      {orders.map((order) => <div key={order.pedido_id} className="grid gap-3 border-b border-[#f0f0eb] px-5 py-4 last:border-0 sm:grid-cols-[1.1fr_1.2fr_1fr_1fr_.7fr] sm:items-center sm:gap-4"><div><p className="text-sm font-bold text-[#343a32]">Pedido #{order.pedido_id}</p><p className="mt-0.5 text-xs text-[#999c92]">{order.items_count} {order.items_count === 1 ? "menú" : "menús"} · {order.token_recoger}</p><div className="mt-2 flex gap-3"><button onClick={() => void showDetail(order.pedido_id)} className="text-[10px] font-bold text-[#557159] hover:underline">Detalle</button><button onClick={() => void track(order.token_recoger)} className="text-[10px] font-bold text-[#557159] hover:underline">Seguir pedido</button>{["Pendiente", "Confirmado"].includes(order.estado) && <button disabled={busyOrder === order.pedido_id} onClick={() => void cancel(order)} className="text-[10px] font-bold text-red-600 hover:underline">Cancelar</button>}</div></div><span className="text-xs text-[#777d72]">{formatDate(order.fecha_pedido)}</span><StatusPill status={order.estado} /><span className="text-xs text-[#777d72]">{order.metodo_pago}{order.esta_pagado ? " · Pagado" : ""}</span><span className="text-right font-display text-sm font-extrabold text-[#3c5740]">{money(order.total_pedido)}</span></div>)}
    </div> : <EmptyState title="Todavía no tienes pedidos" detail="Cuando hagas tu primer pedido, podrás seguirlo desde aquí." icon={<ShoppingBag />} />}
    {detail && <Modal title={`Detalle del pedido #${String(detail.pedido_id ?? "")}`} onClose={() => setDetail(null)}><div className="space-y-3"><div className="flex items-center justify-between"><StatusPill status={String(detail.estado ?? "")} /><span className="font-display font-extrabold text-[#405d45]">{money(String(detail.total_pedido ?? 0))}</span></div><p className="text-xs text-[#858a80]">Token: {String(detail.token_recoger)} · Pago: {String(detail.metodo_pago)}{detail.esta_pagado ? " (pagado)" : ""}</p><p className="text-xs text-[#858a80]">Dirección: {String(detail.direccion_referencia ?? "—")}</p><div className="space-y-2 border-t border-[#eeeeea] pt-3">{Array.isArray(detail.items) && detail.items.map((item, index) => { const row = item as Record<string, unknown>; const menu = row.menu as Record<string, unknown> | undefined; return <div key={String(row.item_id ?? index)} className="rounded-lg bg-[#f4f5f0] p-3 text-xs"><p className="font-bold text-[#4b5447]">{String(menu?.fecha ?? "Menú")} · {String(row.cantidad)}×</p><p className="mt-1 text-[#7c8277]">{String(row.precio_unitario)}{Array.isArray(row.exclusiones) && row.exclusiones.length ? ` · Sin ${row.exclusiones.join(", ")}` : ""}</p></div>; })}</div></div></Modal>}
  </>;
}
