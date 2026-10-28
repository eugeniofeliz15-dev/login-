import { useCallback, useEffect, useState } from 'react';
import { Bike, ChefHat, Clock3, LoaderCircle, LogOut, Menu as MenuIcon, PackageCheck, Salad, Settings2, ShoppingBag, Sparkles } from 'lucide-react';
import { api, clearToken, getToken, saveToken } from './services/api';
import type { Role, User } from './types';
import { Brand } from './components/Brand';
import AccountSettings from './components/AccountSettings';
import NotificationCenter from './components/NotificationCenter';
import { AuthScreen as AuthPage } from './pages/AuthPage';
import AdminPage from './pages/AdminPage';
import { CustomerMenu, CustomerOrders } from './pages/CustomerPage';
import { KitchenBoard, KitchenHistory } from './pages/KitchenPage';
import { DeliveryBoard } from './pages/DeliveryPage';

function roleFromId(id: number): Role {
  if (id === 1) return 'admin';
  if (id === 2) return 'cocina';
  if (id === 3) return 'delivery';
  return 'cliente';
}
export function App() {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(Boolean(getToken()));
  const [authMode, setAuthMode] = useState<"login" | "register">("login");

  const acceptSession = useCallback(async (token: string, fallback: User) => {
    saveToken(token);
    setUser({ ...fallback, rol: roleFromId(fallback.rol_id) });
    try {
      const profile = await api.profile();
      setUser({ ...profile, rol: roleFromId(profile.rol_id) });
    } catch (error) {
      clearToken();
      setUser(null);
      throw error;
    }
  }, []);

  useEffect(() => {
    if (!getToken()) return;
    api.profile()
      .then((profile) => setUser({ ...profile, rol: roleFromId(profile.rol_id) }))
      .catch(() => {
        clearToken();
        setUser(null);
      })
      .finally(() => setAuthLoading(false));
  }, []);

  const signOut = () => {
    clearToken();
    setUser(null);
  };

  if (authLoading) {
    return <div className="flex min-h-screen items-center justify-center bg-[#f7f7f2]"><LoaderCircle className="animate-spin text-[#46664b]" /></div>;
  }
  return user
    ? <Dashboard user={user} onSignOut={signOut} />
    : <AuthPage mode={authMode} setMode={setAuthMode} onSession={acceptSession} />;
}

export default App;

function Dashboard({ user, onSignOut }: { user: User; onSignOut: () => void }) {
  const role = user.rol ?? roleFromId(user.rol_id);
  const [section, setSection] = useState(role === "cliente" ? "menu" : "inicio");
  const [mobileNav, setMobileNav] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState(user);

  const nav = role === "cliente"
    ? [{ id: "menu", label: "Menú del día", icon: Salad }, { id: "orders", label: "Mis pedidos", icon: ShoppingBag }]
    : role === "cocina"
      ? [{ id: "inicio", label: "Cola de cocina", icon: ChefHat }, { id: "history", label: "Historial", icon: Clock3 }]
      : role === "delivery"
        ? [{ id: "inicio", label: "Entregas", icon: Bike }]
        : [{ id: "inicio", label: "Pedidos", icon: PackageCheck }];

  return (
    <div className="min-h-screen bg-[#f7f7f2]">
      <header className="sticky top-0 z-30 border-b border-[#eaeae2] bg-[#f7f7f2]/95 backdrop-blur">
        <div className="mx-auto flex h-[72px] max-w-[1440px] items-center justify-between px-5 sm:px-8 lg:px-12">
          <div className="flex items-center gap-8">
            <Brand />
            <div className="hidden h-8 w-px bg-[#e3e3da] md:block" />
            <p className="hidden text-sm font-medium text-[#92958a] md:block">{role === "cliente" ? "Tu cocina de todos los días" : roleLabel(role)}</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden text-right sm:block"><p className="text-sm font-bold text-[#33382f]">{currentUser.nombre_completo}</p><p className="text-[11px] capitalize text-[#8d9187]">{roleLabel(role)}</p></div>
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#e5e9df] text-sm font-bold text-[#405d45]">{currentUser.nombre_completo.slice(0, 1).toUpperCase()}</div>
            <NotificationCenter role={role} />
            <button title="Mi perfil y seguridad" onClick={() => setSettingsOpen(true)} className="rounded-lg p-2 text-[#878b80] transition hover:bg-[#ecece5] hover:text-[#405d45]"><Settings2 size={18} /></button>
            <button title="Cerrar sesión" onClick={onSignOut} className="ml-1 rounded-lg p-2 text-[#878b80] transition hover:bg-[#ecece5] hover:text-[#405d45]"><LogOut size={18} /></button>
            <button onClick={() => setMobileNav(!mobileNav)} className="rounded-lg p-2 text-[#60675d] md:hidden"><MenuIcon size={20} /></button>
          </div>
        </div>
      </header>

      <div className="mx-auto flex max-w-[1440px]">
        <aside className={`${mobileNav ? "fixed inset-x-0 top-[72px] z-20 block border-b bg-[#f7f7f2] p-4" : "hidden"} w-full shrink-0 border-[#eaeae2] md:sticky md:top-[72px] md:block md:h-[calc(100vh-72px)] md:w-[230px] md:border-r md:px-5 md:py-8 lg:w-[260px] lg:px-8`}>
          <p className="mb-4 hidden px-3 text-[10px] font-bold uppercase tracking-[.17em] text-[#a3a59b] md:block">TU ESPACIO</p>
          <nav className="flex gap-2 md:flex-col">
            {nav.map(({ id, label, icon: Icon }) => <button key={id} aria-current={section === id ? "page" : undefined} onClick={() => { setSection(id); setMobileNav(false); }} className={`relative flex items-center gap-3 rounded-xl px-3.5 py-3 text-left text-sm font-semibold transition-all duration-200 ${section === id ? "bg-[#405d45] text-white shadow-[0_6px_16px_-8px_rgba(53,78,58,.8)] ring-1 ring-[#354e3a]/20" : "text-[#737a70] hover:bg-[#e8ece4] hover:text-[#354e3a]"}`}>
              <Icon size={18} strokeWidth={1.9} />{label}{section === id && <span className="ml-auto rounded-full bg-white/20 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide">Activo</span>}
            </button>)}
          </nav>
          <div className="mt-auto hidden md:block">
            <div className="mt-14 rounded-2xl bg-[#e8ece4] p-4">
              <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-white text-[#567256]"><Sparkles size={17} /></div>
              <p className="font-display text-sm font-bold text-[#384a37]">Un buen día empieza aquí.</p>
              <p className="mt-1 text-xs leading-5 text-[#777f70]">Comida fresca, hecha con cariño para ti.</p>
            </div>
            <p className="mt-8 px-3 text-[11px] text-[#b3b4aa]">© 2026 Delinut</p>
          </div>
        </aside>
        <main key={section} className="min-w-0 flex-1 animate-rise px-5 py-8 sm:px-8 lg:px-12 lg:py-10">
          {role === "cliente" ? section === "orders"
            ? <CustomerOrders />
            : <CustomerMenu user={currentUser} />
            : role === "cocina"
              ? section === "history" ? <KitchenHistory /> : <KitchenBoard />
              : role === "delivery"
                ? <DeliveryBoard />
                : <AdminPage />}
        </main>
      </div>
      {settingsOpen && <AccountSettings user={currentUser} onClose={() => setSettingsOpen(false)} onUpdated={setCurrentUser} />}
    </div>
  );
}

function roleLabel(role: Role) {
  return { cliente: 'Cliente', cocina: 'Cocina', delivery: 'Reparto', admin: 'Administración' }[role];
}
