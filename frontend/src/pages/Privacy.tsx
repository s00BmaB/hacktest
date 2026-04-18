import { useState, useEffect } from 'react';
import api from '../api/client';

interface ConsentStatus { consented: boolean; version: string | null; timestamp: string | null; }
interface PrivacyInfo { user_rights: { article: string; right: string; endpoint: string }[]; data_categories: string[]; retention: string; administrator: string; contact: string; }

export default function Privacy() {
  const [consent, setConsent] = useState<ConsentStatus | null>(null);
  const [info, setInfo] = useState<PrivacyInfo | null>(null);
  const [deletePassword, setDeletePassword] = useState('');
  const [showDelete, setShowDelete] = useState(false);
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.get('/gdpr/consent/').then(r => setConsent(r.data)).catch(() => {});
    api.get('/gdpr/privacy/').then(r => setInfo(r.data)).catch(() => {});
  }, []);

  const toggleConsent = async () => {
    setLoading(true); setMsg(''); setError('');
    try {
      const { data } = await api.post('/gdpr/consent/', { consented: !consent?.consented });
      setConsent({ consented: data.consented, version: data.version, timestamp: data.timestamp });
      setMsg(data.message);
    } catch { setError('Błąd zapisu zgody.'); }
    finally { setLoading(false); }
  };

  const exportData = () => { window.open('http://127.0.0.1:8000/api/gdpr/export/', '_blank'); };

  const deleteAccount = async () => {
    if (!deletePassword) { setError('Podaj hasło.'); return; }
    setLoading(true); setError('');
    try {
      await api.delete('/gdpr/delete-account/', { data: { password: deletePassword } });
      localStorage.clear();
      window.location.href = '/';
    } catch (e: any) {
      setError(e.response?.data?.error || 'Błąd usuwania konta.');
    } finally { setLoading(false); }
  };

  return (
    <div style={s.page}>
      <h1 style={s.title}>🔒 Prywatność i RODO</h1>
      <p style={s.sub}>Zarządzaj swoimi danymi osobowymi zgodnie z Rozporządzeniem UE 2016/679</p>

      {msg && <div style={s.success}>{msg}</div>}
      {error && <div style={s.errBox}>{error}</div>}

      {/* Consent card */}
      <div style={s.card}>
        <h2 style={s.cardTitle}>✅ Status zgody RODO</h2>
        {consent && (
          <>
            <div style={{ ...s.statusBadge, background: consent.consented ? '#052e16' : '#1c1917', borderColor: consent.consented ? '#16a34a' : '#78716c' }}>
              <span style={{ color: consent.consented ? '#4ade80' : '#a8a29e' }}>
                {consent.consented ? '● Zgoda aktywna' : '○ Zgoda cofnięta'}
              </span>
              {consent.version && <span style={s.badgeDetail}> · v{consent.version}</span>}
              {consent.timestamp && <span style={s.badgeDetail}> · {new Date(consent.timestamp).toLocaleDateString('pl-PL')}</span>}
            </div>
            <p style={s.cardText}>
              {consent.consented
                ? 'Wyraziłeś zgodę na przetwarzanie danych osobowych w celu świadczenia usług aplikacji Silesia Akkka.'
                : 'Twoja zgoda jest cofnięta. Część funkcji może być niedostępna.'}
            </p>
            <button onClick={toggleConsent} disabled={loading} style={consent.consented ? s.btnDanger : s.btnPrimary}>
              {loading ? 'Zapisuję...' : consent.consented ? 'Cofnij zgodę' : 'Wyraź zgodę'}
            </button>
          </>
        )}
      </div>

      {/* Rights */}
      {info && (
        <div style={s.card}>
          <h2 style={s.cardTitle}>📋 Twoje prawa (RODO)</h2>
          <div style={s.rightsGrid}>
            {info.user_rights.map(r => (
              <div key={r.article} style={s.rightCard}>
                <div style={s.rightArticle}>{r.article}</div>
                <div style={s.rightName}>{r.right}</div>
                <code style={s.rightEndpoint}>{r.endpoint}</code>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Export */}
      <div style={s.card}>
        <h2 style={s.cardTitle}>📥 Eksport danych (Art. 20 RODO)</h2>
        <p style={s.cardText}>Pobierz wszystkie swoje dane w formacie JSON — historia energii, czaty, logi aktywności.</p>
        <button onClick={exportData} style={s.btnPrimary}>⬇️ Pobierz moje dane</button>
      </div>

      {/* Data categories */}
      {info && (
        <div style={s.card}>
          <h2 style={s.cardTitle}>🗂️ Kategorie przetwarzanych danych</h2>
          <ul style={s.list}>
            {info.data_categories.map(c => <li key={c} style={s.listItem}>{c}</li>)}
          </ul>
          <p style={s.cardText}><strong style={{ color: '#94a3b8' }}>Administrator:</strong> {info.administrator} · {info.contact}</p>
          <p style={s.cardText}><strong style={{ color: '#94a3b8' }}>Okres retencji:</strong> {info.retention}</p>
        </div>
      )}

      {/* Delete account */}
      <div style={{ ...s.card, borderColor: '#7f1d1d' }}>
        <h2 style={{ ...s.cardTitle, color: '#ef4444' }}>⚠️ Usuń konto (Art. 17 RODO)</h2>
        <p style={s.cardText}>Trwałe usunięcie konta i wszystkich powiązanych danych. Tej operacji nie można cofnąć.</p>
        {!showDelete ? (
          <button onClick={() => setShowDelete(true)} style={s.btnDanger}>Usuń moje konto</button>
        ) : (
          <div style={s.deleteBox}>
            <p style={{ color: '#fca5a5', fontSize: 14 }}>Potwierdź usunięcie, podając swoje hasło:</p>
            <input
              type="password"
              placeholder="Twoje hasło"
              value={deletePassword}
              onChange={e => setDeletePassword(e.target.value)}
              style={s.input}
            />
            <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
              <button onClick={deleteAccount} disabled={loading} style={s.btnDanger}>
                {loading ? 'Usuwanie...' : '🗑️ Usuń bezpowrotnie'}
              </button>
              <button onClick={() => { setShowDelete(false); setDeletePassword(''); }} style={s.btnCancel}>Anuluj</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  page: { maxWidth: 800, margin: '0 auto', padding: '32px 24px' },
  title: { color: '#f1f5f9', fontSize: 28, fontWeight: 700, margin: 0 },
  sub: { color: '#64748b', marginTop: 6, marginBottom: 24 },
  success: { background: '#052e16', border: '1px solid #16a34a', color: '#4ade80', padding: '10px 14px', borderRadius: 8, marginBottom: 16, fontSize: 14 },
  errBox: { background: '#450a0a', border: '1px solid #dc2626', color: '#fca5a5', padding: '10px 14px', borderRadius: 8, marginBottom: 16, fontSize: 14 },
  card: { background: '#1e293b', borderRadius: 12, padding: 24, marginBottom: 20, border: '1px solid #334155' },
  cardTitle: { color: '#f1f5f9', fontSize: 18, fontWeight: 600, margin: '0 0 12px 0' },
  cardText: { color: '#94a3b8', fontSize: 14, lineHeight: 1.6, marginBottom: 14 },
  statusBadge: { display: 'inline-flex', gap: 4, padding: '8px 14px', borderRadius: 20, border: '1px solid', marginBottom: 12, fontSize: 14 },
  badgeDetail: { color: '#64748b' },
  btnPrimary: { background: '#f59e0b', color: '#0f172a', border: 'none', borderRadius: 8, padding: '10px 20px', fontWeight: 600, cursor: 'pointer', fontSize: 14 },
  btnDanger: { background: '#dc2626', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 20px', fontWeight: 600, cursor: 'pointer', fontSize: 14 },
  btnCancel: { background: 'none', border: '1px solid #334155', color: '#94a3b8', borderRadius: 8, padding: '10px 20px', cursor: 'pointer', fontSize: 14 },
  rightsGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 },
  rightCard: { background: '#0f172a', borderRadius: 8, padding: '14px 16px', border: '1px solid #1e293b' },
  rightArticle: { color: '#f59e0b', fontSize: 12, fontWeight: 700, marginBottom: 4 },
  rightName: { color: '#f1f5f9', fontSize: 14, marginBottom: 6 },
  rightEndpoint: { color: '#38bdf8', fontSize: 11, fontFamily: 'monospace' },
  list: { paddingLeft: 20, marginBottom: 14 },
  listItem: { color: '#94a3b8', fontSize: 14, marginBottom: 6 },
  deleteBox: { background: '#450a0a', borderRadius: 8, padding: 16, border: '1px solid #7f1d1d' },
  input: { background: '#0f172a', border: '1px solid #dc2626', borderRadius: 8, padding: '10px 12px', color: '#f1f5f9', fontSize: 14, width: '100%', boxSizing: 'border-box' },
};
