# Usa un'immagine di base leggera con Node.js
FROM node:alpine

# Imposta la directory di lavoro all'interno del container
WORKDIR /app

# Copia il package.json e il package-lock.json nella directory di lavoro
COPY package*.json ./

# Installa le dipendenze del progetto
RUN npm install -g vite
RUN npm install

# Copia i file del progetto nella directory di lavoro
COPY . .

RUN npm run build

# Porta su cui il server Svelte ascolterà
EXPOSE 4173

# Comando di avvio per il container
CMD ["npm", "run", "preview"]
