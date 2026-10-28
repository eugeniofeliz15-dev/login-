import { useState, type FormEvent } from "react";
import { LoaderCircle, X } from "lucide-react";
import { api } from "../services/api";
import type { User } from "../types";

export default function AccountSettings({ user, onClose, onUpdated }: { user: User; onClose: () => void; onUpdated: (user: User) => void }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  async function updateProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true); setError(""); setNotice("");
    const form = new FormData(event.currentTarget);
    try {
      const updated = await api.updateProfile({
        nombre_completo: String(form.get("name")),
        telefono: String(form.get("phone") || ""),
      });
      onUpdated({ ...updated, rol: user.rol });
      setNotice("Perfil actualizado.");
    } catch (reason) { setError(reason instanceof Error ? reason.message : "No se pudo actualizar el perfil."); }
    finally { setBusy(false); }
  }

  async function changePassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true); setError(""); setNotice("");
    const form = new FormData(event.currentTarget);
    const nextPassword = String(form.get("newPassword"));
    if (nextPassword !== String(form.get("confirmPassword"))) {
      setError("Las contraseñas nuevas no coinciden.");
      setBusy(false);
      return;
    }
    try {
      await api.changePassword(String(form.get("currentPassword")), nextPassword);
      event.currentTarget.reset();
      setNotice("Contraseña actualizada.");
    } catch (reason) { setError(reason instanceof Error ? reason.message : "No se pudo cambiar la contraseña."); }
    finally { setBusy(false); }
  }

  return <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-[#20281f]/45 p-4 backdrop-blur-[2px]" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
    <div role="dialog" aria-modal="true" aria-labelledby="account-title" className="my-auto max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl">
      <div className="mb-5 flex items-center justify-between"><div><p className="text-[10px] font-bold uppercase tracking-[.16em] text-[#81917d]">CUENTA</p><h2 id="account-title" className="mt-1 font-display text-xl font-bold text-[#30362e]">Perfil y seguridad</h2></div><button aria-label="Cerrar" onClick={onClose} className="rounded-lg p-2 text-[#82877c] hover:bg-[#f1f2ed]"><X size={18} /></button></div>
      <form onSubmit={updateProfile} className="space-y-3">
        <label className="block"><span className="mb-1.5 block text-xs font-semibold text-[#484c43]">Nombre completo</span><input name="name" required minLength={2} maxLength={100} defaultValue={user.nombre_completo} className="input" /></label>
        <label className="block"><span className="mb-1.5 block text-xs font-semibold text-[#484c43]">Teléfono</span><input name="phone" maxLength={20} defaultValue={user.telefono ?? ""} className="input" /></label>
        <label className="block"><span className="mb-1.5 block text-xs font-semibold text-[#484c43]">Correo electrónico</span><input disabled value={user.email} className="input bg-[#f5f6f2] text-[#969a90]" /></label>
        <button disabled={busy} className="w-full rounded-xl bg-[#405d45] py-3 text-sm font-bold text-white disabled:opacity-50">{busy ? <LoaderCircle size={16} className="mx-auto animate-spin" /> : "Guardar perfil"}</button>
      </form>
      <div className="my-5 border-t border-[#eeeeea]" />
      <form onSubmit={changePassword} className="space-y-3">
        <p className="font-display text-sm font-bold text-[#444a40]">Cambiar contraseña</p>
        <label className="block"><span className="mb-1.5 block text-xs font-semibold text-[#484c43]">Contraseña actual</span><input name="currentPassword" required minLength={6} type="password" autoComplete="current-password" className="input" /></label>
        <div className="grid gap-3 sm:grid-cols-2"><label className="block"><span className="mb-1.5 block text-xs font-semibold text-[#484c43]">Nueva contraseña</span><input name="newPassword" required minLength={6} type="password" autoComplete="new-password" className="input" /></label><label className="block"><span className="mb-1.5 block text-xs font-semibold text-[#484c43]">Confirmar nueva</span><input name="confirmPassword" required minLength={6} type="password" autoComplete="new-password" className="input" /></label></div>
        <button disabled={busy} className="w-full rounded-xl border border-[#dfe5dc] bg-[#f4f6f1] py-3 text-sm font-bold text-[#46634a] disabled:opacity-50">{busy ? <LoaderCircle size={16} className="mx-auto animate-spin" /> : "Actualizar contraseña"}</button>
      </form>
      {error && <p role="alert" className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">{error}</p>}
      {notice && <p role="status" className="mt-3 rounded-lg bg-[#eff5eb] px-3 py-2 text-xs text-[#426149]">{notice}</p>}
    </div>
  </div>;
}
