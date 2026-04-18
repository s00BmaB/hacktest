import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <nav style={s.nav}>
      <Link to="/" style={s.brand}>⚡ Silesia Akkka</Link>
      <div style={s.links}>
        {user ? (
          <>
            <Link to="/dashboard" style={s.link}>Dashboard</Link>
            <Link to="/chat" style={s.link}>🗣️ Sznelk</Link>
            <Link to="/privacy" style={s.link}>🔒 RODO</Link>
            <span style={s.username}>👤 {user.username}</span>
            <button onClick={handleLogout} style={s.btn}>Wyloguj</button>
          </>
        ) : (
          <>
            <Link to="/login" style={s.link}>Logowanie</Link>
            <Link to="/register" style={s.btnPrimary}>Rejestracja</Link>
          </>
        )}
      </div>
    </nav>
  );
}

const s: Record<string, React.CSSProperties> = {
  nav: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 32px', background: '#0f172a', borderBottom: '1px solid #1e293b', position: 'sticky', top: 0, zIndex: 100 },
  brand: { color: '#f59e0b', fontWeight: 700, fontSize: 20, textDecoration: 'none', letterSpacing: -0.5 },
  links: { display: 'flex', alignItems: 'center', gap: 16 },
  link: { color: '#94a3b8', textDecoration: 'none', fontSize: 14 },
  username: { color: '#64748b', fontSize: 13 },
  btn: { background: 'none', border: '1px solid #334155', color: '#94a3b8', padding: '6px 14px', borderRadius: 6, cursor: 'pointer', fontSize: 13 },
  btnPrimary: { background: '#f59e0b', color: '#0f172a', padding: '6px 14px', borderRadius: 6, textDecoration: 'none', fontSize: 13, fontWeight: 600 },
};
