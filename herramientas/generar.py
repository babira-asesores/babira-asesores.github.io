"""Convierte datos/inventario.csv + img/casas/<ID>/ en datos/propiedades.js, que es lo que lee el sitio.
Se ejecuta solo en GitHub cada vez que cambia el inventario o se suben fotos.
"""
import csv, json, pathlib

RAIZ = pathlib.Path(__file__).resolve().parent.parent
FOTOS = RAIZ / "img" / "casas"
NUM = {"precio", "precio_dia", "precio_anual", "recamaras", "banos", "m2_terreno", "m2_construccion"}

def numero(v):
    v = v.replace(",", "").replace("$", "").strip()
    if not v:
        return None
    f = float(v)
    return int(f) if f.is_integer() else f

props = []
with open(RAIZ / "datos" / "inventario.csv", encoding="utf-8-sig", newline="") as f:
    for fila in csv.DictReader(f):
        if not fila.get("id") or fila.get("estado") == "Duplicada":
            continue
        p = {k: (numero(v or "") if k in NUM else (v or "").strip()) for k, v in fila.items()}
        p["caracteristicas"] = [c.strip() for c in fila["caracteristicas"].split(";") if c.strip()]
        carpeta = FOTOS / p["id"]
        p["fotos"] = sorted(f"img/casas/{p['id']}/{x.name}" for x in carpeta.glob("*")
                            if x.suffix.lower() in {".jpg", ".jpeg", ".png", ".webp"}) if carpeta.exists() else []
        props.append(p)

orden = {"Disponible": 0, "Apartada": 1, "Rentada": 2, "Vendida": 2}
props.sort(key=lambda p: p["fecha_alta"], reverse=True)
# Las propiedades con más fotos reales (ya curadas) van primero: venden mejor
props.sort(key=lambda p: -min(len(p["fotos"]), 3))
props.sort(key=lambda p: orden.get(p["estado"], 3))
(RAIZ / "datos" / "propiedades.js").write_text(
    "window.PROPIEDADES = " + json.dumps(props, ensure_ascii=False, indent=1) + ";\n", encoding="utf-8")
(RAIZ / "functions" / "propiedades.json").write_text(json.dumps(props, ensure_ascii=False), encoding="utf-8")
print(f"{len(props)} propiedades, {sum(len(p['fotos']) for p in props)} fotos")
