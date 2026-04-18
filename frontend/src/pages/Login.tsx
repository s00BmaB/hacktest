import { useState, FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(username, password);
      navigate('/dashboard');
    } catch {
      setError('Nieprawidłowy login lub hasło.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={s.page}>
      <div style={s.card}>
        <h1 style={s.title}>⚡ Logowanie</h1>
        <p style={s.sub}>Witaj z powrotem w Silesia Akkka</p>
        {error && <div style={s.error}>{error}</div>}
        <form onSubmit={handleSubmit} style={s.form}>
          <label style={s.label}>Login</label>
          <input style={s.input} value={username} onChange={e => setUsername(e.target.value)} required autoFocus />
          <label style={s.label}>Hasło</label>
          <input style={s.input} type="password" value={password} onChange={e => setPassword(e.target.value)} required />
          <button style={s.btn} disabled={loading}>{loading ? 'Logowanie...' : 'Zaloguj się'}</button>
        </form>
        <p style={s.footer}>Nie masz konta? <Link to="/register" style={s.link}>Zarejestruj się</Link></p>
      </div>
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  page: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0f172a' },
  card: { background: '#1e293b', borderRadius: 16, padding: '40px 48px', width: 380, boxShadow: '0 25px 50px rgba(0,0,0,0.5)' },
  title: { color: '#f1f5f9', margin: 0, fontSize: 28, fontWeight: 700 },
  sub: { color: '#64748b', marginTop: 6, marginBottom: 24 },
  error: { background: '#450a0a', border: '1px solid #dc2626', color: '#fca5a5', padding: '10px 14px', borderRadius: 8, marginBottom: 16, fontSize: 14 },
  form: { display: 'flex', flexDirection: 'column', gap: 10 },
  label: { color: '#94a3b8', fontSize: 13, fontWeight: 500 },
  input: { background: '#0f172a', border: '1px solid #334155', borderRadius: 8, padding: '10px 12px', color: '#f1f5f9', fontSize: 15, outline: 'none' },
  btn: { marginTop: 8, background: '#f59e0b', color: '#0f172a', border: 'none', borderRadius: 8, padding: '12px', fontWeight: 700, fontSize: 15, cursor: 'pointer' },
  footer: { color: '#64748b', textAlign: 'center', marginTop: 20, fontSize: 14 },
  link: { color: '#f59e0b', textDecoration: 'none' },
};
