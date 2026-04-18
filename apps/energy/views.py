import io
import json
import numpy as np
import pandas as pd
from datetime import date, timedelta

from django.conf import settings
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes, parser_classes
from rest_framework.parsers import MultiPartParser, JSONParser
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import EnergyReading, AIAnalysis


def linear_predict(dates_ordinal, kwh_values, target_ordinal):
    x = np.array(dates_ordinal, dtype=float)
    y = np.array(kwh_values, dtype=float)
    if len(x) < 2:
        return float(np.mean(y))
    coeffs = np.polyfit(x, y, 1)
    return float(np.polyval(coeffs, target_ordinal))


@api_view(['POST'])
@permission_classes([IsAuthenticated])
@parser_classes([MultiPartParser])
def upload_csv(request):
    """Upload CSV: date, kwh, cost (opcjonalnie). Zapisuje odczyty do DB."""
    file = request.FILES.get('file')
    if not file:
        return Response({'error': 'Brak pliku.'}, status=400)
    try:
        content = file.read().decode('utf-8')
        df = pd.read_csv(io.StringIO(content))
    except Exception as e:
        return Response({'error': f'Błąd parsowania CSV: {e}'}, status=400)

    df.columns = [c.strip().lower() for c in df.columns]
    if 'date' not in df.columns or 'kwh' not in df.columns:
        return Response({'error': 'CSV musi zawierać kolumny: date, kwh (opcjonalnie: cost)'}, status=400)

    try:
        df['date'] = pd.to_datetime(df['date']).dt.date
        df['kwh'] = pd.to_numeric(df['kwh'], errors='coerce')
        df['cost'] = pd.to_numeric(df.get('cost', pd.Series(dtype=float)), errors='coerce') if 'cost' in df.columns else None
    except Exception as e:
        return Response({'error': f'Błąd danych: {e}'}, status=400)

    df = df.dropna(subset=['date', 'kwh'])
    saved = 0
    for _, row in df.iterrows():
        cost_val = row.get('cost') if 'cost' in df.columns and pd.notna(row.get('cost')) else None
        EnergyReading.objects.update_or_create(
            user=request.user, date=row['date'],
            defaults={'kwh': row['kwh'], 'cost': cost_val}
        )
        saved += 1

    return Response({'saved': saved, 'message': f'Zapisano {saved} odczytów.'})


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_readings(request):
    readings = EnergyReading.objects.filter(user=request.user).values('date', 'kwh', 'cost')
    return Response(list(readings))


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def analyze(request):
    """Analiza AI zużycia energii — Google Gemini 2.0 Flash (darmowy)."""
    readings = EnergyReading.objects.filter(user=request.user).order_by('date')
    if readings.count() < 3:
        return Response({'error': 'Potrzebujesz co najmniej 3 odczyty do analizy.'}, status=400)

    dates = [r.date for r in readings]
    kwh_values = [r.kwh for r in readings]
    costs = [r.cost for r in readings if r.cost is not None]

    total_kwh = sum(kwh_values)
    avg_kwh = total_kwh / len(kwh_values)

    today = date.today()
    next_month = today.replace(day=28) + timedelta(days=4)
    end_of_month = next_month - timedelta(days=next_month.day)
    ordinals = [d.toordinal() for d in dates]
    predicted_kwh = linear_predict(ordinals, kwh_values, end_of_month.toordinal())
    avg_cost_per_kwh = (sum(costs) / sum(kwh_values)) if (costs and sum(kwh_values) > 0) else 0.80
    predicted_cost = predicted_kwh * avg_cost_per_kwh

    data_summary = (
        f"Okres: {dates[0]} do {dates[-1]}\n"
        f"Liczba odczytów: {len(kwh_values)}\n"
        f"Łączne zużycie: {total_kwh:.2f} kWh\n"
        f"Średnie dzienne: {avg_kwh:.2f} kWh\n"
        f"Maksimum: {max(kwh_values):.2f} kWh, minimum: {min(kwh_values):.2f} kWh\n"
        f"Prognoza na koniec miesiąca: {predicted_kwh:.2f} kWh (~{predicted_cost:.2f} PLN)\n"
        f"Ostatnie 10 odczytów: {list(zip([str(d) for d in dates[-10:]], kwh_values[-10:]))}"
    )

    prompt = f"""Jesteś ekspertem ds. energetyki i doradcą klientów Tauron.
Przeanalizuj dane zużycia energii elektrycznej klienta i podaj:
1. Krótkie podsumowanie wzorca zużycia (2-3 zdania)
2. 3-4 konkretne rekomendacje oszczędności energii
3. Sugestię taryfy Tauron (G11 całodobowa, G12 dwustrefowa, G12w weekendowa)
4. Ocenę czy zużycie jest typowe dla gospodarstwa domowego w Polsce

Dane klienta:
{data_summary}

Odpowiedz po polsku w formacie JSON:
{{
  "summary": "...",
  "recommendations": ["...", "...", "..."],
  "tariff_suggestion": "G11/G12/G12w",
  "tariff_reason": "...",
  "consumption_assessment": "niskie/typowe/wysokie"
}}
Zwróć TYLKO JSON, bez żadnego dodatkowego tekstu."""

    try:
        from google import genai
        from google.genai import types as gtypes
        client = genai.Client(api_key=settings.GEMINI_API_KEY)
        response = client.models.generate_content(
            model='gemini-2.0-flash',
            contents=prompt,
            config=gtypes.GenerateContentConfig(max_output_tokens=1000, temperature=0.3),
        )
        raw = response.text.strip()
        if raw.startswith('```'):
            raw = raw.split('```')[1]
            if raw.startswith('json'):
                raw = raw[4:]
        result = json.loads(raw)
    except Exception as e:
        return Response({'error': f'Błąd AI: {e}'}, status=500)

    analysis = AIAnalysis.objects.create(
        user=request.user,
        summary=result.get('summary', ''),
        recommendations=result.get('recommendations', []),
        predicted_month_cost=predicted_cost,
        tariff_suggestion=result.get('tariff_suggestion', ''),
    )

    return Response({
        **result,
        'predicted_kwh': round(predicted_kwh, 2),
        'predicted_cost_pln': round(predicted_cost, 2),
        'analysis_id': analysis.id,
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_analyses(request):
    analyses = AIAnalysis.objects.filter(user=request.user).values(
        'id', 'created_at', 'summary', 'recommendations',
        'predicted_month_cost', 'tariff_suggestion'
    )
    return Response(list(analyses))
