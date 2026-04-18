# ⚡ Silesia Akkka — Ślōnski Asystent Energetyczny

Fullstack aplikacja energetyczna dla klientów Tauron, zbudowana na hackathon **Katowicki.hub**.

## 🏆 Kategorie konkursowe

| Kategoria | Co implementujemy |
|---|---|
| **AI Challenge (Tauron)** | Chatbot Sznelk po śląsku, analiza CSV, predykcja rachunku, sugestie taryf |
| **AKMF: Secure Infrastructure** | JWT, security headers (OWASP), rate limiting, audit log, szyfrowanie |
| **ETHLegal: Legal from Day One** | GDPR consent flow, eksport danych (Art. 20), usunięcie konta (Art. 17), privacy info |
| **Innovation** | Śląska tożsamość kulturowa × AI × energia — unikalne połączenie |

---

## 🚀 Szybki start

### 1. Sklonuj i zainstaluj
```bash
make setup
```

### 2. Skonfiguruj środowisko
```bash
cp .env.example .env
# Uzupełnij ANTHROPIC_API_KEY w pliku .env
```

### 3. Utwórz bazę danych
```bash
make migrate
make superuser   # opcjonalnie — panel /admin/
```

### 4. Uruchom aplikację
```bash
make run
# lub w dwóch osobnych terminalach:
make run-backend   # terminal 1 → http://localhost:8000
make run-frontend  # terminal 2 → http://localhost:5173
```

---

## 📁 Struktura projektu

```
silesia_akkka/
├── backend/
│   ├── settings.py          # Konfiguracja Django + JWT + CORS
│   ├── urls.py              # Główne routing
│   └── middleware/
│       └── security.py      # OWASP security headers
├── apps/
│   ├── users/               # Rejestracja, profil
│   ├── energy/              # Upload CSV, wykresy, analiza AI, predykcja
│   ├── chat/                # Chatbot Sznelk (śląski, Claude API)
│   ├── gdpr/                # Consent, eksport danych, usunięcie konta
│   └── audit/               # Middleware logowania wszystkich akcji
├── frontend/
│   └── src/
│       ├── pages/
│       │   ├── Dashboard.tsx  # Wykresy zużycia + analiza AI
│       │   ├── Chat.tsx       # Interfejs chatbota
│       │   ├── Privacy.tsx    # Panel RODO
│       │   ├── Login.tsx
│       │   └── Register.tsx
│       └── components/
│           └── Navbar.tsx
├── sample_energy.csv        # Przykładowe dane do testów
├── .env.example
└── Makefile
```

---

## 🔌 API Endpoints

### Auth
| Method | URL | Opis |
|---|---|---|
| POST | `/api/token/` | Logowanie → JWT tokens |
| POST | `/api/token/refresh/` | Odświeżenie access token |
| POST | `/api/users/register/` | Rejestracja |
| GET | `/api/users/me/` | Dane zalogowanego usera |

### Energia
| Method | URL | Opis |
|---|---|---|
| POST | `/api/energy/upload/` | Upload CSV z danymi zużycia |
| GET | `/api/energy/readings/` | Lista odczytów |
| POST | `/api/energy/analyze/` | Analiza AI (Claude) |
| GET | `/api/energy/analyses/` | Historia analiz |

### Chat (Sznelk)
| Method | URL | Opis |
|---|---|---|
| POST | `/api/chat/send/` | Wyślij wiadomość |
| GET | `/api/chat/history/` | Historia czatu |
| DELETE | `/api/chat/clear/` | Wyczyść historię |

### GDPR / RODO
| Method | URL | Opis |
|---|---|---|
| GET/POST | `/api/gdpr/consent/` | Status i zmiana zgody |
| GET | `/api/gdpr/export/` | Eksport danych (Art. 20) |
| DELETE | `/api/gdpr/delete-account/` | Usunięcie konta (Art. 17) |
| GET | `/api/gdpr/privacy/` | Informacje o polityce prywatności |

---

## 🛡️ Bezpieczeństwo (AKMF checklist)

- ✅ **JWT Authentication** — bezstanowe, krótkie tokeny (60 min), rotation refresh
- ✅ **Security Headers** — X-Frame-Options, CSP, HSTS, X-XSS-Protection, Referrer-Policy
- ✅ **Rate Limiting** — 20 req/min dla anonimowych, 100/min dla zalogowanych, 15/min dla czatu
- ✅ **Audit Log** — każde żądanie API logowane (user, IP, path, status, timestamp)
- ✅ **Input Validation** — DRF serializers + pandas dtype coercion na CSV
- ✅ **CORS** — whitelist tylko localhost:5173
- ✅ **SQL Injection** — ORM Django (parametrized queries)
- ✅ **Password Hashing** — Django PBKDF2-SHA256

---

## 📊 Format CSV

```csv
date,kwh,cost
2024-11-01,7.2,5.76
2024-11-02,8.1,6.48
```

- `date` — format `YYYY-MM-DD` (wymagany)
- `kwh` — zużycie w kWh (wymagany)
- `cost` — koszt w PLN (opcjonalny)

Plik `sample_energy.csv` zawiera 30 dni testowych danych.
