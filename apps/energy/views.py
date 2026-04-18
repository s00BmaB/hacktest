import io
import json
import numpy as np
import pandas as pd
from datetime import date, timedelta

from django.conf import settings
from rest_framework.decorators import api_view, permission_classes, parser_classes
from rest_framework.parsers import MultiPartParser
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
        return Response({'error': f'Blad parsowania CSV: {e}'}, status=400)

    df.columns = [c.strip().lower() for c in df.columns]
    if 'date' not in df.columns or 'kwh' not in df.columns:
        return Response({'error': 'CSV musi zawierac kolumny: date, kwh (opcjonalnie: cost)'}, status=400)

    try:
        df['date'] = pd.to_datetime(df['date']).dt.date
        df['kwh'] = pd.to_numeric(df['kwh'], errors='coerce')
        df['cost'] = pd.to_numeric(df.get('cost', pd.Series(dtype=float)), errors='coerce') if 'cost' in df.columns else None
    except Exception as e:
        return Response({'error': f'Blad danych: {e}'}, status=400)

    df = df.dropna(subset=['date', 'kwh'])
    EnergyReading.objects.filter(user=request.user).delete()
    saved = 0
    for _, row in df.iterrows():
        cost_val = row.get('cost') if 'cost' in df.columns and pd.notna(row.get('cost')) else None
        EnergyReading.objects.create(
            user=request.user, date=row['date'],
            kwh=row['kwh'], cost=cost_val
        )
        saved += 1

    return Response({'saved': saved, 'message': f'Zapisano {saved} odczytow.'})


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_readings(request):
    readings = EnergyReading.objects.filter(user=request.user).values('date', 'kwh', 'cost')
    return Response(list(readings))


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def analyze(request):
    """Analiza AI zuzycia energii - Vertex AI Gemini 2.5 Flash."""
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
        f"Liczba odczytow: {len(kwh_values)}\n"
        f"Laczne zuzycie: {total_kwh:.2f} kWh\n"
        f"Srednie dzienne: {avg_kwh:.2f} kWh\n"
        f"Maksimum: {max(kwh_values):.2f} kWh, minimum: {min(kwh_values):.2f} kWh\n"
        f"Prognoza na koniec miesiaca: {predicted_kwh:.2f} kWh (~{predicted_cost:.2f} PLN)\n"
        f"Ostatnie 10 odczytow: {list(zip([str(d) for d in dates[-10:]], kwh_values[-10:]))}"
    )

    prompt = f"""Jestes ekspertem ds. energetyki i doradca klientow Tauron.
Przeanalizuj dane zuzycia energii elektrycznej klienta i dobierz optymalną taryfę.

Dostępne taryfy Tauron:
- G11: jednolita cena przez całą dobę (~0.80 PLN/kWh). Optymalna gdy zuzycie jest rowne przez cały dzień.
- G12: dwie strefy — dzienna drozsza (~0.95 PLN/kWh, 6:00-22:00) i nocna tansza (~0.55 PLN/kWh, 22:00-6:00). Optymalna gdy wiekszosc zuzycia wypada w nocy (>40% nocą).
- G12W: jak G12 ale weekendy i swieta calodobe w strefie nocnej (taniej). Optymalna dla osob zuzywajecych duzo pradu w weekendy.
- G13: trzy strefy — szczytowa bardzo droga (rano i wieczor w dni robocze), pozaszczytowa srednia, nocna tania. Optymalna dla klientow biznesowych lub bardzo wysokiego zuzycia z mozliwoscia przesuwania poboru poza szczyt.

Dane klienta:
{data_summary}

Na podstawie profilu zuzycia (rozklad godzinowy jesli dostepny, ilosc, regularnosc) wybierz JEDNA najlepsza taryfę.

Odpowiedz TYLKO i WYLACZNIE poprawnym JSON bez zadnego dodatkowego tekstu, bez markdown, bez komentarzy:
{{"summary":"podsumowanie 2-3 zdania","recommendations":["rekomendacja 1","rekomendacja 2","rekomendacja 3"],"tariff_suggestion":"NAZWA_TARYFY","tariff_reason":"konkretne uzasadnienie dlaczego ta taryfa","consumption_assessment":"niskie|typowe|wysokie"}}

Wypelnij powyzszy JSON danymi po polsku. W polu tariff_suggestion wpisz dokladnie jedna z: G11, G12, G12W, G13. Zwroc TYLKO JSON."""

    try:
        import vertexai
        from vertexai.generative_models import GenerativeModel, GenerationConfig

        vertexai.init(
            project=settings.VERTEX_PROJECT_ID,
            location=settings.VERTEX_LOCATION,
        )

        model = GenerativeModel("gemini-2.5-flash")
        response = model.generate_content(
            prompt,
            generation_config=GenerationConfig(
                max_output_tokens=8192,
                temperature=0.1,
            ),
        )

        raw = response.text.strip()

        # Wyodrebnij JSON
        start = raw.find('{')
        end = raw.rfind('}')
        if start != -1 and end != -1:
            raw = raw[start:end+1]

        result = json.loads(raw)

        import re
        def strip_markdown(text):
            if not isinstance(text, str):
                return text
            text = re.sub(r'\*{1,3}(.*?)\*{1,3}', r'\1', text)
            text = re.sub(r'_{1,2}(.*?)_{1,2}', r'\1', text)
            text = re.sub(r'`{1,3}(.*?)`{1,3}', r'\1', text)
            return text.strip()

        for key in ('summary', 'tariff_reason', 'consumption_assessment'):
            if key in result:
                result[key] = strip_markdown(result[key])
        if 'recommendations' in result:
            result['recommendations'] = [strip_markdown(r) for r in result['recommendations']]

    except json.JSONDecodeError as e:
        # Fallback - zwroc odpowiedz tekstowa jesli JSON sie nie parsuje
        return Response({'error': f'Blad parsowania JSON: {e} | Raw: {raw[:200]}'}, status=500)
    except Exception as e:
        return Response({'error': f'Blad AI: {e}'}, status=500)

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
