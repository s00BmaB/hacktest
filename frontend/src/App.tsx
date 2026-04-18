import { BrowserRouter, Routes, Route, Navigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import Navbar from '@/components/Navbar';
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import Dashboard from '@/pages/Dashboard';
import Chat from '@/pages/Chat';
import Privacy from '@/pages/Privacy';
import { BoltIcon, AIIcon, ChartIcon, ShieldIcon, ServerIcon, ArrowRightIcon } from '@/components/icons';
import { Button } from '@/components/ui/button';

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );
  return user ? <>{children}</> : <Navigate to="/login" replace />;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  return user ? <Navigate to="/dashboard" replace /> : <>{children}</>;
}

function Home() {
  const { user } = useAuth();

  const features = [
    { icon: AIIcon, title: 'AI po Śląsku', description: 'Chatbot Sznelk radzi w gwarze śląskiej', gradient: 'from-primary/20 to-primary/5' },
    { icon: ChartIcon, title: 'Analiza Zużycia', description: 'Wykresy, prognozy i rekomendacje taryf', gradient: 'from-accent/20 to-accent/5' },
    { icon: ShieldIcon, title: 'RODO od Startu', description: 'Pełna kontrola nad swoimi danymi', gradient: 'from-chart-3/20 to-chart-3/5' },
    { icon: ServerIcon, title: 'Bezpieczeństwo', description: 'JWT, szyfrowanie, audit log, OWASP', gradient: 'from-chart-4/20 to-chart-4/5' },
  ];

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="relative">
        {/* Hero */}
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 grid-pattern opacity-30" />
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/10 rounded-full blur-3xl" />

          <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-24 sm:py-32 lg:py-40">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-center"
            >
              {/* Badge */}
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1 }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary/50 border border-border mb-8"
              >
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
                </span>
                <span className="text-sm text-muted-foreground">Powered by Tauron & AI</span>
              </motion.div>

              {/* Logo icon */}
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2, type: 'spring' }}
                className="mb-8"
              >
                <div className="inline-flex items-center justify-center">
                  <div className="relative">
                    <div className="absolute inset-0 bg-primary/30 rounded-2xl blur-2xl" />
                    <div className="relative bg-gradient-to-br from-primary via-primary to-primary/80 p-5 rounded-2xl pulse-glow">
                      <BoltIcon size={48} className="text-primary-foreground" />
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Title */}
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground tracking-tight mb-4"
              >
                Silesia <span className="text-primary">Akkka</span>
              </motion.h1>

              {/* Subtitle */}
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="text-xl sm:text-2xl text-primary font-medium mb-6"
              >
                Ślōnski Asystent Energetyczny Tauron
              </motion.p>

              {/* Description */}
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed"
              >
                Monitoruj zużycie energii, rozmawiaj ze Sznelkiem po śląsku,
                otrzymuj spersonalizowane rekomendacje AI i zarządzaj danymi zgodnie z RODO.
              </motion.p>

              {/* CTA */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="flex flex-col sm:flex-row gap-4 justify-center"
              >
                {user ? (
                  <Link to="/dashboard">
                    <Button size="lg" className="gap-2 text-base px-8">
                      Przejdź do Dashboard
                      <ArrowRightIcon size={18} />
                    </Button>
                  </Link>
                ) : (
                  <>
                    <Link to="/register">
                      <Button size="lg" className="gap-2 text-base px-8">
                        Zacznij teraz
                        <ArrowRightIcon size={18} />
                      </Button>
                    </Link>
                    <Link to="/login">
                      <Button variant="outline" size="lg" className="text-base px-8">
                        Zaloguj się
                      </Button>
                    </Link>
                  </>
                )}
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* Features */}
        <section className="relative py-24 sm:py-32">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
            >
              {features.map((feature, index) => (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  viewport={{ once: true }}
                  className="group"
                >
                  <div className={`relative h-full p-6 rounded-xl bg-gradient-to-br ${feature.gradient} border border-border card-hover`}>
                    <div className="mb-4">
                      <div className="inline-flex p-3 rounded-lg bg-card border border-border">
                        <feature.icon size={24} className="text-foreground" />
                      </div>
                    </div>
                    <h3 className="text-lg font-semibold text-foreground mb-2">{feature.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-border py-8">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
              <div className="flex items-center gap-2">
                <BoltIcon size={18} className="text-primary" />
                <span className="text-sm text-muted-foreground">Silesia Akkka © 2024</span>
              </div>
              <div className="flex items-center gap-6">
                <Link to="/privacy" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Polityka Prywatności
                </Link>
                <span className="text-sm text-muted-foreground">Powered by Tauron</span>
              </div>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
          <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
          <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
          <Route path="/chat" element={<PrivateRoute><Chat /></PrivateRoute>} />
          <Route path="/privacy" element={<PrivateRoute><Privacy /></PrivateRoute>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
