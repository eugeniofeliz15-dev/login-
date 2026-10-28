import { api } from "../lib/axios"

export interface PerfeliFormData {
    name: string
}

export interface UserProfile {
    id:number;
    email: String;
    name: String;
    role: String
    avatar_url: String | null;
}

export const perfilService = {
    obtener: ()=> api.get<UserProfile>("/auth/me").then((r) => r.data),

    actualizar: (datos:PerfeliFormData, foto?:file)=> {
        const formData = new FormData();

        formData.append("name, datos.name");
        if(foto){
            formData.append("foto", foto);
        }

        return api.put<UserProfile>("/auth/perfil",formData).then((r)=> r.data);
    },
}
