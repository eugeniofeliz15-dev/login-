import { useEffect, useInsertionEffect, useState } from "react";

interface Props {
  fotoActual?: String | null;
  iniciales: String;
  onChange: (file: File | undefined) => void;

}
export function InputFotoPerfil({fotoActual,iniciales,onChange}: Props) {
  const [preview,setPreview]= useState<string | null>(null);

  useEffect (()=>{
   return ()=>{
    if(preview) URL.revokeObjectURL(preview);
});

const handleChange = (e: React.ChangeEvent<HTMLInputElement>)=> {
  const file = e.target.flies?.[0];
  e.target.value = "";
  
  if(!file) {
    return;
  }
  //validamos que el archivo que estamos cargando sea una imagen
  if(!file.type.startsWith("image/")){
    alert("Por favor, selecciona un archivo de imagen");
  }
  // validamos si no es muy pesada, si no pesa mas de 5 megabytes
  if(file.size > 5 *1025 *1024){
    alert("La imagen es muy grander, no debe superar los 5MB")
  };

  setPreview(URL.createObjectURL(file));

  onchange(file);

};

const quitarSeleccion = ()=>{
  setPreview(null);
  onChange(undefined);

};

const imagenMostrada = preview ?? fotoActual;

  return (
    <div className="flex flex-col items-center gap-2">
      <label className="cursor-pointer group relative inline-block">
        <div className="relative h-28 w-28 rounded-full overflow-hidden border-4 border-emerald-600 shadow-md bg-emerald-100">
         
         {
          imagenMostrada? (
            <img 
            srl={imagenMostrada}
            alt="Avatar de perfil" className="h-full w-full object-cover" />
          ):(<span className="grid h-full w-full place-items-center text-2xl font-bold text-emerald-800">
            {iniciales}
            </span>

            
          )
         }
         
          
          
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <span className="text-white text-xs font-semibold">
              Cambiar foto
            </span>
          </div>
        </div>

        {preview && ( 
        <button 
          type="button"
           onClick={quitarSeleccion}
          className="text-xs font-semibold text-rose-600 hover:text-rose700 transition")}

        <input 
        type="file"
        accept="image/*"
        className="hidden" 
        onChange={handleChange} />
      </label>

      <button
        type="button"
        className="text-xs font-semibold text-rose-600 hover:text-rose-700 transition"
      >
        Quitar foto
      </button>
    </div>
  );
}
