import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Chat from './pages/Chat';
import Privacy from './pages/Privacy';

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <div style={{ color: '#64748b', textAlign: 'center', marginTop: 80 }}>Ładowanie...</div>;
  return user ? <>{children}</> : <Navigate to="/login" replace />;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  return user ? <Navigate to="/dashboard" replace /> : <>{children}</>;
}

function Home() {
  const { user } = useAuth();
  return (
    <div style={{ maxWidth: 700, margin: '0 auto', padding: '80px 24px', textAlign: 'center' }}>
      <div style={{ fontSize: 72, marginBottom: 16 }}>⚡</div>
      <h1 style={{ color: '#f1f5f9', fontSize: 42, fontWeight: 800, margin: 0 }}>Silesia Akkka</h1>
      <p style={{ color: '#f59e0b', fontSize: 18, margin: '8px 0 24px' }}>Ślōnski Asystent Energetyczny Tauron</p>
      <p style={{ color: '#94a3b8', fontSize: 16, lineHeight: 1.7, marginBottom: 36 }}>
        Monitoruj zużycie energii, rozmawiaj ze Sznelkiem po śląsku,<br />
        otrzymuj spersonalizowane rekomendacje AI i zarządzaj danymi zgodnie z RODO.
      </p>
      <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
        {user
          ? <a href="/dashboard" style={btnPrimary}>Przejdź do Dashboard</a>
          : <>
              <a href="/register" style={btnPrimary}>Zacznij teraz →</a>
              <a href="/login" style={btnSecondary}>Zaloguj się</a>
            </>
        }
      </div>
      <div style={{ display: 'flex', gap: 20, justifyContent: 'center', marginTop: 60, flexWrap: 'wrap' }}>
        {[
          { icon: '🤖', title: 'AI po śląsku', desc: 'Chatbot Sznelk radzi w gwarze śląskiej' },
          { icon: '📊', title: 'Analiza zużycia', desc: 'Wykresy, prognozy i rekomendacje taryf' },
          { icon: '🔒', title: 'RODO od startu', desc: 'Pełna kontrola nad swoimi danymi' },
          { icon: '🛡️', title: 'Bezpieczeństwo', desc: 'JWT, szyfrowanie, audit log, OWASP' },
        ].map(f => (
          <div key={f.title} style={featureCard}>
            <div style={{ fontSize: 32, marginBottom: 10 }}>{f.icon}</div>
            <div style={{ color: '#f1f5f9', fontWeight: 600, marginBottom: 6 }}>{f.title}</div>
            <div style={{ color: '#64748b', fontSize: 13 }}>{f.desc}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

const btnPrimary: React.CSSProperties = { background: '#f59e0b', color: '#0f172a', padding: '12px 28px', borderRadius: 8, textDecoration: 'none', fontWeight: 700, fontSize: 15 };
const btnSecondary: React.CSSProperties = { background: 'none', color: '#94a3b8', padding: '12px 28px', borderRadius: 8, textDecoration: 'none', fontWeight: 600, fontSize: 15, border: '1px solid #334155' };
const featureCard: React.CSSProperties = { background: '#1e293b', border: '1px solid #334155', borderRadius: 12, padding: '24px 20px', width: 150, textAlign: 'center' };

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div style={{ background: '#0f172a', minHeight: '100vh' }}>
          <Navbar />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
            <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
            <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
            <Route path="/chat" element={<PrivateRoute><Chat /></PrivateRoute>} />
            <Route path="/privacy" element={<PrivateRoute><Privacy /></PrivateRoute>} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}
