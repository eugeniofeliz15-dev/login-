export type Role = "cliente" | "cocina" | "delivery" | "admin";

export interface User {
  usuario_id: number;
  nombre_completo: string;
  email: string;
  telefono?: string | null;
  rol_id: number;
  nombre_rol?: string;
  usuarioAvatar?: string | null;
  rol?: Role;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  usuario_id: number;
  rol_id: number;
  nombre_completo: string;
  usuarioAvatar?: string | null;
  email: string;
}

export interface Dish {
  plato_id: number;
  nombre: string;
  descripcion?: string | null;
  imagen_url?: string | null;
  tipo: string;
}

export interface Menu {
  menu_dia_id: number;
  fecha: string;
  precio_menu: string;
  cantidad_disponible: number;
  publicado: boolean;
  info_nutricional?: string | null;
  imagen_url?: string | null;
  plato_principal: Dish;
  bebida?: Dish | null;
  postre?: Dish | null;
}

export interface Zone {
  zona_id: number;
  nombre_zona: string;
}

export interface Order {
  pedido_id: number;
  token_recoger: string;
  estado: string;
  total_pedido: string;
  metodo_pago: string;
  esta_pagado: boolean;
  fecha_pedido?: string | null;
  fecha_entrega?: string | null;
  items_count: number;
}

export interface KitchenItem {
  item_id: number;
  cantidad: number;
  menu_fecha: string;
  plato_principal: string;
  bebida: string;
  postre: string;
  exclusiones: string[];
}

export interface KitchenOrder {
  pedido_id: number;
  token_recoger: string;
  estado: string;
  fecha_pedido?: string | null;
  cliente_nombre: string;
  cliente_telefono?: string | null;
  items: KitchenItem[];
  minutos_desde_pedido?: number | null;
}

export interface DeliveryOrder {
  pedido_id: number;
  token_recoger: string;
  estado: string;
  cliente_nombre: string;
  cliente_telefono?: string | null;
  zona_nombre: string;
  direccion_referencia?: string | null;
  google_maps_link?: string | null;
  total_pedido: string;
  metodo_pago: string;
  esta_pagado: boolean;
  cantidad_items: number;
  minutos_desde_listo?: number | null;
}

export interface MenuInput {
  fecha: string;
  plato_principal_id: number;
  bebida_id?: number | null;
  postre_id?: number | null;
  info_nutricional?: string | null;
  imagen_url?: string | null;
  cantidad_disponible?: number;
  precio_menu: number;
  publicado?: boolean;
}

export interface DishInput {
  nombre: string;
  imagen_url?: string | null;
  descripcion?: string | null;
  tipo: string;
  ingredientes: { ingrediente_id: number }[];
}

export interface EmployeeInput {
  email: string;
  password: string;
  nombre_completo: string;
  telefono?: string | null;
  rol_id: number;
  zona_reparto_id?: number | null;
}
