from bs4 import BeautifulSoup
import pandas as pd
from playwright.sync_api import sync_playwright

def GetHTML(link: str) -> str:
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        # Simula un browser reale
        page.set_extra_http_headers({"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"})
        page.goto(link)
        
        # Estrae l'HTML della pagina renderizzata
        html_content = page.content()
        browser.close()

    return html_content

def main():

    LINKS = ["https://www.cpubenchmark.net/CPU_mega_page.html", "https://www.videocardbenchmark.net/gpu_list.php"]

    for link in LINKS:
        html = GetHTML(link)

        soup = BeautifulSoup(html, "html.parser")
        table = soup.find_all("table")[1]

        print(table)


main()