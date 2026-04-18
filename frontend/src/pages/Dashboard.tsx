import { useState, useEffect, useRef } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import api from '../api/client';

interface Reading { date: string; kwh: number; cost: number | null; }
interface Analysis {
  summary: string;
  recommendations: string[];
  tariff_suggestion: string;
  tariff_reason: string;
  consumption_assessment: string;
  predicted_kwh: number;
  predicted_cost_pln: number;
}

export default function Dashboard() {
  const [readings, setReadings] = useState<Reading[]>([]);
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [uploading, setUploading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [uploadMsg, setUploadMsg] = useState('');
  const [error, setError] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => { loadReadings(); }, []);

  const loadReadings = async () => {
    try {
      const { data } = await api.get('/energy/readings/');
      setReadings(data);
    } catch { setError('Błąd ładowania danych.'); }
  };

  const handleUpload = async () => {
    const file = fileRef.current?.files?.[0];
    if (!file) return;
    setUploading(true); setUploadMsg(''); setError('');
    const form = new FormData();
    form.append('file', file);
    try {
      const { data } = await api.post('/energy/upload/', form, { headers: { 'Content-Type': 'multipart/form-data' } });
      setUploadMsg(data.message);
      await loadReadings();
    } catch (e: any) {
      setError(e.response?.data?.error || 'Błąd uploadu.');
    } finally { setUploading(false); if (fileRef.current) fileRef.current.value = ''; }
  };

  const handleAnalyze = async () => {
    setAnalyzing(true); setError('');
    try {
      const { data } = await api.post('/energy/analyze/');
      setAnalysis(data);
    } catch (e: any) {
      setError(e.response?.data?.error || 'Błąd analizy AI.');
    } finally { setAnalyzing(false); }
  };

  const assessmentColor = (a: string) => ({ niskie: '#22c55e', typowe: '#f59e0b', wysokie: '#ef4444' }[a] ?? '#94a3b8');
  const totalKwh = readings.reduce((s, r) => s + r.kwh, 0);
  const avgKwh = readings.length ? totalKwh / readings.length : 0;

  return (
    <div style={s.page}>
      <div style={s.header}>
        <h1 style={s.title}>⚡ Dashboard energetyczny</h1>
        <p style={s.sub}>Monitoruj i optymalizuj swoje zużycie energii</p>
      </div>

      {/* Stats strip */}
      {readings.length > 0 && (
        <div style={s.statsRow}>
          {[
            { label: 'Odczyty', value: readings.length },
            { label: 'Łącznie kWh', value: totalKwh.toFixed(1) },
            { label: 'Średnia/dzień', value: `${avgKwh.toFixed(2)} kWh` },
            { label: 'Ostatni odczyt', value: readings[readings.length - 1]?.date },
          ].map(st => (
            <div key={st.label} style={s.statCard}>
              <div style={s.statVal}>{st.value}</div>
              <div style={s.statLabel}>{st.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Upload */}
      <div style={s.card}>
        <h2 style={s.cardTitle}>📂 Wgraj dane CSV</h2>
        <p style={s.cardSub}>Format: <code style={s.code}>date,kwh,cost</code> — np. <code style={s.code}>2024-01-15,8.5,6.80</code></p>
        <div style={s.uploadRow}>
          <input ref={fileRef} type="file" accept=".csv" style={s.fileInput} />
          <button onClick={handleUpload} disabled={uploading} style={s.btnPrimary}>
            {uploading ? 'Wgrywanie...' : 'Wgraj plik'}
          </button>
        </div>
        {uploadMsg && <div style={s.success}>{uploadMsg}</div>}
        {error && <div style={s.errBox}>{error}</div>}
      </div>

      {/* Charts */}
      {readings.length > 0 && (
        <div style={s.chartsRow}>
          <div style={{ ...s.card, flex: 2 }}>
            <h2 style={s.cardTitle}>📈 Zużycie dzienne (kWh)</h2>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={readings}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 11 }} tickFormatter={d => d.slice(5)} />
                <YAxis tick={{ fill: '#64748b', fontSize: 11 }} />
                <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8 }} labelStyle={{ color: '#f1f5f9' }} itemStyle={{ color: '#f59e0b' }} />
                <Line type="monotone" dataKey="kwh" stroke="#f59e0b" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div style={{ ...s.card, flex: 1 }}>
            <h2 style={s.cardTitle}>📊 Ostatnie 14 dni</h2>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={readings.slice(-14)}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 10 }} tickFormatter={d => d.slice(5)} />
                <YAxis tick={{ fill: '#64748b', fontSize: 11 }} />
                <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8 }} itemStyle={{ color: '#38bdf8' }} />
                <Bar dataKey="kwh" fill="#38bdf8" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* AI Analysis */}
      {readings.length >= 3 && (
        <div style={s.card}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={s.cardTitle}>🤖 Analiza AI (Claude)</h2>
            <button onClick={handleAnalyze} disabled={analyzing} style={s.btnAI}>
              {analyzing ? '⏳ Analizuję...' : '✨ Analizuj dane'}
            </button>
          </div>

          {analysis && (
            <div style={s.analysisBox}>
              <div style={s.summaryText}>{analysis.summary}</div>

              <div style={s.infoRow}>
                <div style={s.infoPill}>
                  <span style={{ color: '#64748b' }}>Prognoza miesiąc:</span>
                  <strong style={{ color: '#f59e0b' }}> {analysis.predicted_kwh} kWh ≈ {analysis.predicted_cost_pln} PLN</strong>
                </div>
                <div style={s.infoPill}>
                  <span style={{ color: '#64748b' }}>Sugerowana taryfa:</span>
                  <strong style={{ color: '#38bdf8' }}> {analysis.tariff_suggestion}</strong>
                </div>
                <div style={s.infoPill}>
                  <span style={{ color: '#64748b' }}>Zużycie:</span>
                  <strong style={{ color: assessmentColor(analysis.consumption_assessment) }}> {analysis.consumption_assessment}</strong>
                </div>
              </div>

              <div style={s.tariffNote}>{analysis.tariff_reason}</div>

              <h3 style={s.recoTitle}>💡 Rekomendacje</h3>
              <ul style={s.recoList}>
                {analysis.recommendations.map((r, i) => (
                  <li key={i} style={s.recoItem}>{r}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {readings.length === 0 && (
        <div style={s.emptyState}>
          <div style={{ fontSize: 48 }}>📊</div>
          <p>Wgraj plik CSV z danymi zużycia energii, żeby zobaczyć wykresy i analizę AI.</p>
        </div>
      )}
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  page: { maxWidth: 1100, margin: '0 auto', padding: '32px 24px' },
  header: { marginBottom: 28 },
  title: { color: '#f1f5f9', fontSize: 28, fontWeight: 700, margin: 0 },
  sub: { color: '#64748b', marginTop: 6 },
  statsRow: { display: 'flex', gap: 16, marginBottom: 24 },
  statCard: { flex: 1, background: '#1e293b', borderRadius: 12, padding: '20px 24px', border: '1px solid #334155' },
  statVal: { color: '#f59e0b', fontSize: 28, fontWeight: 700 },
  statLabel: { color: '#64748b', fontSize: 13, marginTop: 4 },
  card: { background: '#1e293b', borderRadius: 12, padding: 24, marginBottom: 20, border: '1px solid #334155' },
  cardTitle: { color: '#f1f5f9', fontSize: 18, fontWeight: 600, margin: '0 0 8px 0' },
  cardSub: { color: '#64748b', fontSize: 13, marginBottom: 16 },
  code: { background: '#0f172a', padding: '2px 6px', borderRadius: 4, fontFamily: 'monospace', color: '#38bdf8' },
  uploadRow: { display: 'flex', gap: 12, alignItems: 'center' },
  fileInput: { background: '#0f172a', border: '1px solid #334155', borderRadius: 8, padding: '8px 12px', color: '#94a3b8', flex: 1 },
  btnPrimary: { background: '#f59e0b', color: '#0f172a', border: 'none', borderRadius: 8, padding: '10px 20px', fontWeight: 700, cursor: 'pointer' },
  btnAI: { background: 'linear-gradient(135deg,#7c3aed,#4f46e5)', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 20px', fontWeight: 600, cursor: 'pointer' },
  success: { marginTop: 12, color: '#4ade80', background: '#052e16', padding: '10px 14px', borderRadius: 8, fontSize: 14 },
  errBox: { marginTop: 12, color: '#fca5a5', background: '#450a0a', padding: '10px 14px', borderRadius: 8, fontSize: 14 },
  chartsRow: { display: 'flex', gap: 20, marginBottom: 20 },
  analysisBox: { marginTop: 16 },
  summaryText: { color: '#cbd5e1', lineHeight: 1.7, marginBottom: 16 },
  infoRow: { display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 12 },
  infoPill: { background: '#0f172a', borderRadius: 8, padding: '8px 14px', border: '1px solid #334155', fontSize: 14 },
  tariffNote: { color: '#94a3b8', fontSize: 13, fontStyle: 'italic', marginBottom: 16 },
  recoTitle: { color: '#f1f5f9', fontSize: 16, fontWeight: 600, marginBottom: 10 },
  recoList: { paddingLeft: 20 },
  recoItem: { color: '#cbd5e1', marginBottom: 8, lineHeight: 1.6 },
  emptyState: { textAlign: 'center', color: '#475569', padding: '60px 0' },
};
