VENV     = venv
PYTHON   = $(VENV)/bin/python
PIP      = $(VENV)/bin/pip
MANAGE   = $(PYTHON) manage.py

.PHONY: setup migrate run clean superuser

# ── Instalacja wszystkiego ────────────────────────────────────────────────────
setup:
	python3 -m venv $(VENV)
	$(PIP) install --upgrade pip
	$(PIP) install -r requirements.txt
	cd frontend && npm install
	@echo ""
	@echo "✅ Instalacja zakończona!"
	@echo "➡️  Następne kroki:"
	@echo "   1. cp .env.example .env  (i uzupełnij ANTHROPIC_API_KEY)"
	@echo "   2. make migrate"
	@echo "   3. make superuser"
	@echo "   4. make run"

# ── Migracje bazy danych ──────────────────────────────────────────────────────
migrate:
	$(MANAGE) makemigrations users energy chat gdpr audit
	$(MANAGE) migrate

# ── Tworzenie superusera ──────────────────────────────────────────────────────
superuser:
	$(MANAGE) createsuperuser

# ── Uruchomienie (Django + React w tmux) ─────────────────────────────────────
run:
	@tmux new-session -d -s dev -n fullstack 2>/dev/null || true
	@tmux send-keys -t dev:0 \
	  "source $(VENV)/bin/activate && $(MANAGE) runserver" C-m
	@tmux split-window -h -t dev:0
	@tmux send-keys -t dev:0.1 \
	  "cd frontend && npm run dev" C-m
	@tmux attach-session -t dev

# ── Uruchomienie bez tmux (dwa terminale) ────────────────────────────────────
run-backend:
	source $(VENV)/bin/activate && $(MANAGE) runserver

run-frontend:
	cd frontend && npm run dev

# ── Czyszczenie ───────────────────────────────────────────────────────────────
clean:
	rm -rf $(VENV) frontend/node_modules db.sqlite3
	find . -type d -name "__pycache__" -exec rm -rf {} + 2>/dev/null || true
	find . -name "*.pyc" -delete 2>/dev/null || true
	@echo "🧹 Projekt wyczyszczony."
