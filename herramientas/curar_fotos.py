"""Aplica la selección de fotos: quita las que no sirven y renombra el resto en orden de calidad (01 = portada).
La selección y sus razones están en datos/fotos_curadas.json.
"""
import json, pathlib, shutil

RAIZ = pathlib.Path(__file__).resolve().parent.parent
FOTOS = RAIZ / "img" / "casas"
cur = json.loads((RAIZ / "datos" / "fotos_curadas.json").read_text(encoding="utf-8"))

for pid, info in cur.items():
    if pid.startswith("_"):
        continue
    carpeta = FOTOS / pid
    origen = info.get("desde", pid)
    fuente = FOTOS / origen
    tmp = FOTOS / f"_tmp_{pid}"
    tmp.mkdir(exist_ok=True)
    for i, nombre in enumerate(info["orden"], 1):
        shutil.copy2(fuente / nombre, tmp / f"{i:02d}.jpg")
    for viejo in list(carpeta.glob("*.jpg")) if carpeta.exists() else []:
        viejo.unlink()
    carpeta.mkdir(exist_ok=True)
    for f in tmp.iterdir():
        f.rename(carpeta / f.name)
    tmp.rmdir()
    print(pid, len(info["orden"]), "fotos")

for pid in cur.get("_vaciar", []):
    for f in (FOTOS / pid).glob("*.jpg"):
        f.unlink()
    print(pid, "sin fotos")
