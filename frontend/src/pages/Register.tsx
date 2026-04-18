import { useState, FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import api from '@/api/client';
import { BoltIcon, UserIcon, MailIcon, LockIcon, ArrowRightIcon, ShieldIcon } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';

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
    } catch (err: unknown) {
      const axiosError = err as { response?: { data?: Record<string, string[]> } };
      const data = axiosError.response?.data;
      setError(data ? Object.values(data).flat().join(' ') : 'Błąd rejestracji.');
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 py-12">
      <div className="absolute inset-0 grid-pattern opacity-20" />
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/10 rounded-full blur-3xl" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative w-full max-w-lg"
      >
        <div className="glass glass-border rounded-2xl p-8 sm:p-10">
          {/* Logo */}
          <Link to="/" className="flex items-center justify-center gap-3 mb-8">
            <div className="relative">
              <div className="absolute inset-0 bg-primary/20 rounded-xl blur-lg" />
              <div className="relative bg-gradient-to-br from-primary to-primary/80 p-3 rounded-xl">
                <BoltIcon size={24} className="text-primary-foreground" />
              </div>
            </div>
            <span className="font-bold text-xl text-foreground">
              Silesia <span className="text-primary">Akkka</span>
            </span>
          </Link>

          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-foreground mb-2">Rejestracja</h1>
            <p className="text-muted-foreground">Dołącz do Silesia Akkka</p>
          </div>

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 p-4 rounded-lg bg-destructive/10 border border-destructive/20"
            >
              <p className="text-sm text-destructive">{error}</p>
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Name row */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="first_name">Imię</Label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                    <UserIcon size={18} />
                  </div>
                  <Input
                    id="first_name"
                    value={form.first_name}
                    onChange={set('first_name')}
                    placeholder="Jan"
                    className="pl-10 h-11 bg-input border-border"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="last_name">Nazwisko</Label>
                <Input
                  id="last_name"
                  value={form.last_name}
                  onChange={set('last_name')}
                  placeholder="Kowalski"
                  className="h-11 bg-input border-border"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="username">Login <span className="text-destructive">*</span></Label>
              <Input
                id="username"
                value={form.username}
                onChange={set('username')}
                placeholder="Twój login"
                required
                className="h-11 bg-input border-border"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">E-mail <span className="text-destructive">*</span></Label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  <MailIcon size={18} />
                </div>
                <Input
                  id="email"
                  type="email"
                  value={form.email}
                  onChange={set('email')}
                  placeholder="jan@example.com"
                  required
                  className="pl-10 h-11 bg-input border-border"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">
                Hasło <span className="text-destructive">*</span>
                <span className="text-muted-foreground font-normal"> (min. 8 znaków)</span>
              </Label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  <LockIcon size={18} />
                </div>
                <Input
                  id="password"
                  type="password"
                  value={form.password}
                  onChange={set('password')}
                  placeholder="••••••••"
                  required
                  minLength={8}
                  className="pl-10 h-11 bg-input border-border"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password2">Powtórz hasło <span className="text-destructive">*</span></Label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  <LockIcon size={18} />
                </div>
                <Input
                  id="password2"
                  type="password"
                  value={form.password2}
                  onChange={set('password2')}
                  placeholder="••••••••"
                  required
                  className="pl-10 h-11 bg-input border-border"
                />
              </div>
            </div>

            {/* GDPR */}
            <div className="p-4 rounded-lg bg-secondary/50 border border-border">
              <div className="flex items-start gap-3">
                <Checkbox
                  id="gdpr"
                  checked={gdpr}
                  onCheckedChange={(checked) => setGdpr(checked as boolean)}
                  className="mt-0.5"
                />
                <label htmlFor="gdpr" className="text-sm text-muted-foreground leading-relaxed cursor-pointer">
                  <ShieldIcon size={14} className="inline mr-1.5 text-primary" />
                  Akceptuję{' '}
                  <Link to="/privacy" className="text-primary hover:underline" target="_blank">
                    Politykę Prywatności
                  </Link>{' '}
                  i wyrażam zgodę na przetwarzanie danych osobowych zgodnie z RODO (art. 6 ust. 1 lit. a).
                  Mam prawo do wglądu, eksportu i usunięcia swoich danych w dowolnym momencie.
                </label>
              </div>
            </div>

            <Button type="submit" disabled={loading} className="w-full h-12 text-base font-semibold gap-2">
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                  Tworzenie konta...
                </>
              ) : (
                <>
                  Zarejestruj się
                  <ArrowRightIcon size={18} />
                </>
              )}
            </Button>
          </form>

          <div className="mt-8 text-center">
            <p className="text-sm text-muted-foreground">
              Masz już konto?{' '}
              <Link to="/login" className="text-primary hover:underline font-medium">
                Zaloguj się
              </Link>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
