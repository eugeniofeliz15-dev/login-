import { useCallback, useEffect, useMemo, useState, type FormEvent, type ReactNode } from "react";
import {
  Activity, BadgeCheck, BookOpen, Boxes, CalendarDays, ChefHat, CircleDollarSign,
  ClipboardList, Clock3, ImagePlus, LoaderCircle, MapPin, Pencil, Plus, RefreshCw,
  Trash2, Users, X,
} from "lucide-react";
import { api } from "../services/api";
import type { DishInput, EmployeeInput, Menu, MenuInput, Zone } from "../types";

type AdminTab = "orders" | "menus" | "dishes" | "ingredients" | "employees" | "clients" | "zones" | "reports" | "system";
type Row = Record<string, unknown>;
const tabs: { id: AdminTab; label: string; icon: typeof ClipboardList }[] = [
  { id: "orders", label: "Pedidos", icon: ClipboardList },
  { id: "menus", label: "Menús", icon: CalendarDays },
  { id: "dishes", label: "Platos", icon: ChefHat },
  { id: "ingredients", label: "Ingredientes", icon: Boxes },
  { id: "employees", label: "Equipo", icon: Users },
  { id: "clients", label: "Clientes", icon: Users },
  { id: "zones", label: "Zonas", icon: MapPin },
  { id: "reports", label: "Reportes", icon: CircleDollarSign },
  { id: "system", label: "Sistema", icon: Activity },
];

const today = () => new Date().toISOString().slice(0, 10);
const fieldString = (row: Row, key: string) => String(row[key] ?? "—");

export default function AdminWorkspace() {
  const [tab, setTab] = useState<AdminTab>("orders");
  return <div>
    <div className="mb-7 overflow-x-auto">
      <nav className="flex min-w-max gap-1 rounded-xl border border-[#e8e9e1] bg-white p-1.5">
        {tabs.map(({ id, label, icon: Icon }) => <button key={id} aria-pressed={tab === id} onClick={() => setTab(id)} className={`flex items-center gap-2 rounded-lg border px-3 py-2.5 text-xs font-bold transition-all duration-200 ${tab === id ? "border-[#354e3a] bg-[#405d45] text-white shadow-[0_4px_12px_-5px_rgba(53,78,58,.8)]" : "border-transparent text-[#74796f] hover:border-[#dce4d8] hover:bg-[#f1f3ed]"}`}><Icon size={15} />{label}{tab === id && <span className="ml-1 rounded-full bg-white/20 px-1.5 py-0.5 text-[9px] uppercase tracking-wide">Activo</span>}</button>)}
      </nav>
    </div>
    {tab === "orders" && <OrdersAdmin />}
    {tab === "menus" && <MenusAdmin />}
    {tab === "dishes" && <DishesAdmin />}
    {tab === "ingredients" && <IngredientsAdmin />}
    {tab === "employees" && <EmployeesAdmin />}
    {tab === "clients" && <ClientsAdmin />}
    {tab === "zones" && <ZonesAdmin />}
    {tab === "reports" && <ReportsAdmin />}
    {tab === "system" && <SystemAdmin />}
  </div>;
}

function useResource<T>(load: () => Promise<T>, initial: T) {
  const [data, setData] = useState<T>(initial);
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState("");
  const refresh = useCallback(async () => {
    setBusy(true);
    setError("");
    try { setData(await load()); }
    catch (reason) { setError(reason instanceof Error ? reason.message : "No se pudieron cargar los datos."); }
    finally { setBusy(false); }
  }, [load]);
  useEffect(() => { void refresh(); }, [refresh]);
  return { data, setData, busy, error, setError, refresh };
}

function ResourceHeading({ eyebrow, title, detail, action }: { eyebrow: string; title: string; detail: string; action?: ReactNode }) {
  return <div className="mb-6 flex flex-wrap items-end justify-between gap-4"><div><p className="mb-1.5 text-[10px] font-extrabold uppercase tracking-[.18em] text-[#81917d]">{eyebrow}</p><h2 className="font-display text-2xl font-bold tracking-[-.04em] text-[#30362e]">{title}</h2><p className="mt-1 text-xs text-[#8b8f85]">{detail}</p></div>{action}</div>;
}

function RefreshButton({ onClick }: { onClick: () => void }) {
  return <button onClick={onClick} title="Actualizar" className="rounded-lg border border-[#e5e6de] bg-white p-2.5 text-[#64705f] hover:bg-[#f2f4ee]"><RefreshCw size={15} /></button>;
}

function Alert({ message }: { message: string }) {
  return message ? <div role="alert" className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3.5 py-2.5 text-xs text-red-700">{message}</div> : null;
}

function Table({ headers, rows, empty, busy }: { headers: string[]; rows: ReactNode[]; empty: string; busy: boolean }) {
  if (busy) return <div className="flex min-h-40 items-center justify-center gap-2 text-xs text-[#858a80]"><LoaderCircle size={16} className="animate-spin" />Cargando...</div>;
  if (!rows.length) return <div className="rounded-xl border border-dashed border-[#dedfd5] px-4 py-12 text-center text-sm text-[#92958a]">{empty}</div>;
  return <div className="overflow-x-auto rounded-xl border border-[#e2e5dc] bg-white shadow-[0_4px_18px_-14px_rgba(45,58,43,.4)]"><table className="w-full min-w-[620px] text-left"><thead className="bg-[#f3f5ef] text-[10px] font-bold uppercase tracking-[.12em] text-[#747d70]"><tr>{headers.map((header) => <th key={header} className="px-4 py-3">{header}</th>)}</tr></thead><tbody>{rows}</tbody></table></div>;
}

function Cell({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <td className={`border-t border-[#e9ece5] px-4 py-3.5 text-xs text-[#596254] transition-colors ${className}`}>{children}</td>;
}

function ActionButton({ label, onClick, danger = false }: { label: string; onClick: () => void; danger?: boolean }) {
  return <button title={label} aria-label={label} onClick={onClick} className={`rounded-lg p-2 transition ${danger ? "text-red-600 hover:bg-red-50" : "text-[#58715a] hover:bg-[#edf1ea]"}`}>{danger ? <Trash2 size={15} /> : <Pencil size={15} />}</button>;
}

function OrdersAdmin() {
  const [filters, setFilters] = useState({ fecha_inicio: "", fecha_fin: "", estado: "", zona_id: "" });
  const [zones, setZones] = useState<Zone[]>([]);
  const [deliveries, setDeliveries] = useState<Row[]>([]);
  const [selected, setSelected] = useState<Row | null>(null);
  const [error, setError] = useState("");
  const load = useCallback(() => api.adminOrders({
    fecha_inicio: filters.fecha_inicio || undefined,
    fecha_fin: filters.fecha_fin || undefined,
    estado: filters.estado || undefined,
    zona_id: filters.zona_id ? Number(filters.zona_id) : undefined,
  }), [filters]);
  const resource = useResource(load, [] as Row[]);
  useEffect(() => {
    api.adminZones().then(setZones).catch((reason) => setError(reason instanceof Error ? reason.message : "No se pudieron cargar las zonas."));
    api.employees().then((items) => setDeliveries(items.filter((item) => item.rol_id === 3))).catch((reason) => setError(reason instanceof Error ? reason.message : "No se pudieron cargar los repartidores."));
  }, []);
  async function act(id: number, fn: () => Promise<unknown>) {
    try { await fn(); await resource.refresh(); setError(""); }
    catch (reason) { setError(reason instanceof Error ? reason.message : "La operación falló."); }
    void id;
  }
  async function details(id: number) {
    try { setSelected(await api.adminOrderDetail(id)); }
    catch (reason) { setError(reason instanceof Error ? reason.message : "No se pudo consultar el pedido."); }
  }
  const statuses = ["Pendiente", "Confirmado", "En Cocina", "Listo para Entrega", "En Reparto", "Entregado", "Cancelado"];
  return <>
    <ResourceHeading eyebrow="ADMINISTRACIÓN" title="Pedidos" detail="Filtra, consulta y administra el ciclo de cada pedido." action={<RefreshButton onClick={resource.refresh} />} />
    <div className="mb-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
      <input aria-label="Fecha inicial" type="date" value={filters.fecha_inicio} onChange={(event) => setFilters({ ...filters, fecha_inicio: event.target.value })} className="input" />
      <input aria-label="Fecha final" type="date" value={filters.fecha_fin} onChange={(event) => setFilters({ ...filters, fecha_fin: event.target.value })} className="input" />
      <select aria-label="Estado" value={filters.estado} onChange={(event) => setFilters({ ...filters, estado: event.target.value })} className="input"><option value="">Todos los estados</option>{statuses.map((status) => <option key={status}>{status}</option>)}</select>
      <select aria-label="Zona" value={filters.zona_id} onChange={(event) => setFilters({ ...filters, zona_id: event.target.value })} className="input"><option value="">Todas las zonas</option>{zones.map((zone) => <option key={zone.zona_id} value={zone.zona_id}>{zone.nombre_zona}</option>)}</select>
    </div>
    <Alert message={error || resource.error} />
    <Table headers={["Pedido", "Cliente", "Zona", "Estado", "Total", "Acciones"]} empty="No hay pedidos para estos filtros." busy={resource.busy} rows={resource.data.map((row) => {
      const id = Number(row.pedido_id);
      return <tr key={id}><Cell><button onClick={() => void details(id)} className="font-bold text-[#3d5942]">#{id}</button><p className="mt-1 text-[10px] text-[#999d92]">{fieldString(row, "token_recoger")}</p></Cell><Cell>{fieldString(row, "cliente_nombre")}<p className="mt-1 text-[10px]">{fieldString(row, "cliente_email")}</p></Cell><Cell>{fieldString(row, "zona_nombre")}</Cell><Cell><select aria-label={`Estado pedido ${id}`} value={String(row.estado ?? "")} onChange={(event) => void act(id, () => api.updateOrderStatus(id, event.target.value))} className="max-w-40 rounded-md border border-[#e8e9e1] bg-white px-2 py-1.5 text-[10px]">{statuses.map((status) => <option key={status}>{status}</option>)}</select></Cell><Cell className="font-bold text-[#405d45]">{fieldString(row, "total_pedido")}</Cell><Cell><div className="flex items-center gap-1"><ActionButton label="Ver detalle" onClick={() => void details(id)} /><select aria-label={`Repartidor pedido ${id}`} defaultValue="" onChange={(event) => { if (event.target.value) void act(id, () => api.reassignDelivery(id, Number(event.target.value))); }} className="max-w-28 rounded-md border border-[#e8e9e1] bg-white px-2 py-1.5 text-[10px]"><option value="">Repartidor</option>{deliveries.map((employee) => <option key={String(employee.usuario_id)} value={Number(employee.usuario_id)}>{String(employee.nombre_completo)}</option>)}</select>{row.estado === "Pendiente" && <button onClick={() => void act(id, () => api.confirmOrder(id))} className="rounded-md bg-[#edf1ea] px-2 py-1.5 text-[10px] font-bold text-[#46634a]">Confirmar</button>}{row.estado !== "Cancelado" && row.estado !== "Entregado" && <ActionButton label="Cancelar pedido" danger onClick={() => { if (window.confirm(`¿Cancelar el pedido #${id}?`)) void act(id, () => api.cancelAdminOrder(id)); }} />}</div></Cell></tr>;
    })} />
    {selected && <RecordModal title={`Detalle del pedido #${String(selected.pedido_id ?? "")}`} record={selected} onClose={() => setSelected(null)} />}
  </>;
}

function MenusAdmin() {
  const [filters, setFilters] = useState({ fecha_inicio: "", fecha_fin: "", publicado: "" });
  const [dishes, setDishes] = useState<Row[]>([]);
  const [editing, setEditing] = useState<Menu | null>(null);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");
  const load = useCallback(() => api.adminMenus({
    fecha_inicio: filters.fecha_inicio || undefined, fecha_fin: filters.fecha_fin || undefined,
    publicado: filters.publicado === "" ? undefined : filters.publicado === "true",
  }), [filters]);
  const resource = useResource(load, [] as Menu[]);
  useEffect(() => { api.adminDishes().then(setDishes).catch((reason) => setError(reason instanceof Error ? reason.message : "No se pudieron cargar los platos.")); }, []);
  async function remove(menu: Menu) {
    if (!window.confirm(`¿Eliminar el menú del ${menu.fecha}?`)) return;
    try { await api.deleteMenu(menu.menu_dia_id); await resource.refresh(); }
    catch (reason) { setError(reason instanceof Error ? reason.message : "No se pudo eliminar el menú."); }
  }
  return <>
    <ResourceHeading eyebrow="CATÁLOGO" title="Menús del día" detail="Publica menús y administra fechas, stock y precio." action={<div className="flex gap-2"><RefreshButton onClick={resource.refresh} /><button onClick={() => setCreating(true)} className="flex items-center gap-2 rounded-lg bg-[#405d45] px-3 py-2 text-xs font-bold text-white"><Plus size={15} />Crear menú</button></div>} />
    <div className="mb-4 grid gap-2 sm:grid-cols-3"><input type="date" aria-label="Fecha inicial" className="input" value={filters.fecha_inicio} onChange={(event) => setFilters({ ...filters, fecha_inicio: event.target.value })} /><input type="date" aria-label="Fecha final" className="input" value={filters.fecha_fin} onChange={(event) => setFilters({ ...filters, fecha_fin: event.target.value })} /><select className="input" aria-label="Filtrar publicados" value={filters.publicado} onChange={(event) => setFilters({ ...filters, publicado: event.target.value })}><option value="">Todos</option><option value="true">Publicados</option><option value="false">Borradores</option></select></div>
    <Alert message={error || resource.error} />
    <Table headers={["Fecha", "Plato principal", "Stock", "Precio", "Publicado", "Acciones"]} empty="No hay menús con estos filtros." busy={resource.busy} rows={resource.data.map((menu) => <tr key={menu.menu_dia_id}><Cell className="font-semibold">{menu.fecha}</Cell><Cell>{fieldString(menu as unknown as Row, "plato_principal_id")}</Cell><Cell>{menu.cantidad_disponible}</Cell><Cell className="font-bold text-[#405d45]">{menu.precio_menu}</Cell><Cell><span className={menu.publicado ? "text-[#557858]" : "text-[#989b91]"}>{menu.publicado ? "Publicado" : "Borrador"}</span></Cell><Cell><div className="flex gap-1"><ActionButton label="Editar menú" onClick={() => setEditing(menu)} /><button onClick={() => void remove(menu)} aria-label="Eliminar menú" className="rounded-lg p-2 text-red-600 hover:bg-red-50"><Trash2 size={15} /></button></div></Cell></tr>)} />
    {(creating || editing) && <MenuForm menu={editing} dishes={dishes} onClose={() => { setCreating(false); setEditing(null); }} onSave={async (data) => {
      if (editing) await api.updateMenu(editing.menu_dia_id, data);
      else await api.createMenu(data as MenuInput);
      setCreating(false); setEditing(null); await resource.refresh();
    }} />}
  </>;
}

function MenuForm({ menu, dishes, onClose, onSave }: { menu: Menu | null; dishes: Row[]; onClose: () => void; onSave: (data: Partial<MenuInput>) => Promise<void> }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setBusy(true);
    try {
      if (menu) await onSave({
        cantidad_disponible: Number(form.get("stock")), precio_menu: Number(form.get("price")),
        imagen_url: String(form.get("image") || "") || null, publicado: form.get("published") === "on",
      });
      else await onSave({
        fecha: String(form.get("date")), plato_principal_id: Number(form.get("main")),
        bebida_id: form.get("drink") ? Number(form.get("drink")) : null,
        postre_id: form.get("dessert") ? Number(form.get("dessert")) : null,
        info_nutricional: String(form.get("nutrition") || "") || null,
        imagen_url: String(form.get("image") || "") || null,
        cantidad_disponible: Number(form.get("stock")), precio_menu: Number(form.get("price")),
        publicado: form.get("published") === "on",
      });
    } catch (reason) { setError(reason instanceof Error ? reason.message : "No se pudo guardar el menú."); }
    finally { setBusy(false); }
  }
  const mains = dishes.filter((dish) => dish.tipo === "Principal");
  const drinks = dishes.filter((dish) => dish.tipo === "Bebida");
  const desserts = dishes.filter((dish) => dish.tipo === "Postre");
  return <Modal title={menu ? "Editar menú" : "Crear menú"} onClose={onClose}><form onSubmit={submit} className="space-y-3">
    {menu ? <p className="rounded-lg bg-[#f3f5ef] p-3 text-xs text-[#697264]">Menú del {menu.fecha}; la API solo permite editar stock, precio, imagen y publicación.</p> : <>
      <FormField label="Fecha"><input required type="date" name="date" min={today()} defaultValue={today()} className="input" /></FormField>
      <FormField label="Plato principal"><DishSelect name="main" dishes={mains} required /></FormField>
      <FormField label="Bebida (opcional)"><DishSelect name="drink" dishes={drinks} /></FormField>
      <FormField label="Postre (opcional)"><DishSelect name="dessert" dishes={desserts} /></FormField>
      <FormField label="Información nutricional"><input name="nutrition" maxLength={500} className="input" /></FormField>
    </>}
    <div className="grid grid-cols-2 gap-3"><FormField label="Stock"><input name="stock" type="number" min={0} required defaultValue={menu?.cantidad_disponible ?? 50} className="input" /></FormField><FormField label="Precio"><input name="price" type="number" min={0.01} step="0.01" required defaultValue={menu?.precio_menu ?? ""} className="input" /></FormField></div>
    <ImageField defaultValue={menu?.imagen_url ?? ""} />
    <label className="flex items-center gap-2 text-xs text-[#596054]"><input name="published" type="checkbox" defaultChecked={menu?.publicado ?? false} /> Publicar menú para los clientes</label>
    <Alert message={error} /><Submit busy={busy} label="Guardar menú" />
  </form></Modal>;
}

function DishSelect({ name, dishes, required }: { name: string; dishes: Row[]; required?: boolean }) {
  return <select name={name} required={required} defaultValue="" className="input"><option value="">Seleccionar plato</option>{dishes.map((dish) => <option key={String(dish.plato_id)} value={Number(dish.plato_id)}>{String(dish.nombre)}</option>)}</select>;
}

function DishesAdmin() {
  const [ingredients, setIngredients] = useState<Row[]>([]);
  const [editing, setEditing] = useState<Row | null>(null);
  const [create, setCreate] = useState(false);
  const [error, setError] = useState("");
  const load = useCallback(() => api.adminDishes(), []);
  const resource = useResource(load, [] as Row[]);
  useEffect(() => { api.ingredients().then(setIngredients).catch((reason) => setError(reason instanceof Error ? reason.message : "No se pudieron cargar los ingredientes.")); }, []);
  async function editDish(row: Row) {
    try { setEditing(await api.dishDetail(Number(row.plato_id))); }
    catch (reason) { setError(reason instanceof Error ? reason.message : "No se pudo consultar el plato."); }
  }
  async function remove(row: Row) {
    if (!window.confirm(`¿Eliminar el plato ${String(row.nombre)}?`)) return;
    try { await api.deleteDish(Number(row.plato_id)); await resource.refresh(); }
    catch (reason) { setError(reason instanceof Error ? reason.message : "No se pudo eliminar el plato."); }
  }
  return <>
    <ResourceHeading eyebrow="CATÁLOGO" title="Platos" detail="Gestiona preparaciones, imágenes e ingredientes." action={<div className="flex gap-2"><RefreshButton onClick={resource.refresh} /><button onClick={() => setCreate(true)} className="flex items-center gap-2 rounded-lg bg-[#405d45] px-3 py-2 text-xs font-bold text-white"><Plus size={15} />Añadir plato</button></div>} />
    <Alert message={error || resource.error} />
    <Table headers={["Plato", "Tipo", "Descripción", "Ingredientes", "Acciones"]} empty="Todavía no hay platos." busy={resource.busy} rows={resource.data.map((row) => <tr key={String(row.plato_id)}><Cell className="font-semibold">{fieldString(row, "nombre")}</Cell><Cell>{fieldString(row, "tipo")}</Cell><Cell className="max-w-56 truncate">{fieldString(row, "descripcion")}</Cell><Cell>{Array.isArray(row.ingredientes) ? row.ingredientes.length : 0}</Cell><Cell><div className="flex gap-1"><ActionButton label="Editar plato" onClick={() => void editDish(row)} /><button onClick={() => void remove(row)} aria-label="Eliminar plato" className="rounded-lg p-2 text-red-600 hover:bg-red-50"><Trash2 size={15} /></button></div></Cell></tr>)} />
    {(create || editing) && <DishForm dish={editing} ingredients={ingredients} onClose={() => { setCreate(false); setEditing(null); }} onSave={async (data) => {
      if (editing) await api.updateDish(Number(editing.plato_id), data);
      else await api.createDish(data);
      setCreate(false); setEditing(null); await resource.refresh();
    }} />}
  </>;
}

function DishForm({ dish, ingredients, onClose, onSave }: { dish: Row | null; ingredients: Row[]; onClose: () => void; onSave: (data: DishInput) => Promise<void> }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const selectedIds = useMemo(() => new Set(Array.isArray(dish?.ingredientes) ? dish.ingredientes.map((item) => Number((item as Row).ingrediente_id)) : []), [dish]);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const data: DishInput = {
      nombre: String(form.get("name")), descripcion: String(form.get("description") || "") || null,
      tipo: String(form.get("type")), imagen_url: String(form.get("image") || "") || null,
      ingredientes: form.getAll("ingredient").map((id) => ({ ingrediente_id: Number(id) })),
    };
    setBusy(true);
    try { await onSave(data); }
    catch (reason) { setError(reason instanceof Error ? reason.message : "No se pudo guardar el plato."); }
    finally { setBusy(false); }
  }
  return <Modal title={dish ? "Editar plato" : "Nuevo plato"} onClose={onClose}><form onSubmit={submit} className="space-y-3">
    <FormField label="Nombre"><input required maxLength={100} name="name" defaultValue={String(dish?.nombre ?? "")} className="input" /></FormField>
    <FormField label="Tipo"><select name="type" defaultValue={String(dish?.tipo ?? "Principal")} className="input">{["Principal", "Acompanamiento", "Bebida", "Postre"].map((item) => <option key={item}>{item}</option>)}</select></FormField>
    <FormField label="Descripción"><textarea name="description" maxLength={500} rows={2} defaultValue={String(dish?.descripcion ?? "")} className="input resize-y" /></FormField>
    <ImageField defaultValue={String(dish?.imagen_url ?? "")} />
    <fieldset><legend className="mb-2 text-xs font-semibold text-[#484c43]">Ingredientes</legend><div className="grid max-h-32 grid-cols-2 gap-2 overflow-auto rounded-lg border border-[#e8e9e1] p-3">{ingredients.map((item) => <label key={String(item.ingrediente_id)} className="flex items-center gap-2 text-[11px] text-[#596054]"><input type="checkbox" name="ingredient" value={Number(item.ingrediente_id)} defaultChecked={selectedIds.has(Number(item.ingrediente_id))} />{String(item.nombre)}</label>)}</div></fieldset>
    <Alert message={error} /><Submit busy={busy} label="Guardar plato" />
  </form></Modal>;
}

function IngredientsAdmin() {
  const [editing, setEditing] = useState<Row | null>(null);
  const [create, setCreate] = useState(false);
  const [error, setError] = useState("");
  const resource = useResource(useCallback(() => api.ingredients(), []), [] as Row[]);
  async function editIngredient(row: Row) {
    try { setEditing(await api.ingredientDetail(Number(row.ingrediente_id))); }
    catch (reason) { setError(reason instanceof Error ? reason.message : "No se pudo consultar el ingrediente."); }
  }
  return <>
    <ResourceHeading eyebrow="INVENTARIO" title="Ingredientes" detail="Controla existencias y componentes usados en los platos." action={<div className="flex gap-2"><RefreshButton onClick={resource.refresh} /><button onClick={() => setCreate(true)} className="flex items-center gap-2 rounded-lg bg-[#405d45] px-3 py-2 text-xs font-bold text-white"><Plus size={15} />Añadir</button></div>} />
    <Alert message={error || resource.error} />
    <Table headers={["Ingrediente", "Stock actual", "Acciones"]} empty="No hay ingredientes registrados." busy={resource.busy} rows={resource.data.map((row) => <tr key={String(row.ingrediente_id)}><Cell className="font-semibold">{fieldString(row, "nombre")}</Cell><Cell>{fieldString(row, "stock_actual")}</Cell><Cell><ActionButton label="Editar ingrediente" onClick={() => void editIngredient(row)} /></Cell></tr>)} />
    {(create || editing) && <Modal title={editing ? "Editar ingrediente" : "Nuevo ingrediente"} onClose={() => { setCreate(false); setEditing(null); }}><SimpleForm error="" onSubmit={async (form) => {
      const data = { nombre: String(form.get("name")), stock_actual: Number(form.get("stock")) };
      if (editing) await api.updateIngredient(Number(editing.ingrediente_id), data); else await api.createIngredient(data);
      setCreate(false); setEditing(null); await resource.refresh();
    }} fields={<><FormField label="Nombre"><input name="name" required maxLength={100} defaultValue={String(editing?.nombre ?? "")} className="input" /></FormField><FormField label="Stock"><input name="stock" type="number" min={0} step="any" defaultValue={String(editing?.stock_actual ?? 0)} className="input" /></FormField></>} /></Modal>}
  </>;
}

function EmployeesAdmin() {
  const [roles, setRoles] = useState<Row[]>([]);
  const [zones, setZones] = useState<Zone[]>([]);
  const [editing, setEditing] = useState<Row | null>(null);
  const [create, setCreate] = useState(false);
  const [error, setError] = useState("");
  const resource = useResource(useCallback(() => api.employees(), []), [] as Row[]);
  useEffect(() => {
    Promise.all([api.roles(), api.adminZones()]).then(([r, z]) => { setRoles(r); setZones(z); }).catch((reason) => setError(reason instanceof Error ? reason.message : "No se pudieron cargar roles y zonas."));
  }, []);
  async function deactivate(row: Row) {
    if (!window.confirm(`¿Desactivar a ${String(row.nombre_completo)}?`)) return;
    try { await api.deactivateEmployee(Number(row.usuario_id)); await resource.refresh(); }
    catch (reason) { setError(reason instanceof Error ? reason.message : "No se pudo desactivar el empleado."); }
  }
  return <>
    <ResourceHeading eyebrow="EQUIPO" title="Empleados" detail="Administra roles, cuentas de trabajo y zonas de reparto." action={<div className="flex gap-2"><RefreshButton onClick={resource.refresh} /><button onClick={() => setCreate(true)} className="flex items-center gap-2 rounded-lg bg-[#405d45] px-3 py-2 text-xs font-bold text-white"><Plus size={15} />Añadir empleado</button></div>} />
    <Alert message={error || resource.error} />
    <Table headers={["Nombre", "Correo", "Rol", "Zona asignada", "Acciones"]} empty="No hay empleados registrados." busy={resource.busy} rows={resource.data.map((row) => {
      const id = Number(row.usuario_id);
      return <tr key={id}><Cell className="font-semibold">{fieldString(row, "nombre_completo")}</Cell><Cell>{fieldString(row, "email")}</Cell><Cell>{fieldString(row, "rol_nombre")}</Cell><Cell>{fieldString(row, "zona_nombre")}</Cell><Cell><div className="flex items-center gap-1"><ActionButton label="Editar empleado" onClick={() => setEditing(row)} /><select aria-label={`Asignar zona a ${String(row.nombre_completo)}`} defaultValue="" onChange={(event) => { if (event.target.value) api.assignDeliveryZone(id, Number(event.target.value)).then(resource.refresh).catch((reason) => setError(reason instanceof Error ? reason.message : "No se pudo asignar la zona.")); }} className="max-w-28 rounded-md border border-[#e8e9e1] bg-white px-2 py-1.5 text-[10px]"><option value="">Asignar zona</option>{zones.map((zone) => <option key={zone.zona_id} value={zone.zona_id}>{zone.nombre_zona}</option>)}</select><button aria-label="Desactivar empleado" onClick={() => void deactivate(row)} className="rounded-lg p-2 text-red-600 hover:bg-red-50"><Trash2 size={15} /></button></div></Cell></tr>;
    })} />
    {(create || editing) && <EmployeeForm employee={editing} roles={roles} zones={zones} onClose={() => { setCreate(false); setEditing(null); }} onSave={async (data) => {
      if (editing) await api.updateEmployee(Number(editing.usuario_id), data); else await api.createEmployee(data);
      setCreate(false); setEditing(null); await resource.refresh();
    }} />}
  </>;
}

function EmployeeForm({ employee, roles, zones, onClose, onSave }: { employee: Row | null; roles: Row[]; zones: Zone[]; onClose: () => void; onSave: (data: EmployeeInput) => Promise<void> }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setBusy(true);
    try { await onSave({
      nombre_completo: String(form.get("name")), email: String(form.get("email")),
      password: String(form.get("password")), telefono: String(form.get("phone") || "") || null,
      rol_id: Number(form.get("role")), zona_reparto_id: form.get("zone") ? Number(form.get("zone")) : null,
    }); } catch (reason) { setError(reason instanceof Error ? reason.message : "No se pudo guardar el empleado."); }
    finally { setBusy(false); }
  }
  return <Modal title={employee ? "Editar empleado" : "Nuevo empleado"} onClose={onClose}><form onSubmit={submit} className="space-y-3">
    <FormField label="Nombre completo"><input name="name" required maxLength={100} defaultValue={String(employee?.nombre_completo ?? "")} className="input" /></FormField>
    <FormField label="Correo"><input name="email" required type="email" defaultValue={String(employee?.email ?? "")} className="input" /></FormField>
    <FormField label={employee ? "Contraseña nueva (para actualizar cuenta)" : "Contraseña"}><input name="password" required minLength={6} type="password" className="input" /></FormField>
    <FormField label="Teléfono"><input name="phone" maxLength={20} defaultValue={String(employee?.telefono ?? "")} className="input" /></FormField>
    <div className="grid grid-cols-2 gap-3"><FormField label="Rol"><select name="role" required defaultValue={String(employee?.rol_id ?? "")} className="input"><option value="">Seleccionar</option>{roles.map((role) => <option key={String(role.rol_id)} value={Number(role.rol_id)}>{String(role.nombre_rol)}</option>)}</select></FormField><FormField label="Zona (reparto)"><select name="zone" defaultValue={String(employee?.zona_reparto_id ?? "")} className="input"><option value="">Sin zona</option>{zones.map((zone) => <option key={zone.zona_id} value={zone.zona_id}>{zone.nombre_zona}</option>)}</select></FormField></div>
    <Alert message={error} /><Submit busy={busy} label="Guardar empleado" />
  </form></Modal>;
}

function ClientsAdmin() {
  const [selected, setSelected] = useState<{ name: string; orders: Row[] } | null>(null);
  const [error, setError] = useState("");
  const resource = useResource(useCallback(() => api.clients(), []), [] as Row[]);
  async function history(client: Row) {
    try { setSelected({ name: fieldString(client, "nombre_completo"), orders: await api.clientHistory(Number(client.usuario_id)) }); }
    catch (reason) { setError(reason instanceof Error ? reason.message : "No se pudo cargar el historial del cliente."); }
  }
  return <>
    <ResourceHeading eyebrow="CLIENTES" title="Clientes" detail="Consulta perfiles y el historial de compras." action={<RefreshButton onClick={resource.refresh} />} />
    <Alert message={error || resource.error} />
    <Table headers={["Nombre", "Correo", "Teléfono", "Registro", "Historial"]} empty="No hay clientes registrados." busy={resource.busy} rows={resource.data.map((row) => <tr key={String(row.usuario_id)}><Cell className="font-semibold">{fieldString(row, "nombre_completo")}</Cell><Cell>{fieldString(row, "email")}</Cell><Cell>{fieldString(row, "telefono")}</Cell><Cell>{fieldString(row, "fecha_registro")}</Cell><Cell><button onClick={() => void history(row)} className="inline-flex items-center gap-1 rounded-lg bg-[#edf1ea] px-2.5 py-1.5 text-[10px] font-bold text-[#46634a]"><BookOpen size={13} />Ver pedidos</button></Cell></tr>)} />
    {selected && <Modal title={`Historial · ${selected.name}`} onClose={() => setSelected(null)}>
      <div className="max-h-96 space-y-2 overflow-auto">
        {selected.orders.map((order, index) => <div key={String(order.pedido_id ?? index)} className="flex items-center justify-between rounded-lg bg-[#f4f5f0] p-3 text-xs">
          <div><p className="font-bold text-[#3d4639]">Pedido #{fieldString(order, "pedido_id")} · {fieldString(order, "estado")}</p><p className="mt-1 text-[#8a8f84]">{fieldString(order, "fecha_pedido")}</p></div>
          <span className="font-bold text-[#405d45]">{fieldString(order, "total_pedido")}</span>
        </div>)}
        {!selected.orders.length && <p className="py-8 text-center text-sm text-[#92958a]">Sin pedidos registrados.</p>}
      </div>
    </Modal>}
  </>;
}

function ZonesAdmin() {
  const [editing, setEditing] = useState<Zone | null>(null);
  const [create, setCreate] = useState(false);
  const [error, setError] = useState("");
  const resource = useResource(useCallback(() => api.adminZones(), []), [] as Zone[]);
  async function editZone(zone: Zone) {
    try { setEditing(await api.zoneDetail(zone.zona_id)); }
    catch (reason) { setError(reason instanceof Error ? reason.message : "No se pudo consultar la zona."); }
  }
  async function remove(zone: Zone) {
    if (!window.confirm(`¿Eliminar la zona ${zone.nombre_zona}?`)) return;
    try { await api.deleteZone(zone.zona_id); await resource.refresh(); }
    catch (reason) { setError(reason instanceof Error ? reason.message : "No se pudo eliminar la zona."); }
  }
  return <>
    <ResourceHeading eyebrow="LOGÍSTICA" title="Zonas de reparto" detail="Zonas disponibles para los pedidos y asignaciones." action={<div className="flex gap-2"><RefreshButton onClick={resource.refresh} /><button onClick={() => setCreate(true)} className="flex items-center gap-2 rounded-lg bg-[#405d45] px-3 py-2 text-xs font-bold text-white"><Plus size={15} />Nueva zona</button></div>} />
    <Alert message={error || resource.error} />
    <Table headers={["Zona", "Identificador", "Acciones"]} empty="No hay zonas configuradas." busy={resource.busy} rows={resource.data.map((zone) => <tr key={zone.zona_id}><Cell className="font-semibold">{zone.nombre_zona}</Cell><Cell>{zone.zona_id}</Cell><Cell><div className="flex gap-1"><ActionButton label="Editar zona" onClick={() => void editZone(zone)} /><button onClick={() => void remove(zone)} aria-label="Eliminar zona" className="rounded-lg p-2 text-red-600 hover:bg-red-50"><Trash2 size={15} /></button></div></Cell></tr>)} />
    {(create || editing) && <Modal title={editing ? "Editar zona" : "Nueva zona"} onClose={() => { setCreate(false); setEditing(null); }}><SimpleForm onSubmit={async (form) => {
      const name = String(form.get("name"));
      if (editing) await api.updateZone(editing.zona_id, name); else await api.createZone(name);
      setEditing(null); setCreate(false); await resource.refresh();
    }} fields={<FormField label="Nombre de la zona"><input name="name" required maxLength={100} defaultValue={editing?.nombre_zona ?? ""} className="input" /></FormField>} /></Modal>}
  </>;
}

function ReportsAdmin() {
  const [date, setDate] = useState(today());
  const [report, setReport] = useState<Row | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(true);
  const load = useCallback(async () => {
    setBusy(true); setError("");
    try { setReport(await api.adminKpis(date)); }
    catch (reason) { setError(reason instanceof Error ? reason.message : "No se pudo cargar el reporte."); }
    finally { setBusy(false); }
  }, [date]);
  useEffect(() => { void load(); }, [load]);
  const states = report?.pedidos_por_estado as Record<string, number> | undefined;
  const payment = report?.ventas_por_metodo_pago as Record<string, number> | undefined;
  return <>
    <ResourceHeading eyebrow="ANÁLISIS" title="Reportes y KPI" detail="Ventas, estados y tiempos operativos por fecha." action={<div className="flex gap-2"><input aria-label="Fecha del reporte" type="date" value={date} onChange={(event) => setDate(event.target.value)} className="input" /><RefreshButton onClick={load} /></div>} />
    <Alert message={error} />
    {busy ? <Loading /> : report && <>
      <div className="mb-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4"><StatCard icon={<ClipboardList />} label="Pedidos" value={String(report.total_pedidos ?? 0)} /><StatCard icon={<CircleDollarSign />} label="Ventas totales" value={String(report.ventas_totales ?? "0")} /><StatCard icon={<Clock3 />} label="Preparación promedio" value={report.tiempo_promedio_preparacion == null ? "—" : `${report.tiempo_promedio_preparacion} min`} /><StatCard icon={<BadgeCheck />} label="Entrega promedio" value={report.tiempo_promedio_entrega == null ? "—" : `${report.tiempo_promedio_entrega} min`} /></div>
      <div className="grid gap-4 lg:grid-cols-2"><MetricList title="Pedidos por estado" values={states} /><MetricList title="Ventas por método de pago" values={payment} /></div>
    </>}
  </>;
}

function StatCard({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return <div className="rounded-xl border border-[#e9e9e1] bg-white p-4"><div className="mb-3 text-[#698167]">{icon}</div><p className="font-display text-2xl font-extrabold text-[#30362e]">{value}</p><p className="mt-1 text-xs text-[#8d9187]">{label}</p></div>;
}

function MetricList({ title, values }: { title: string; values?: Record<string, number> }) {
  return <section className="rounded-xl border border-[#e9e9e1] bg-white p-5"><h3 className="mb-3 font-display font-bold text-[#3e443b]">{title}</h3>{values && Object.keys(values).length ? Object.entries(values).map(([name, value]) => <div key={name} className="flex justify-between border-t border-[#f0f0eb] py-2.5 text-xs"><span className="text-[#74796f]">{name}</span><b className="text-[#405d45]">{value}</b></div>) : <p className="text-xs text-[#92958a]">Sin datos para esta fecha.</p>}</section>;
}

function SystemAdmin() {
  const [data, setData] = useState<Record<string, unknown>>({});
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(true);
  const load = useCallback(async () => {
    setBusy(true); setError("");
    const outcomes = await Promise.allSettled([api.serviceInfo(), api.health(), api.ping(), api.roles(), api.notificationCount()]);
    const keys = ["Servicio", "Salud", "Ping", "Roles", "Notificaciones"];
    const next: Record<string, unknown> = {};
    outcomes.forEach((result, index) => { next[keys[index]] = result.status === "fulfilled" ? result.value : { error: result.reason instanceof Error ? result.reason.message : "No disponible" }; });
    setData(next); setBusy(false);
  }, []);
  useEffect(() => { void load(); }, [load]);
  async function clearNotifications() {
    try { await api.clearOldNotifications(); await load(); }
    catch (reason) { setError(reason instanceof Error ? reason.message : "No se pudieron limpiar las notificaciones."); }
  }
  return <>
    <ResourceHeading eyebrow="SERVICIO" title="Estado de la plataforma" detail="Conectividad, roles disponibles y utilidades de servicio." action={<RefreshButton onClick={load} />} />
    <Alert message={error} />
    {busy ? <Loading /> : <div className="space-y-3">{Object.entries(data).map(([name, value]) => <details key={name} className="rounded-xl border border-[#e9e9e1] bg-white p-4"><summary className="cursor-pointer text-sm font-bold text-[#42483e]">{name}</summary><pre className="mt-3 overflow-auto rounded-lg bg-[#f5f6f2] p-3 text-[10px] leading-5 text-[#66705f]">{JSON.stringify(value, null, 2)}</pre></details>)}<button onClick={() => void clearNotifications()} className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-bold text-red-700">Limpiar notificaciones antiguas</button></div>}
  </>;
}

function FormField({ label, children }: { label: string; children: ReactNode }) {
  return <label className="block"><span className="mb-1.5 block text-xs font-semibold text-[#484c43]">{label}</span>{children}</label>;
}

function ImageField({ defaultValue = "" }: { defaultValue?: string }) {
  const [url, setUrl] = useState(defaultValue);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function upload(file?: File) {
    if (!file) return;
    setBusy(true); setError("");
    try {
      const result = await api.uploadImage(file);
      const imageUrl = result.url ?? result.image_url ?? result.secure_url;
      if (typeof imageUrl !== "string") throw new Error("La API no devolvió una URL de imagen.");
      setUrl(imageUrl);
    } catch (reason) { setError(reason instanceof Error ? reason.message : "No se pudo subir la imagen."); }
    finally { setBusy(false); }
  }
  return <FormField label="Imagen (URL o archivo)"><div className="flex gap-2"><input name="image" value={url} onChange={(event) => setUrl(event.target.value)} placeholder="https://..." className="input min-w-0 flex-1" /><label title="Subir imagen" className="flex shrink-0 cursor-pointer items-center justify-center rounded-lg border border-[#e5e6de] px-3 text-[#557159] hover:bg-[#edf1ea]"><ImagePlus size={17} /><input type="file" accept="image/*" className="hidden" onChange={(event) => void upload(event.target.files?.[0])} /></label></div>{busy && <span className="mt-1 text-[10px] text-[#65765d]">Subiendo imagen...</span>}{error && <span role="alert" className="mt-1 block text-[10px] text-red-600">{error}</span>}</FormField>;
}

function Submit({ busy, label }: { busy: boolean; label: string }) {
  return <button disabled={busy} className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#405d45] py-3 text-sm font-bold text-white disabled:opacity-50">{busy && <LoaderCircle size={15} className="animate-spin" />}{label}</button>;
}

function SimpleForm({ fields, onSubmit, error = "" }: { fields: ReactNode; onSubmit: (data: FormData) => Promise<void>; error?: string }) {
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState(error);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setFormError("");
    try { await onSubmit(new FormData(event.currentTarget)); }
    catch (reason) { setFormError(reason instanceof Error ? reason.message : "No se pudo guardar."); }
    finally { setBusy(false); }
  }
  return <form onSubmit={submit} className="space-y-3">{fields}<Alert message={formError} /><Submit busy={busy} label="Guardar" /></form>;
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  return <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-[#20281f]/45 p-4 backdrop-blur-[2px]" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}><div role="dialog" aria-modal="true" className="my-auto max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl"><div className="mb-5 flex items-center justify-between"><h3 className="font-display text-lg font-bold text-[#30362e]">{title}</h3><button aria-label="Cerrar" onClick={onClose} className="rounded-lg p-2 text-[#82877c] hover:bg-[#f1f2ed]"><X size={18} /></button></div>{children}</div></div>;
}

function RecordModal({ title, record, onClose }: { title: string; record: Row; onClose: () => void }) {
  return <Modal title={title} onClose={onClose}><pre className="max-h-[70vh] overflow-auto rounded-lg bg-[#f5f6f2] p-4 text-[11px] leading-5 text-[#626c5d]">{JSON.stringify(record, null, 2)}</pre></Modal>;
}

function Loading() {
  return <div className="flex min-h-36 items-center justify-center gap-2 text-xs text-[#858a80]"><LoaderCircle size={16} className="animate-spin" />Cargando reporte...</div>;
}
