import { useCallback, useEffect, useState } from 'react';
import { LoaderCircle } from 'lucide-react';
import { api, clearToken, getToken, saveToken } from './services/api';
import type { Role, User } from './types';
import { AuthScreen as AuthPage } from './pages/AuthPage';
import DashboardPage from './pages/DashboardPage';

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
    ? <DashboardPage user={user} onSignOut={signOut} />
    : <AuthPage mode={authMode} setMode={setAuthMode} onSession={acceptSession} />;
}

export default App;
