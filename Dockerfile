# Fase di compilazione
FROM node:20-alpine as builder

WORKDIR /app

COPY package*.json ./

# Installa le dipendenze solo per la fase di compilazione
RUN npm install

COPY . .

RUN npx webpack

# Fase di produzione
FROM node:20-alpine

WORKDIR /app

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/public ./public

# Comando predefinito per avviare l'app una volta che il container è in esecuzione
CMD ["node", "dist/bundle.js"]
