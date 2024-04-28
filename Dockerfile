# Usa un'immagine leggera di Node.js 20 su Alpine Linux come base
FROM node:20-alpine

# Crea la directory dell'app all'interno dell'immagine
WORKDIR /app

# Copia il file package.json e package-lock.json nella directory dell'app
COPY package*.json ./

# Installa le dipendenze dell'app
RUN npm install

# Copia tutto il codice sorgente nell'immagine Docker
COPY . .

# Esponi la porta su cui l'app sarà in ascolto (modifica 3000 con la porta effettiva dell'app)
EXPOSE 3000

# Comando per avviare l'app quando il contenitore Docker viene eseguito
CMD ["node", "src/index.js"]
