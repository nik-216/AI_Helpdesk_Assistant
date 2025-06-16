import sys
import requests
from bs4 import BeautifulSoup

url = sys.argv[1]

try:
    response = requests.get(url)
    soup = BeautifulSoup(response.text, 'html.parser')
    for tag in soup(["script", "style", "noscript", "iframe", "footer", "header", "nav"]):
        tag.decompose()
    print(soup.get_text(separator=" ", strip=True))
except Exception as e:
    print(f"Error: {str(e)}")