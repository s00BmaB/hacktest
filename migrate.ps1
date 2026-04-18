Write-Host "Silesia Akkka - Migracje" -ForegroundColor Yellow
.\venv\Scripts\python manage.py makemigrations users energy chat gdpr audit
.\venv\Scripts\python manage.py migrate
Write-Host "Baza danych gotowa!" -ForegroundColor Green
