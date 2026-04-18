# Używamy Pythona 3.12 (wymagany przez Django 6.0)
FROM python:3.12-slim

ENV PYTHONUNBUFFERED=1
# Dodajemy bieżący katalog do PYTHONPATH, żeby Django widziało moduł 'backend'
ENV PYTHONPATH=/app 

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

CMD ["python", "manage.py", "runserver", "0.0.0.0:8000"]
