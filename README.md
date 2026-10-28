# Babira Asesores: sitio web y catálogo de propiedades

El sitio web de Babira Asesores Bienes Raíces (Hermosillo y Nogales). El catálogo se arma solo a partir del inventario.

## ¿Cómo agrego una casa nueva? (sin programar)
1. Abre `datos/inventario.csv` en GitHub y pulsa ✏️ (Editar).
2. Copia una fila, cambia el **id** (ej. `BB-016`) y llena los datos. Las características van separadas por `;`.
3. Pulsa **Commit changes**.
4. Sube las fotos: **Add file → Upload files** dentro de `img/casas/BB-016/` (escribe esa ruta al subirlas).
5. En 1–2 minutos el sitio se actualiza solo.

## ¿Cómo marco una casa como rentada o vendida?
Cambia la columna `estado` a `Rentada` o `Vendida` y la casa desaparece del catálogo, pero se queda en el inventario como historial.
También existe `Apartada`.

## Columnas del inventario
`id, estado, operacion (Renta/Venta), tipo, ciudad, zona (Norte/Sur/Poniente), colonia, titulo, precio, recamaras, banos, m2_terreno, m2_construccion, amueblada, caracteristicas, descripcion, condiciones, facebook, fecha_alta`

## Importar fotos de Facebook
`herramientas/importar_facebook.py` toma una extracción de la página de Facebook (JSON) y baja las fotos a la carpeta de cada propiedad.

## Estructura
- `index.html`, `estilos.css`, `app.js`: el sitio.
- `datos/inventario.csv`: **el inventario maestro** (se abre en Excel).
- `datos/propiedades.js`: se genera solo, no lo edites.
- `img/casas/<ID>/`: las fotos de cada propiedad.
- `.github/workflows/publicar.yml`: lo que regenera y publica el sitio en cada cambio.
