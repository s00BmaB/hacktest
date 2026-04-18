Write-Host "Silesia Akkka - Uruchamianie" -ForegroundColor Yellow
$bd = $PWD.Path
$fd = "$bd\frontend"
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$bd'; .\venv\Scripts\python manage.py runserver"
Start-Sleep -Seconds 2
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$fd'; npm run dev"
Start-Sleep -Seconds 3
Write-Host "Aplikacja dziala!" -ForegroundColor Green
Write-Host "Frontend: http://localhost:5173"
Write-Host "Backend:  http://localhost:8000"
Start-Process "http://localhost:5173"
