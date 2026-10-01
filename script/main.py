from bs4 import BeautifulSoup
from playwright.sync_api import sync_playwright
import json

def GetHTML(link: str) -> str:
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        page.set_extra_http_headers({"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"})
        page.goto(link)

        page.wait_for_selector("table#cputable")
        
        # Tenta di selezionare "All" nel menu DataTables (se presente)
        try:
            # Cerca il selettore del numero di righe per pagina di DataTables e seleziona "All" (-1)
            page.select_option("select[name='cputable_length']", "-1")
            # Attende un istante che la tabella si aggiorni con tutti i dati
            page.wait_for_timeout(2000)
        except Exception:
            # Se il menu non esiste o ha un selettore diverso, prosegue comunque
            pass
        
        html_content = page.content()
        browser.close()
    return html_content

def Clean(dati_grezzi):

    return dati_grezzi

def main():
    TARGETS = [
        {"url": "https://www.cpubenchmark.net/CPU_mega_page.html", "label": "cpu"},
        {"url": "https://www.videocardbenchmark.net/gpu_list.php", "label": "gpu"}
    ]

    all_data = {}

    for target in TARGETS:
        html = GetHTML(target["url"])
        soup = BeautifulSoup(html, "html.parser")
        
        # Entrambi i siti usano "cputable"
        table = soup.find("table", {"id": "cputable"})
        
        if not table:
            print(f"Tabella non trovata per {target['url']}")
            continue

        rows_data = []
        for row in table.find_all("tr"):
            cols = row.find_all(["th", "td"])
            cols_text = [col.get_text(strip=True) for col in cols]
                
            if cols_text:
                rows_data.append(cols_text)
                
        all_data[target["label"]] = Clean(rows_data)
        all_data[target["label"]] = all_data[target["label"]][1:]

    return all_data

if __name__ == "__main__":
    result = main()
    with open("hardware_data.json", "w", encoding="utf-8") as f:
        json.dump(result, f, indent=4)