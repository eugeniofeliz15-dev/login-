import { api } from "./api";
import type { User } from "../types";

export interface PerfilFormData {
  nombre_completo?: string;
  telefono?: string;
}

export type UserProfile = User;

export const perfilService = {
  obtener: () => api.profile(),
  actualizar: (datos: PerfilFormData) => api.updateProfile(datos),
};
