import {
  createContext,
  useContext,
  useState,
  type ReactNode,
} from 'react';
import api from '../api/axios';

export type UserRole = 'customer' | 'restaurant_admin' | 'delivery_partner';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
}

interface AuthContextValue {
  user: AuthUser | null;
  token: string | null;
  login: (email: string, password: string, role: UserRole) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const TOKEN_KEY = 'token';
const USER_KEY = 'user';

function readStoredUser(): AuthUser | null {
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}

/**
 * DESIGN NOTES (AuthContext)
 * --------------------------
 * - We persist the JWT (never the password) so a browser refresh keeps the
 *   session without forcing another login.
 * - localStorage is convenient for a portfolio SPA and matches how the Axios
 *   interceptor reads the token, but it is readable by any XSS on the page.
 *   An httpOnly cookie would be safer for production; out of scope here while
 *   the API uses Authorization: Bearer headers.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(
    () => localStorage.getItem(TOKEN_KEY)
  );
  const [user, setUser] = useState<AuthUser | null>(() => readStoredUser());

  async function login(email: string, password: string, role: UserRole) {
    const { data } = await api.post<{ token: string; user: AuthUser }>(
      '/api/user/login',
      { email, password, role }
    );

    localStorage.setItem(TOKEN_KEY, data.token);
    localStorage.setItem(USER_KEY, JSON.stringify(data.user));
    setToken(data.token);
    setUser(data.user);
  }

  function logout() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setToken(null);
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
