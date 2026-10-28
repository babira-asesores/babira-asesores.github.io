"""Descarga las fotos de la extracción de Facebook y las asigna a cada propiedad del inventario.
Uso: python importar_facebook.py ../../datos/facebook_extraccion.json
"""
import json, pathlib, re, sys, urllib.request

RAIZ = pathlib.Path(__file__).resolve().parent.parent
FOTOS = RAIZ / "img" / "casas"

# Palabras clave del texto del post -> ID de inventario
REGLAS = [
    ("BB-001", r"Ignacio Salazar"),
    ("BB-002", r"Misi[oó]n del Arco"),
    ("BB-003", r"Altaria"),
    ("BB-004", r"Quintas del Sol"),
    ("BB-005", r"Vive por el Colosio|Hermosa propiedad, Amueblada y Decorada al poniente"),
    ("BB-006", r"Sierra Vista|SIERRA VISTA"),
    ("BB-007", r"esquina con terreno excedente"),
    ("BB-008", r"Real de Sevilla"),
    ("BB-009", r"Las Quintas"),
    ("BB-010", r"Villa del Mediterr"),
    ("BB-011", r"deptos nuevos"),
    ("BB-012", r"Montebello"),
    ("BB-013", r"11,426"),
    ("BB-014", r"LOCAL EN LA CIUDAD DE NOGALES"),
    ("BB-015", r"amplio terreno"),
]

def main(origen):
    posts = json.loads(pathlib.Path(origen).read_text(encoding="utf-8"))
    textos = {}
    for p in posts:
        pid = next((i for i, rx in REGLAS if re.search(rx, p["t"])), None)
        if not pid:
            continue
        carpeta = FOTOS / pid
        carpeta.mkdir(parents=True, exist_ok=True)
        n = len(list(carpeta.glob("*.jpg")))
        for url in p["imgs"]:
            n += 1
            destino = carpeta / f"{n:02d}.jpg"
            try:
                urllib.request.urlretrieve(url, destino)
            except Exception as e:
                print("  no se pudo bajar una foto de", pid, e)
                n -= 1
        textos.setdefault(pid, {"facebook": p["link"], "texto": ""})
        if len(p["t"]) > len(textos[pid]["texto"]):
            textos[pid]["texto"] = p["t"]
        print(pid, "->", n, "fotos")
    (RAIZ / "datos").mkdir(exist_ok=True)
    (RAIZ / "datos" / "textos_facebook.json").write_text(
        json.dumps(textos, ensure_ascii=False, indent=1), encoding="utf-8")

if __name__ == "__main__":
    main(sys.argv[1])
