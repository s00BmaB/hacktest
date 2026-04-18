import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import api from '@/api/client';
import Navbar from '@/components/Navbar';
import { ShieldIcon, CheckIcon, DownloadIcon, TrashIcon, ListIcon, AlertIcon, LockIcon } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

interface ConsentStatus { consented: boolean; version: string | null; timestamp: string | null; }
interface PrivacyInfo { user_rights: { article: string; right: string; endpoint: string }[]; data_categories: string[]; retention: string; administrator: string; contact: string; }

export default function Privacy() {
  const { logout } = useAuth();
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

  const exportData = async () => {
    try {
      const { data } = await api.get('/gdpr/export/');
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'moje-dane.json';
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      setError('Błąd eksportu danych.');
    }
  };

  const deleteAccount = async () => {
    if (!deletePassword) { setError('Podaj hasło.'); return; }
    setLoading(true); setError('');
    try {
      await api.delete('/gdpr/delete-account/', { data: { password: deletePassword } });
      localStorage.clear();
      logout();
      window.location.href = '/';
    } catch (e: unknown) {
      const axiosError = e as { response?: { data?: { error?: string } } };
      setError(axiosError.response?.data?.error || 'Błąd usuwania konta.');
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-chart-3/10">
              <ShieldIcon size={24} className="text-chart-3" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Prywatność i RODO</h1>
          </div>
          <p className="text-muted-foreground">
            Zarządzaj swoimi danymi osobowymi zgodnie z Rozporządzeniem UE 2016/679
          </p>
        </motion.div>

        {msg && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 rounded-lg bg-chart-3/10 border border-chart-3/20 flex items-center gap-2"
          >
            <CheckIcon size={18} className="text-chart-3" />
            <p className="text-sm text-chart-3">{msg}</p>
          </motion.div>
        )}
        {error && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 rounded-lg bg-destructive/10 border border-destructive/20 flex items-center gap-2"
          >
            <AlertIcon size={18} className="text-destructive" />
            <p className="text-sm text-destructive">{error}</p>
          </motion.div>
        )}

        {/* Consent */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="mb-6">
          <Card className="glass glass-border">
            <CardHeader>
              <div className="flex items-center gap-2">
                <CheckIcon size={20} className="text-chart-3" />
                <CardTitle>Status zgody RODO</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {consent && (
                <>
                  <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border ${
                    consent.consented ? 'bg-chart-3/10 border-chart-3/30' : 'bg-muted border-border'
                  }`}>
                    <span className={`w-2 h-2 rounded-full ${consent.consented ? 'bg-chart-3' : 'bg-muted-foreground'}`} />
                    <span className={consent.consented ? 'text-chart-3' : 'text-muted-foreground'}>
                      {consent.consented ? 'Zgoda aktywna' : 'Zgoda cofnięta'}
                    </span>
                    {consent.version && <span className="text-muted-foreground text-sm"> · v{consent.version}</span>}
                    {consent.timestamp && (
                      <span className="text-muted-foreground text-sm"> · {new Date(consent.timestamp).toLocaleDateString('pl-PL')}</span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {consent.consented
                      ? 'Wyraziłeś zgodę na przetwarzanie danych osobowych w celu świadczenia usług aplikacji Silesia Akkka.'
                      : 'Twoja zgoda jest cofnięta. Część funkcji może być niedostępna.'}
                  </p>
                  <Button onClick={toggleConsent} disabled={loading} variant={consent.consented ? 'destructive' : 'default'} className="gap-2">
                    {loading ? <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                      : consent.consented ? 'Cofnij zgodę' : 'Wyraź zgodę'}
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Rights */}
        {info && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="mb-6">
            <Card className="glass glass-border">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <ListIcon size={20} className="text-accent" />
                  <CardTitle>Twoje prawa (RODO)</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid sm:grid-cols-2 gap-3">
                  {info.user_rights.map(r => (
                    <div key={r.article} className="p-4 rounded-lg bg-secondary border border-border">
                      <p className="text-xs font-semibold text-primary mb-1">{r.article}</p>
                      <p className="text-sm font-medium text-foreground mb-2">{r.right}</p>
                      <code className="text-xs text-accent font-mono">{r.endpoint}</code>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Export */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="mb-6">
          <Card className="glass glass-border">
            <CardHeader>
              <div className="flex items-center gap-2">
                <DownloadIcon size={20} className="text-primary" />
                <CardTitle>Eksport danych (Art. 20 RODO)</CardTitle>
              </div>
              <CardDescription>
                Pobierz wszystkie swoje dane w formacie JSON — historia energii, czaty, logi aktywności.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={exportData} className="gap-2">
                <DownloadIcon size={18} />
                Pobierz moje dane
              </Button>
            </CardContent>
          </Card>
        </motion.div>

        {/* Data Categories */}
        {info && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="mb-6">
            <Card className="glass glass-border">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <LockIcon size={20} className="text-chart-4" />
                  <CardTitle>Kategorie przetwarzanych danych</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-2">
                  {info.data_categories.map(c => (
                    <li key={c} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span className="w-1.5 h-1.5 rounded-full bg-chart-4" />
                      {c}
                    </li>
                  ))}
                </ul>
                <div className="pt-4 border-t border-border space-y-1">
                  <p className="text-sm text-muted-foreground">
                    <span className="font-medium text-foreground">Administrator:</span> {info.administrator} · {info.contact}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    <span className="font-medium text-foreground">Okres retencji:</span> {info.retention}
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Delete Account */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
          <Card className="glass border-destructive/30">
            <CardHeader>
              <div className="flex items-center gap-2">
                <AlertIcon size={20} className="text-destructive" />
                <CardTitle className="text-destructive">Usuń konto (Art. 17 RODO)</CardTitle>
              </div>
              <CardDescription>
                Trwałe usunięcie konta i wszystkich powiązanych danych. Tej operacji nie można cofnąć.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!showDelete ? (
                <Button variant="destructive" onClick={() => setShowDelete(true)} className="gap-2">
                  <TrashIcon size={18} />
                  Usuń moje konto
                </Button>
              ) : (
                <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/30 space-y-4">
                  <p className="text-sm text-destructive">Potwierdź usunięcie, podając swoje hasło:</p>
                  <Input
                    type="password"
                    placeholder="Twoje hasło"
                    value={deletePassword}
                    onChange={e => setDeletePassword(e.target.value)}
                    className="border-destructive/50 bg-background"
                  />
                  <div className="flex gap-3">
                    <Button variant="destructive" onClick={deleteAccount} disabled={loading} className="gap-2">
                      {loading
                        ? <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                        : <><TrashIcon size={16} /> Usuń bezpowrotnie</>
                      }
                    </Button>
                    <Button variant="outline" onClick={() => { setShowDelete(false); setDeletePassword(''); }}>
                      Anuluj
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </main>
    </div>
  );
}
