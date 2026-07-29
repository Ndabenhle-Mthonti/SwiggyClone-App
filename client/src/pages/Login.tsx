import { useState, type FormEvent } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { isAxiosError } from 'axios';
import { useAuth, type UserRole } from '../context/AuthContext';
import './Login.css';

/**
 * DESIGN NOTES (Login)
 * --------------------
 * Role is sent with credentials because the backend stores customers, admins,
 * and partners in separate collections — one endpoint, role picks the model.
 * Shared /dashboard redirect for now; role-specific homes land in a later phase.
 */
export function Login() {
  const { login, token } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('customer');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (token) {
    return <Navigate to="/dashboard" replace />;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      await login(email, password, role);
      navigate('/dashboard', { replace: true });
    } catch (err) {
      if (isAxiosError(err)) {
        setError(err.response?.data?.message ?? 'Login failed');
      } else {
        setError('Login failed');
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="login-page">
      <form className="login-form" onSubmit={handleSubmit} noValidate>
        <h1 className="login-title">Swiggy Clone</h1>
        <p className="login-subtitle">Sign in to continue</p>

        <div className="login-field">
          <label htmlFor="email">Email</label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
        </div>

        <div className="login-field">
          <label htmlFor="password">Password</label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />
        </div>

        <div className="login-field">
          <label htmlFor="role">Role</label>
          <select
            id="role"
            name="role"
            value={role}
            onChange={(event) => setRole(event.target.value as UserRole)}
          >
            <option value="customer">Customer</option>
            <option value="restaurant_admin">Restaurant admin</option>
            <option value="delivery_partner">Delivery partner</option>
          </select>
        </div>

        {error ? <p className="login-error" role="alert">{error}</p> : null}

        <button className="login-submit" type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
    </main>
  );
}
