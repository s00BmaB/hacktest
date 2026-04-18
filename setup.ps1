Write-Host "Silesia Akkka - Setup" -ForegroundColor Yellow
Write-Host "Krok 1: Wirtualne srodowisko Python..." -ForegroundColor Cyan
python -m venv venv
if ($LASTEXITCODE -ne 0) {
    Write-Host "BLAD: Python nie znaleziony." -ForegroundColor Red
    exit 1
}
Write-Host "Krok 2: Instalacja pakietow Python..." -ForegroundColor Cyan
.\venv\Scripts\pip install --upgrade pip --quiet
.\venv\Scripts\pip install -r requirements.txt
Write-Host "Krok 3: Instalacja npm..." -ForegroundColor Cyan
cd frontend
npm install
cd ..
if (-Not (Test-Path ".env")) {
    Copy-Item ".env.example" ".env"
    Write-Host "Utworzono .env - uzupelnij GEMINI_API_KEY!" -ForegroundColor Yellow
}
Write-Host "GOTOWE! Nastepne kroki:" -ForegroundColor Green
Write-Host "1. Edytuj .env i wpisz GEMINI_API_KEY"
Write-Host "2. powershell -ExecutionPolicy Bypass -File migrate.ps1"
Write-Host "3. powershell -ExecutionPolicy Bypass -File run.ps1"
