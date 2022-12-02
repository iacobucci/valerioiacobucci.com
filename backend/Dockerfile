FROM python:3.9

# Imposta il percorso di lavoro nella directory dell'applicazione
WORKDIR /app

# Copia il file dei requisiti nella directory di lavoro
COPY requirements.txt .

# Installa le dipendenze dell'applicazione
RUN pip install --no-cache-dir -r requirements.txt

# Copia il codice dell'applicazione nella directory di lavoro
COPY . .

# Imposta le variabili d'ambiente necessarie per l'applicazione Django
# ENV DJANGO_SETTINGS_MODULE=myproject.settings
# ENV PYTHONUNBUFFERED=1

# Esegue i comandi per creare il database e raccogliere i file statici
RUN python manage.py migrate
RUN python manage.py collectstatic --noinput

# Esponi la porta su cui l'applicazione sarà in ascolto
EXPOSE 8000

# Avvia il server di sviluppo di Django
CMD ["python", "manage.py", "runserver", "0.0.0.0:8000"]