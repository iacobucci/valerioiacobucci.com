from bs4 import BeautifulSoup
import sys
import os

# Directory contenente i file HTML
directory = sys.argv[1]

# Ciclo attraverso i file nella directory
for filename in os.listdir(directory):
    if filename.endswith(".html"):
        file_path = os.path.join(directory, filename)

        # Apri il file HTML
        with open(file_path, "r") as f:
            # Leggi il contenuto del file
            html_content = f.read()

            # Crea un oggetto BeautifulSoup
            soup = BeautifulSoup(html_content, "html.parser")

            body_tags = soup.find_all("body")

            # Stampa il contenuto raw HTML tra i tag body
            with open(file_path.replace("edit-",""),"w") as f2:
                print('<link rel="stylesheet" href="styles.css">', file=f2)
                for body_tag in body_tags:
                    body_content = str(body_tag)
                    print(body_content, file=f2 )
