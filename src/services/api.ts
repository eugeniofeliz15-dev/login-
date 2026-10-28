import type {
  AuthResponse,
  DishInput,
  DeliveryOrder,
  EmployeeInput,
  KitchenOrder,
  Menu,
  MenuInput,
  Order,
  User,
  Zone,
} from "../types";
import axios, { type AxiosRequestConfig } from "axios";
import axiosInstance from "../lib/axios";

export { getToken, saveToken, clearToken } from "../lib/axios";

function queryString(params: Record<string, string | number | boolean | null | undefined>) {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") query.set(key, String(value));
  });
  const result = query.toString();
  return result ? `?${result}` : "";
}

async function request<T>(path: string, config: AxiosRequestConfig = {}): Promise<T> {
  try {
    const response = await axiosInstance.request<T>({ ...config, url: path });
    return response.data;
  } catch (error) {
    if (!axios.isAxiosError(error) || !error.response) throw error;

    const status = error.response.status;
    const body: unknown = error.response.data;
    const detail = typeof body === "object" && body !== null && "detail" in body
      ? body.detail
      : undefined;
    const message = typeof detail === "string"
      ? detail
      : Array.isArray(detail)
        ? detail.map((item) => typeof item === "object" && item !== null && "msg" in item ? String(item.msg) : "").filter(Boolean).join(". ")
        : `No se pudo completar la solicitud (${status}).`;
    throw new Error(message || `No se pudo completar la solicitud (${status}).`);
  }
}

const json = (method: string, body?: unknown): AxiosRequestConfig => ({
  method,
  ...(body === undefined ? {} : { data: body }),
});

export const api = {
  serviceInfo: () => request<Record<string, unknown>>("/"),
  health: () => request<Record<string, unknown>>("/health"),
  ping: () => request<Record<string, unknown>>("/ping"),
  login: (email: string, password: string) => request<AuthResponse>("/auth/login", json("POST", { email, password })),
  register: (data: { nombre_completo: string; email: string; password: string; telefono?: string }) =>
    request<AuthResponse>("/auth/register", json("POST", data)),
  profile: () => request<User>("/auth/perfil"),
  updateProfile: (data: { nombre_completo?: string; telefono?: string }) => request<User>("/auth/perfil", json("PATCH", data)),
  changePassword: (password_actual: string, password_nueva: string) =>
    request("/auth/cambiar-password", json("PATCH", { password_actual, password_nueva })),
  zones: () => request<Zone[]>("/catalogo/zonas"),
  menus: (params: { fecha_inicio?: string; fecha_fin?: string } = {}) =>
    request<Menu[]>(`/catalogo/menus${queryString(params)}`),
  todayMenu: () => request<Menu>("/catalogo/menu-hoy"),
  weeklyMenu: () => request<Menu[]>("/catalogo/menu-semanal"),
  menuByDate: (date: string) => request<Menu>(`/catalogo/menu/${encodeURIComponent(date)}`),
  menuIngredients: (id: number) => request<Record<string, unknown>>(`/catalogo/menu/${id}/ingredientes`),
  catalogDishes: () => request<Record<string, unknown>[]>("/catalogo/platos"),
  createOrder: (data: {
    zona_id: number;
    google_maps_link?: string;
    latitud?: number;
    longitud?: number;
    direccion_referencia?: string;
    metodo_pago: string;
    items: { menu_dia_id: number; cantidad: number; exclusiones?: number[] }[];
  }) => request("/pedidos/", json("POST", data)),
  myOrders: () => request<Order[]>("/pedidos/mis-pedidos"),
  trackOrder: (token: string) => request<Record<string, unknown>>(`/pedidos/${encodeURIComponent(token)}/track`),
  orderDetail: (id: number) => request<Record<string, unknown>>(`/pedidos/${id}/detalle`),
  cancelOrder: (id: number) => request(`/pedidos/${id}`, { method: "DELETE" }),
  kitchenOrders: () => request<KitchenOrder[]>("/cocina/pendientes"),
  updateKitchenOrder: (id: number, nuevo_estado: string) =>
    request(`/cocina/pedidos/${id}/estado`, json("PATCH", { nuevo_estado })),
  kitchenHistory: (fecha?: string) => request<KitchenOrder[]>(`/cocina/historial${queryString({ fecha })}`),
  kitchenStats: (fecha?: string) => request<Record<string, unknown>>(`/cocina/estadisticas${queryString({ fecha })}`),
  deliveryOrders: () => request<DeliveryOrder[]>("/delivery/mis-entregas"),
  takeDelivery: (id: number) => request(`/delivery/pedidos/${id}/tomar`, { method: "PATCH" }),
  finishDelivery: (id: number, confirmar_pago: boolean) =>
    request(`/delivery/pedidos/${id}/finalizar`, json("PATCH", { confirmar_pago })),
  adminMenus: (params: { fecha_inicio?: string; fecha_fin?: string; publicado?: boolean } = {}) =>
    request<Menu[]>(`/admin/menu${queryString(params)}`),
  createMenu: (data: MenuInput) => request("/admin/menu", json("POST", data)),
  updateMenu: (id: number, data: Partial<Pick<MenuInput, "cantidad_disponible" | "precio_menu" | "imagen_url" | "publicado">>) =>
    request(`/admin/menu/${id}`, json("PUT", data)),
  deleteMenu: (id: number) => request(`/admin/menu/${id}`, { method: "DELETE" }),
  adminDishes: () => request<Record<string, unknown>[]>("/admin/platos"),
  dishDetail: (id: number) => request<Record<string, unknown>>(`/admin/platos/${id}`),
  createDish: (data: DishInput) => request("/admin/platos", json("POST", data)),
  updateDish: (id: number, data: DishInput) => request(`/admin/platos/${id}`, json("PUT", data)),
  deleteDish: (id: number) => request(`/admin/platos/${id}`, { method: "DELETE" }),
  ingredients: () => request<Record<string, unknown>[]>("/admin/ingredientes"),
  ingredientDetail: (id: number) => request<Record<string, unknown>>(`/admin/ingredientes/${id}`),
  createIngredient: (data: { nombre: string; stock_actual?: number }) =>
    request("/admin/ingredientes", json("POST", data)),
  updateIngredient: (id: number, data: { nombre: string; stock_actual?: number }) =>
    request(`/admin/ingredientes/${id}`, json("PUT", data)),
  employees: () => request<Record<string, unknown>[]>("/admin/empleados"),
  createEmployee: (data: EmployeeInput) => request("/admin/empleados", json("POST", data)),
  updateEmployee: (id: number, data: EmployeeInput) => request(`/admin/empleados/${id}`, json("PUT", data)),
  assignDeliveryZone: (id: number, zona_reparto_id: number) =>
    request(`/admin/empleados/${id}/zona`, json("PATCH", { zona_reparto_id })),
  deactivateEmployee: (id: number) => request(`/admin/empleados/${id}`, { method: "DELETE" }),
  clients: () => request<Record<string, unknown>[]>("/admin/clientes"),
  clientHistory: (id: number) => request<Record<string, unknown>[]>(`/admin/clientes/${id}/historial`),
  adminOrders: (params: { fecha_inicio?: string; fecha_fin?: string; estado?: string; zona_id?: number } = {}) =>
    request<Record<string, unknown>[]>(`/admin/pedidos${queryString(params)}`),
  confirmOrder: (id: number) => request(`/admin/pedidos/${id}/confirmar`, { method: "PATCH" }),
  reassignDelivery: (id: number, nuevo_delivery_id: number) =>
    request(`/admin/pedidos/${id}/reasignar`, json("PATCH", { nuevo_delivery_id })),
  updateOrderStatus: (id: number, estado: string) =>
    request(`/admin/pedidos/${id}/estado`, json("PATCH", { estado })),
  adminKpis: (fecha?: string) => request<Record<string, unknown>>(`/admin/kpis${queryString({ fecha })}`),
  cancelAdminOrder: (id: number) => request(`/admin/pedidos/${id}/cancelar`, { method: "PATCH" }),
  adminOrderDetail: (id: number) => request<Record<string, unknown>>(`/admin/pedidos/${id}/detalle-completo`),
  adminZones: () => request<Zone[]>("/catalogo/zonas"),
  zoneDetail: (id: number) => request<Zone>(`/admin/zonas/${id}`),
  createZone: (nombre_zona: string) => request("/admin/zonas", json("POST", { nombre_zona })),
  updateZone: (id: number, nombre_zona: string) => request(`/admin/zonas/${id}`, json("PUT", { nombre_zona })),
  deleteZone: (id: number) => request(`/admin/zonas/${id}`, { method: "DELETE" }),
  notifications: (params: { desde_minutos?: number; tipo?: string; limit?: number } = {}) =>
    request<Record<string, unknown>[]>(`/notificaciones/mis-notificaciones${queryString(params)}`),
  notificationCount: (desde?: string) => request<Record<string, unknown>>(`/notificaciones/contador${queryString({ desde })}`),
  kitchenNotifications: (desde_minutos = 10) =>
    request<Record<string, unknown>[]>(`/notificaciones/cocina/nuevos-pedidos${queryString({ desde_minutos })}`),
  deliveryNotifications: (desde_minutos = 30) =>
    request<Record<string, unknown>[]>(`/notificaciones/delivery/mis-asignaciones${queryString({ desde_minutos })}`),
  notifyArrival: (id: number) => request(`/notificaciones/delivery/notificar-llegada/${id}`, { method: "POST" }),
  customerNotifications: (desde_minutos = 60) =>
    request<Record<string, unknown>[]>(`/notificaciones/cliente/mis-pedidos${queryString({ desde_minutos })}`),
  clearOldNotifications: () => request("/notificaciones/limpiar-antiguas", { method: "DELETE" }),
  roles: () => request<Record<string, unknown>[]>("/roles/"),
  uploadImage: (file: File) => {
    const form = new FormData();
    form.append("file", file);
    return request<Record<string, unknown>>("/upload/image", { method: "POST", data: form });
  },
};
