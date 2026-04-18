# Używamy lekkiej wersji Node.js
FROM node:20-alpine

# Ustawiamy katalog roboczy
WORKDIR /app

# Kopiujemy paczki i instalujemy (osobny krok dla przyspieszenia budowania)
COPY package.json package-lock.json* ./
RUN npm install

# Kopiujemy resztę kodu
COPY . .

# Odpalamy Vite (0.0.0.0 wypuszcza ruch z kontenera)
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
