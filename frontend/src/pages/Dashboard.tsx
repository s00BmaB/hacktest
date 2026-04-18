import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { useAuth } from '@/context/AuthContext';
import api from '@/api/client';
import Navbar from '@/components/Navbar';
import { BoltIcon, UploadIcon, ChartIcon, BarChartIcon, SparklesIcon, LightbulbIcon, TrendingUpIcon, ClockIcon, DatabaseIcon, CheckIcon } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

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
  const { user } = useAuth();
  const [readings, setReadings] = useState<Reading[]>([]);
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [uploading, setUploading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [uploadMsg, setUploadMsg] = useState('');
  const [error, setError] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [selectedFile, setSelectedFile] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => { if (user) loadReadings(); }, [user]);

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
      setAnalysis(null);
      await loadReadings();
    } catch (e: unknown) {
      const axiosError = e as { response?: { data?: { error?: string } } };
      setError(axiosError.response?.data?.error || 'Błąd uploadu.');
    } finally { setUploading(false); }
  };

  const handleAnalyze = async () => {
    setAnalyzing(true); setError('');
    try {
      const { data } = await api.post('/energy/analyze/');
      setAnalysis(data);
    } catch (e: unknown) {
      const axiosError = e as { response?: { data?: { error?: string } } };
      setError(axiosError.response?.data?.error || 'Błąd analizy AI.');
    } finally { setAnalyzing(false); }
  };

  const assessmentColor = (a: string) =>
    ({ niskie: 'text-chart-3', typowe: 'text-primary', wysokie: 'text-destructive' }[a] ?? 'text-muted-foreground');

  const filteredReadings = readings.filter(r => {
    if (dateFrom && r.date < dateFrom) return false;
    if (dateTo && r.date > dateTo) return false;
    return true;
  });

  const totalKwh = readings.reduce((s, r) => s + r.kwh, 0);
  const avgKwh = readings.length ? totalKwh / readings.length : 0;

  const stats = [
    { label: 'Odczyty', value: readings.length, icon: DatabaseIcon, color: 'text-primary' },
    { label: 'Łącznie kWh', value: totalKwh.toFixed(1), icon: BoltIcon, color: 'text-accent' },
    { label: 'Średnia/dzień', value: `${avgKwh.toFixed(2)} kWh`, icon: TrendingUpIcon, color: 'text-chart-3' },
    { label: 'Ostatni odczyt', value: readings[readings.length - 1]?.date || '-', icon: ClockIcon, color: 'text-chart-4' },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-primary/10">
              <BoltIcon size={24} className="text-primary" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Dashboard energetyczny</h1>
          </div>
          <p className="text-muted-foreground">Monitoruj i optymalizuj swoje zużycie energii</p>
        </motion.div>

        {/* Stats */}
        {readings.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8"
          >
            {stats.map((stat, index) => (
              <motion.div key={stat.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 + index * 0.05 }}>
                <Card className="glass glass-border card-hover">
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className={`text-2xl sm:text-3xl font-bold ${stat.color}`}>{stat.value}</p>
                        <p className="text-sm text-muted-foreground mt-1">{stat.label}</p>
                      </div>
                      <div className={`p-2 rounded-lg bg-secondary ${stat.color}`}>
                        <stat.icon size={20} />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* Upload */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="mb-8">
          <Card className="glass glass-border">
            <CardHeader>
              <div className="flex items-center gap-2">
                <UploadIcon size={20} className="text-primary" />
                <CardTitle>Wgraj dane CSV</CardTitle>
              </div>
              <CardDescription>
                Format: <code className="px-1.5 py-0.5 rounded bg-secondary text-accent text-xs">date,kwh,cost</code> — np.{' '}
                <code className="px-1.5 py-0.5 rounded bg-secondary text-accent text-xs">2024-01-15,8.5,6.80</code>
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row gap-4">
                <label className="flex-1 flex items-center gap-3 bg-input border border-border rounded-lg px-4 py-2 cursor-pointer hover:border-primary/50 transition-colors">
                  <span className="py-1 px-3 rounded-md bg-primary text-primary-foreground text-sm font-medium whitespace-nowrap">Wybierz plik</span>
                  <span className="text-sm text-muted-foreground truncate">
                    {selectedFile || 'Nie wybrano pliku'}
                  </span>
                  <input
                    ref={fileRef}
                    type="file"
                    accept=".csv"
                    className="hidden"
                    onChange={e => setSelectedFile(e.target.files?.[0]?.name || '')}
                  />
                </label>
                <Button onClick={handleUpload} disabled={uploading} className="gap-2">
                  {uploading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                      Wgrywanie...
                    </>
                  ) : (
                    <>
                      <UploadIcon size={18} />
                      Wgraj plik
                    </>
                  )}
                </Button>
              </div>
              {uploadMsg && (
                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
                  className="mt-4 p-3 rounded-lg bg-chart-3/10 border border-chart-3/20 flex items-center gap-2"
                >
                  <CheckIcon size={18} className="text-chart-3" />
                  <p className="text-sm text-chart-3">{uploadMsg}</p>
                </motion.div>
              )}
              {error && (
                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
                  className="mt-4 p-3 rounded-lg bg-destructive/10 border border-destructive/20"
                >
                  <p className="text-sm text-destructive">{error}</p>
                </motion.div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Charts */}
        {readings.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
            className="grid lg:grid-cols-3 gap-6 mb-8"
          >
            <Card className="glass glass-border lg:col-span-2">
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <ChartIcon size={20} className="text-primary" />
                    <CardTitle>Zużycie dzienne (kWh)</CardTitle>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <input
                      type="date"
                      value={dateFrom}
                      onChange={e => setDateFrom(e.target.value)}
                      className="text-xs bg-input border border-border rounded-md px-2 py-1.5 text-foreground"
                    />
                    <span className="text-xs text-muted-foreground">—</span>
                    <input
                      type="date"
                      value={dateTo}
                      onChange={e => setDateTo(e.target.value)}
                      className="text-xs bg-input border border-border rounded-md px-2 py-1.5 text-foreground"
                    />
                    {(dateFrom || dateTo) && (
                      <button
                        onClick={() => { setDateFrom(''); setDateTo(''); }}
                        className="text-xs text-muted-foreground hover:text-foreground px-1"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                </div>
                {(dateFrom || dateTo) && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {filteredReadings.length} odczytów w wybranym okresie
                  </p>
                )}
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={filteredReadings}>
                      <defs>
                        <linearGradient id="colorKwh" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="oklch(0.75 0.18 55)" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="oklch(0.75 0.18 55)" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.22 0.02 260)" />
                      <XAxis dataKey="date" tick={{ fill: 'oklch(0.5 0.02 260)', fontSize: 11 }} tickFormatter={d => d.slice(5)} axisLine={{ stroke: 'oklch(0.22 0.02 260)' }} />
                      <YAxis tick={{ fill: 'oklch(0.5 0.02 260)', fontSize: 11 }} axisLine={{ stroke: 'oklch(0.22 0.02 260)' }} />
                      <Tooltip
                        contentStyle={{ background: 'oklch(0.13 0.01 260)', border: '1px solid oklch(0.22 0.02 260)', borderRadius: '8px' }}
                        labelStyle={{ color: 'oklch(0.95 0.01 260)' }}
                        itemStyle={{ color: 'oklch(0.75 0.18 55)' }}
                      />
                      <Area type="monotone" dataKey="kwh" stroke="oklch(0.75 0.18 55)" strokeWidth={2} fillOpacity={1} fill="url(#colorKwh)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card className="glass glass-border">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <BarChartIcon size={20} className="text-accent" />
                  <CardTitle>Ostatnie 14 dni</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={readings.slice(-14)}>
                      <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.22 0.02 260)" />
                      <XAxis dataKey="date" tick={{ fill: 'oklch(0.5 0.02 260)', fontSize: 10 }} tickFormatter={d => d.slice(8)} axisLine={{ stroke: 'oklch(0.22 0.02 260)' }} />
                      <YAxis tick={{ fill: 'oklch(0.5 0.02 260)', fontSize: 11 }} axisLine={{ stroke: 'oklch(0.22 0.02 260)' }} />
                      <Tooltip
                        contentStyle={{ background: 'oklch(0.13 0.01 260)', border: '1px solid oklch(0.22 0.02 260)', borderRadius: '8px' }}
                        itemStyle={{ color: 'oklch(0.65 0.2 200)' }}
                      />
                      <Bar dataKey="kwh" fill="oklch(0.65 0.2 200)" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* AI Analysis */}
        {readings.length >= 3 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
            <Card className="glass glass-border">
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="flex items-center gap-2">
                    <SparklesIcon size={20} className="text-chart-4" />
                    <CardTitle>Analiza AI (Claude)</CardTitle>
                  </div>
                  <Button
                    onClick={handleAnalyze}
                    disabled={analyzing}
                    variant="outline"
                    className="gap-2 border-chart-4/50 text-chart-4 hover:bg-chart-4/10"
                  >
                    {analyzing ? (
                      <>
                        <div className="w-4 h-4 border-2 border-chart-4 border-t-transparent rounded-full animate-spin" />
                        Analizuję...
                      </>
                    ) : (
                      <>
                        <SparklesIcon size={18} />
                        Analizuj dane
                      </>
                    )}
                  </Button>
                </div>
              </CardHeader>

              {analysis && (
                <CardContent className="space-y-6">
                  <p className="text-foreground/90 leading-relaxed">{analysis.summary}</p>

                  <div className="flex flex-wrap gap-3">
                    <div className="px-4 py-2.5 rounded-lg bg-secondary border border-border">
                      <span className="text-sm text-muted-foreground">Prognoza miesiąc: </span>
                      <span className="text-sm font-semibold text-primary">
                        {analysis.predicted_kwh} kWh ≈ {analysis.predicted_cost_pln} PLN
                      </span>
                    </div>
                    <div className="px-4 py-2.5 rounded-lg bg-secondary border border-border">
                      <span className="text-sm text-muted-foreground">Sugerowana taryfa: </span>
                      <span className="text-sm font-semibold text-accent">{analysis.tariff_suggestion}</span>
                    </div>
                    <div className="px-4 py-2.5 rounded-lg bg-secondary border border-border">
                      <span className="text-sm text-muted-foreground">Zużycie: </span>
                      <span className={`text-sm font-semibold ${assessmentColor(analysis.consumption_assessment)}`}>
                        {analysis.consumption_assessment}
                      </span>
                    </div>
                  </div>

                  <p className="text-sm text-muted-foreground italic">{analysis.tariff_reason}</p>

                  <div>
                    <h3 className="flex items-center gap-2 text-lg font-semibold text-foreground mb-4">
                      <LightbulbIcon size={20} className="text-primary" />
                      Rekomendacje
                    </h3>
                    <ul className="space-y-3">
                      {analysis.recommendations.map((r, i) => (
                        <li key={i} className="flex items-start gap-3">
                          <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" />
                          <span className="text-foreground/80 leading-relaxed">{r}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </CardContent>
              )}
            </Card>
          </motion.div>
        )}

        {/* Empty State */}
        {readings.length === 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
            className="text-center py-16"
          >
            <div className="inline-flex p-4 rounded-2xl bg-secondary/50 mb-6">
              <ChartIcon size={48} className="text-muted-foreground" />
            </div>
            <h3 className="text-xl font-semibold text-foreground mb-2">Brak danych</h3>
            <p className="text-muted-foreground max-w-md mx-auto">
              Wgraj plik CSV z danymi zużycia energii, żeby zobaczyć wykresy i analizę AI.
            </p>
          </motion.div>
        )}
      </main>
    </div>
  );
}
