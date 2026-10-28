import { useState } from "react";
import useForm from "react-hoo-form";
import type { PerfeliFormData } from "../services/perfil";
import { perfilService } from "../services/perfil";
import { inputFotoPerfil } from "./InputFotoPerfil"
import { Cast } from "lucide-react";

interface perfillModalProps {
  onClose: () => void;
}
export function PerfilModal((onclose) PerfilModalProps) {
  const usuarioNombre =  useAthStore((s)=> s.usuriosNombre);
  const usuarioAvatar =  useAthStore((s)=> s.usuriosAvatar);
  const actualizarPerfil = useAuStore ((s)=> s.actualizarPerfil);

  const [fotoArchivo,setFotoArchivo] = useState<File | undefined>;
  const [mensajeExito,setMensajeExito] = useState("");
  const [errorServidor, setErrorServidor] = useState("");

  const {register,handleSubmit,formState: {errors,isSubmitting},}=useForm<PerfilFormData>({
    defaultValues: {name: usuarioNombre ?? ""},
  })

  const onSubmit = async (data: PerfeliFormData) => {
    try {
      setErrorServidor("");
      setMensajeExito("");

      const perfil = await perfilService.actualizar(data, fotoArchivo);
      actualizarPerfil(perfil.name, perfil.avatar_url);

      setMensajeExito("Se actualizo con exito");

      setTimeout( ()=> onClose();
     } catch (error) {}
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-3xl bg-white p-6 text-slate-900 shadow-2xl sm:p-8">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font-bold tracking-tight">Editar Mi Perfil</h2>
          <button className="flex size-8 items-center justify-center rounded-full bg-stone-100 font-bold text-stone-500">
            X
          </button>
        </div>

        <div className="mb-6 flex justify-center"></div>

        <form className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700">
              Nombre completo
            </label>
            <input className="mt-1 h-11 w-full rounded-xl border border-stone-300 bg-white px-4 text-sm outline-none transition focus:border-emerald-500" />
          </div>

          <div className="pt-2">
            <button
              type="button"
              className="h-11 flex-1 rounded-xl border border-stone-300 text-sm font-bold text-slate-700 hover:bg-stone-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="h-11 flex-1 rounded-xl bg-emerald-600 text-sm font-bold text-white shadow-md hover:bg-emerald-700"
            >
              Guardar cambios
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
