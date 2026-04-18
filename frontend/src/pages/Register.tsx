import { useState, FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/client';

export default function Register() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: '', email: '', password: '', password2: '', first_name: '', last_name: '' });
  const [gdpr, setGdpr] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) => setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!gdpr) { setError('Musisz zaakceptować politykę prywatności (RODO).'); return; }
    if (form.password !== form.password2) { setError('Hasła nie są identyczne.'); return; }
    setError(''); setLoading(true);
    try {
      await api.post('/users/register/', { ...form, gdpr_consent: true }, { headers: {} });
      await login(form.username, form.password);
      navigate('/dashboard');
    } catch (err: any) {
      const data = err.response?.data;
      setError(data ? Object.values(data).flat().join(' ') : 'Błąd rejestracji.');
    } finally { setLoading(false); }
  };

  return (
    <div style={s.page}>
      <div style={s.card}>
        <h1 style={s.title}>⚡ Rejestracja</h1>
        <p style={s.sub}>Dołącz do Silesia Akkka</p>
        {error && <div style={s.error}>{error}</div>}
        <form onSubmit={handleSubmit} style={s.form}>
          <div style={s.row}>
            <div style={s.col}><label style={s.label}>Imię</label><input style={s.input} value={form.first_name} onChange={set('first_name')} /></div>
            <div style={s.col}><label style={s.label}>Nazwisko</label><input style={s.input} value={form.last_name} onChange={set('last_name')} /></div>
          </div>
          <label style={s.label}>Login *</label>
          <input style={s.input} value={form.username} onChange={set('username')} required />
          <label style={s.label}>E-mail *</label>
          <input style={s.input} type="email" value={form.email} onChange={set('email')} required />
          <label style={s.label}>Hasło * (min. 8 znaków)</label>
          <input style={s.input} type="password" value={form.password} onChange={set('password')} required minLength={8} />
          <label style={s.label}>Powtórz hasło *</label>
          <input style={s.input} type="password" value={form.password2} onChange={set('password2')} required />

          <label style={s.gdprLabel}>
            <input type="checkbox" checked={gdpr} onChange={e => setGdpr(e.target.checked)} style={{ marginRight: 8 }} />
            <span>
              Akceptuję{' '}
              <Link to="/privacy" style={s.link} target="_blank">Politykę Prywatności</Link>
              {' '}i wyrażam zgodę na przetwarzanie danych osobowych zgodnie z RODO (art. 6 ust. 1 lit. a).
              Mam prawo do wglądu, eksportu i usunięcia swoich danych w dowolnym momencie.
            </span>
          </label>

          <button style={s.btn} disabled={loading}>{loading ? 'Tworzenie konta...' : 'Zarejestruj się'}</button>
        </form>
        <p style={s.footer}>Masz już konto? <Link to="/login" style={s.link}>Zaloguj się</Link></p>
      </div>
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  page: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0f172a', padding: '24px 0' },
  card: { background: '#1e293b', borderRadius: 16, padding: '40px 48px', width: 440, boxShadow: '0 25px 50px rgba(0,0,0,0.5)' },
  title: { color: '#f1f5f9', margin: 0, fontSize: 28, fontWeight: 700 },
  sub: { color: '#64748b', marginTop: 6, marginBottom: 24 },
  error: { background: '#450a0a', border: '1px solid #dc2626', color: '#fca5a5', padding: '10px 14px', borderRadius: 8, marginBottom: 16, fontSize: 14 },
  form: { display: 'flex', flexDirection: 'column', gap: 10 },
  row: { display: 'flex', gap: 12 },
  col: { flex: 1, display: 'flex', flexDirection: 'column', gap: 4 },
  label: { color: '#94a3b8', fontSize: 13, fontWeight: 500 },
  input: { background: '#0f172a', border: '1px solid #334155', borderRadius: 8, padding: '10px 12px', color: '#f1f5f9', fontSize: 14 },
  gdprLabel: { display: 'flex', alignItems: 'flex-start', color: '#94a3b8', fontSize: 13, lineHeight: 1.5, background: '#0f172a', padding: 12, borderRadius: 8, border: '1px solid #334155', marginTop: 4 },
  btn: { marginTop: 8, background: '#f59e0b', color: '#0f172a', border: 'none', borderRadius: 8, padding: '12px', fontWeight: 700, fontSize: 15, cursor: 'pointer' },
  footer: { color: '#64748b', textAlign: 'center', marginTop: 20, fontSize: 14 },
  link: { color: '#f59e0b', textDecoration: 'none' },
};
