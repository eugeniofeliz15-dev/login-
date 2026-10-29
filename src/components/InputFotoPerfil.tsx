import { useEffect, useState, type ChangeEvent } from "react";

interface Props {
  fotoActual?: string | null;
  iniciales: string;
  onChange: (file: File | undefined) => void;
}

export function InputFotoPerfil({ fotoActual, iniciales, onChange }: Props) {
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!preview) return;
    return () => URL.revokeObjectURL(preview);
  }, [preview]);

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Por favor, selecciona un archivo de imagen.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("La imagen no debe superar los 5 MB.");
      return;
    }

    setError("");
    setPreview(URL.createObjectURL(file));
    onChange(file);
  }

  function removeSelection() {
    setPreview(null);
    onChange(undefined);
  }

  const image = preview ?? fotoActual;

  return (
    <div className="flex flex-col items-center gap-2">
      <label className="group relative inline-block cursor-pointer">
        <div className="relative h-28 w-28 overflow-hidden rounded-full border-4 border-emerald-600 bg-emerald-100 shadow-md">
          {image
            ? <img src={image} alt="Avatar de perfil" className="h-full w-full object-cover" />
            : <span className="grid h-full w-full place-items-center text-2xl font-bold text-emerald-800">{iniciales}</span>}
          <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
            <span className="text-xs font-semibold text-white">Cambiar foto</span>
          </div>
        </div>
        <input type="file" accept="image/*" className="hidden" onChange={handleChange} />
      </label>

      {image && (
        <button type="button" onClick={removeSelection} className="text-xs font-semibold text-rose-600 transition hover:text-rose-700">
          Quitar foto
        </button>
      )}
      {error && <p role="alert" className="text-xs text-rose-600">{error}</p>}
    </div>
  );
}
