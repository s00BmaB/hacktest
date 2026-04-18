import pandas as pd
import numpy as np
from datetime import datetime, timedelta

start_date = datetime(2022, 1, 1)
end_date = datetime(2026, 12, 31)
num_days = (end_date - start_date).days + 1
dates = [start_date + timedelta(days=x) for x in range(num_days)]

def generate_g13_data(date):
    day_of_week = date.weekday()  # 0-4 dni robocze, 5-6 weekend
    day_of_year = date.timetuple().tm_yday
    
    # Sezonowość dla pompy ciepła (bardzo duże różnice lato/zima)
    # Zimą zużycie może wynosić 40-60 kWh, latem 8-12 kWh (tylko CWU i AGD)
    temp_factor = np.cos(2 * np.pi * (day_of_year - 15) / 365) # 1 w połowie stycznia, -1 w lipcu
    base_kwh = 25.0 + (20.0 * temp_factor) 
    noise = np.random.uniform(-5, 5)
    total_kwh = max(7.0, round(base_kwh + noise, 1))
    
    # Symulacja rozkładu stref w G13 dla inteligentnego użytkownika:
    if day_of_week >= 5: # Weekend - cała doba w taniej strefie
        avg_price = 0.72 
    else:
        # Dzień roboczy: mieszanka stref
        # 13h tanich, kilka h drogich, reszta średnia
        # Średnia ważona ceny dla kogoś, kto pilnuje prania/grzania:
        avg_price = 0.94 
        
    # Korekta cenowa na lata (inflacja i zmiany taryf)
    if date.year >= 2024:
        avg_price *= 1.25 # Podwyżki od połowy 2024
    if date.year >= 2026:
        avg_price *= 0.95 # Lekka stabilizacja/obniżka rynkowa
        
    cost = round(total_kwh * avg_price, 2)
    return total_kwh, cost

data = []
for d in dates:
    kwh, cost = generate_g13_data(d)
    data.append([d.strftime('%Y-%m-%d'), kwh, cost])

df_g13 = pd.DataFrame(data, columns=['date', 'kwh', 'cost'])
df_g13.to_csv('zuzycie_taryfa_g13_tauron.csv', index=False)