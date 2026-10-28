const WA = '5216621245820';
const MAIL = 'asesoresbabira@gmail.com';
const P = window.PROPIEDADES || [];
const $ = s => document.querySelector(s);

const waLink = msg => `https://wa.me/${WA}?text=${encodeURIComponent(msg)}`;
const mailLink = (asunto, cuerpo = '') =>
  `mailto:${MAIL}?subject=${encodeURIComponent(asunto)}&body=${encodeURIComponent(cuerpo)}`;
const dinero = n => n ? '$' + n.toLocaleString('es-MX') + (n < 100000 ? ' / mes' : '') : 'Precio a consultar';
// Tarifas de renta por periodo (solo las que la propiedad tiene registradas)
function tarifas(p) {
  if (p.operacion !== 'Renta') return '';
  const t = [['Día', p.precio_dia], ['Mes', p.precio], ['Año', p.precio_anual]]
    .filter(([, v]) => v).map(([k, v]) => `<span><small>${k}</small>$${v.toLocaleString('es-MX')}</span>`);
  return t.length > 1 ? `<div class="tarifas">${t.join('')}</div>` : '';
}
const msgProp = p => `Hola, me interesa la propiedad ${p.id}: ${p.titulo} (${p.colonia || p.ciudad}). ¿Sigue disponible?`;

function enlaces(root = document) {
  root.querySelectorAll('.js-wa').forEach(a => a.href = waLink(a.dataset.msg || 'Hola'));
  root.querySelectorAll('.js-mail').forEach(a => a.href = mailLink(a.dataset.asunto || 'Información'));
}

const activas = P.filter(p => p.estado !== 'Rentada' && p.estado !== 'Vendida');
$('#sTotal').textContent = activas.length;
$('#sRenta').textContent = activas.filter(p => p.operacion === 'Renta').length;
$('#anio').textContent = new Date().getFullYear();

let op = '';
function filtrar() {
  const txt = $('#fTexto').value.toLowerCase(), c = $('#fCiudad').value, z = $('#fZona').value, r = +$('#fRec').value;
  let L = activas.filter(p => (!op || p.operacion === op) && (!c || p.ciudad === c) && (!z || p.zona === z) &&
    (!r || (p.recamaras || 0) >= r) &&
    (!txt || [p.titulo, p.colonia, p.zona, p.ciudad, p.descripcion, ...p.caracteristicas].join(' ').toLowerCase().includes(txt)));
  const o = $('#fOrden').value;
  if (o !== 'nuevo') L = [...L].sort((a, b) => ((a.precio || 9e12) - (b.precio || 9e12)) * (o === 'pmenor' ? 1 : -1));
  $('#cuenta').textContent = `(${L.length})`;
  $('#grid').innerHTML = L.length ? L.map(card).join('') : '<p class="vacio">No hay propiedades con esos filtros. Escríbenos y te buscamos una.</p>';
}

function card(p) {
  const foto = p.fotos[0]
    ? `<div class="foto" style="background-image:url('${p.fotos[0]}')" data-ver="${p.id}">`
    : `<div class="foto sin" data-ver="${p.id}"><img src="img/logo-babira.png" alt="">`;
  return `<article class="card">${foto}<span class="tag ${p.operacion}">${p.operacion.toUpperCase()}</span>
    ${p.fotos.length > 1 ? `<span class="nfotos">📷 ${p.fotos.length}</span>` : ''}</div>
    <div class="body"><h3>${p.titulo}</h3><div class="zona">📍 ${[p.colonia, p.ciudad].filter(Boolean).join(', ')}</div>
    <div class="precio">${dinero(p.precio)}</div>${tarifas(p)}
    <div class="specs">${p.recamaras ? `<span>🛏 ${p.recamaras} rec.</span>` : ''}${p.banos ? `<span>🛁 ${p.banos} baño${p.banos>1?'s':''}</span>` : ''}
      ${p.m2_terreno ? `<span>📐 ${p.m2_terreno.toLocaleString('es-MX')} m²</span>` : ''}${p.caracteristicas.slice(0, 3).map(s => `<span>${s}</span>`).join('')}</div>
    <div class="cbtn"><a class="w" href="${waLink(msgProp(p))}" target="_blank" rel="noopener">💬 WhatsApp</a>
      <a class="m" href="${mailLink('Interés en ' + p.id, msgProp(p))}">✉️ Correo</a>
      <button class="v" data-ver="${p.id}">Ver</button></div></div></article>`;
}

let gal = [], gi = 0;
function abrir(id) {
  const p = P.find(x => x.id === id); gal = p.fotos.length ? p.fotos : ['img/logo-babira.png']; gi = 0;
  $('#modalIn').innerHTML = `<button class="cerrar" aria-label="Cerrar">✕</button>
    <div class="mgal"><img id="mimg" src="${gal[0]}" alt="${p.titulo}">${gal.length > 1 ? '<button class="prev">‹</button><button class="next">›</button>' : ''}</div>
    ${gal.length > 1 ? `<div class="thumbs">${gal.map((f, i) => `<img src="${f}" data-i="${i}" class="${i ? '' : 'on'}">`).join('')}</div>` : ''}
    <div class="minfo"><span class="tag ${p.operacion}" style="position:static">${p.operacion.toUpperCase()} · ${p.tipo}</span>
      <h3>${p.titulo}</h3><div class="zona">📍 ${[p.colonia, p.zona, p.ciudad].filter(Boolean).join(' · ')}</div>
      <div class="precio">${dinero(p.precio)}</div>${tarifas(p)}
      <div class="specs">${p.recamaras ? `<span>🛏 ${p.recamaras} recámaras</span>` : ''}${p.banos ? `<span>🛁 ${p.banos} baño${p.banos>1?'s':''}</span>` : ''}
        ${p.m2_terreno ? `<span>Terreno ${p.m2_terreno.toLocaleString('es-MX')} m²</span>` : ''}${p.m2_construccion ? `<span>Construcción ${p.m2_construccion} m²</span>` : ''}
        ${p.amueblada && p.amueblada !== 'No' ? `<span>${p.amueblada}</span>` : ''}${p.caracteristicas.map(s => `<span>${s}</span>`).join('')}</div>
      <p>${p.descripcion}</p>${p.condiciones ? `<p><b>Condiciones:</b> ${p.condiciones}</p>` : ''}
      <div class="cbtn"><a class="w" href="${waLink(msgProp(p))}" target="_blank" rel="noopener">💬 Agendar por WhatsApp</a>
        <a class="m" href="${mailLink('Interés en ' + p.id, msgProp(p))}">✉️ Preguntar por correo</a></div>
      <p style="font-size:.75rem">Clave: ${p.id}</p></div>`;
  $('#modal').showModal();
}
function ir(d) {
  gi = (gi + d + gal.length) % gal.length; $('#mimg').src = gal[gi];
  document.querySelectorAll('.thumbs img').forEach((t, i) => t.classList.toggle('on', i === gi));
}

document.addEventListener('click', e => {
  const v = e.target.closest('[data-ver]'); if (v) return abrir(v.dataset.ver);
  if (e.target.closest('.cerrar') || e.target === $('#modal')) return $('#modal').close();
  if (e.target.closest('.prev')) return ir(-1);
  if (e.target.closest('.next')) return ir(1);
  const t = e.target.closest('.thumbs img'); if (t) { gi = +t.dataset.i - 0; ir(0); }
  const b = e.target.closest('#fOp button');
  if (b) { op = b.dataset.v; document.querySelectorAll('#fOp button').forEach(x => x.classList.toggle('on', x === b)); filtrar(); }
});
document.addEventListener('keydown', e => { if ($('#modal').open && e.key === 'ArrowRight') ir(1); if ($('#modal').open && e.key === 'ArrowLeft') ir(-1); });
['#fTexto', '#fCiudad', '#fZona', '#fRec', '#fOrden'].forEach(s => $(s).addEventListener('input', filtrar));

const textoForm = () => `Hola, soy ${$('#nom').value}. ${$('#busca').value}. Presupuesto: ${$('#pres').value || '-'}. Zona: ${$('#zona').value || '-'}. ${$('#msg').value}`;
$('#form').addEventListener('submit', e => { e.preventDefault(); window.open(waLink(textoForm()), '_blank'); });
$('#porCorreo').addEventListener('click', () => { if ($('#form').reportValidity()) location.href = mailLink($('#busca').value, textoForm()); });

enlaces();
filtrar();
