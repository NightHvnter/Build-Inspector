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
        
        try:
            page.select_option("select[name='cputable_length']", "-1")
            page.wait_for_timeout(2000)
        except Exception:
            pass
        
        html_content = page.content()
        browser.close()
    return html_content

def Clean(data = [], type_str = ""):
    clean = []  
    # Salta la prima riga (intestazione)
    rows = data[1:] if len(data) > 1 else data

    if type_str == "cpu":
        for cpu in rows:
            if len(cpu) > 6:
                temp = {
                    "name": cpu[1],
                    "cores": cpu[2],
                    "mark": cpu[3],
                    "socket": cpu[6]
                }
                clean.append(temp)
    elif type_str == "gpu":
        print(rows[0])
        for gpu in rows:
            if len(gpu) > 2:
                temp = {
                    "name": gpu[0],
                    "mark": gpu[1]
                }
                clean.append(temp)

    return clean

def GetData():
    TARGETS = [
        {"url": "https://www.cpubenchmark.net/CPU_mega_page.html", "label": "cpu"},
        {"url": "https://www.videocardbenchmark.net/gpu_list.php", "label": "gpu"}
    ]

    all_data = {}

    for target in TARGETS:
        html = GetHTML(target["url"])
        soup = BeautifulSoup(html, "html.parser")
        
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
                
        all_data[target["label"]] = Clean(rows_data, target["label"])

    return all_data

def main():
    clean_data = GetData()

    with open("hardware_data_clean.json", "w", encoding="utf-8") as f:
        json.dump(clean_data, f, indent=4)
    print("File JSON generato con successo!")

if __name__ == "__main__":
    main()