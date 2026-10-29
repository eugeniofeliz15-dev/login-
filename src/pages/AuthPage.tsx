import { useState, type FormEvent } from 'react';
import { ArrowRight, LoaderCircle, ShieldCheck, Sparkles } from 'lucide-react';
import { api } from '../services/api';
import type { User } from '../types';
import { Brand, Field } from '../components/Brand';
export function AuthScreen({
  mode, setMode, onSession,
}: {
  mode: "login" | "register";
  setMode: (mode: "login" | "register") => void;
  onSession: (token: string, user: User) => Promise<void>;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setBusy(true);
    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") ?? "");
    const password = String(form.get("password") ?? "");
    try {
      const result = mode === "login"
        ? await api.login(email, password)
        : await api.register({
          nombre_completo: String(form.get("name") ?? ""),
          email,
          password,
          telefono: String(form.get("phone") ?? "") || undefined,
        });
      await onSession(result.access_token, {
        usuario_id: result.usuario_id,
        nombre_completo: result.nombre_completo,
        email: result.email,
        rol_id: result.rol_id,
        usuarioAvatar: result.usuarioAvatar ?? null,
      });
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Ocurrió un error inesperado.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="grid min-h-screen bg-[#f7f7f2] lg:grid-cols-[1.05fr_.95fr]">
      <section className="relative hidden min-h-screen flex-col justify-between overflow-hidden bg-[#354e3a] px-12 py-10 text-white lg:flex xl:px-20">
        <div className="grain pointer-events-none absolute inset-0 opacity-30" />
        <div className="absolute -right-36 -top-32 h-[580px] w-[580px] rounded-full border border-white/10" />
        <div className="absolute -right-16 -top-12 h-[420px] w-[420px] rounded-full border border-white/10" />
        <Brand inverse />
        <div className="relative z-10 max-w-xl pb-8">
          <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-white/20 px-4 py-2 text-xs font-semibold tracking-wide text-[#dfe8db]">
            <Sparkles size={14} /> HECHO CON CARIÑO, CADA DÍA
          </div>
          <h1 className="font-display text-5xl font-semibold leading-[1.12] tracking-[-.045em] xl:text-6xl">
            Comer rico<br />también puede<br /><span className="font-serif font-normal italic text-[#dbb77b]">ser simple.</span>
          </h1>
          <p className="mt-6 max-w-sm text-base leading-7 text-white/70">Platos caseros, ingredientes frescos y un poquito de alegría en cada entrega.</p>
        </div>
        <div className="relative z-10 flex items-center justify-between border-t border-white/15 pt-5 text-xs text-white/55">
          <span>© 2026 Delinut</span>
          <span>Comida honesta, todos los días.</span>
        </div>
        <div className="absolute bottom-28 right-20 rotate-[-12deg] text-[170px] opacity-[.07]">✳</div>
      </section>

      <section className="flex min-h-screen items-center justify-center px-6 py-10 sm:px-12">
        <div className="w-full max-w-[420px] animate-rise">
          <div className="mb-12 lg:hidden"><Brand /></div>
          <div className="mb-9">
            <p className="mb-3 text-xs font-bold uppercase tracking-[.18em] text-[#789078]">{mode === "login" ? "QUÉ BUENO TENERTE DE VUELTA" : "UN BUEN COMIENZO"}</p>
            <h2 className="font-display text-3xl font-bold tracking-[-.04em] text-[#252a23]">{mode === "login" ? "Hola de nuevo" : "Crea tu cuenta"}</h2>
            <p className="mt-2 text-sm text-[#7d8178]">{mode === "login" ? "Ingresa tus datos para continuar." : "Regístrate y disfruta algo rico hoy."}</p>
          </div>

          <form onSubmit={submit} className="space-y-4">
            {mode === "register" && <>
              <Field label="Nombre completo"><input required minLength={2} maxLength={100} name="name" autoComplete="name" placeholder="Tu nombre" className="input" /></Field>
              <Field label="Teléfono (opcional)"><input name="phone" maxLength={20} autoComplete="tel" placeholder="+591 700 00000" className="input" /></Field>
            </>}
            <Field label="Correo electrónico"><input required type="email" name="email" autoComplete="email" placeholder="tu@correo.com" className="input" /></Field>
            <Field label="Contraseña"><input required minLength={6} maxLength={100} type="password" name="password" autoComplete={mode === "login" ? "current-password" : "new-password"} placeholder="Mínimo 6 caracteres" className="input" /></Field>
            {error && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
            <button disabled={busy} className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-[#405d45] px-5 py-3.5 text-sm font-bold text-white transition hover:bg-[#334b38] disabled:opacity-60">
              {busy ? <LoaderCircle size={17} className="animate-spin" /> : null}
              {mode === "login" ? "Iniciar sesión" : "Crear cuenta"}
              {!busy && <ArrowRight size={16} />}
            </button>
          </form>

          <div className="my-7 flex items-center gap-3 text-[11px] font-medium uppercase tracking-[.12em] text-[#aaa99f]">
            <span className="h-px flex-1 bg-[#e6e5dc]" /><span>O TAMBIÉN</span><span className="h-px flex-1 bg-[#e6e5dc]" />
          </div>
          <p className="text-center text-sm text-[#777a72]">
            {mode === "login" ? "¿Primera vez por aquí?" : "¿Ya tienes una cuenta?"}{" "}
            <button type="button" onClick={() => { setError(""); setMode(mode === "login" ? "register" : "login"); }} className="font-bold text-[#405d45] hover:underline">
              {mode === "login" ? "Regístrate" : "Inicia sesión"}
            </button>
          </p>
          <div className="mt-12 flex items-center justify-center gap-2 text-xs text-[#a2a399]"><ShieldCheck size={14} /> Tus datos están protegidos.</div>
        </div>
      </section>
    </main>
  );
}
