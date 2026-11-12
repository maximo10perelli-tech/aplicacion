/**
 * Dashboard Interactivo - Copa Sudamericana 2024
 * Versión 100% Frontend autónoma (carga datos directamente desde datos_copa.json)
 */

let partidosGlobales = [];
let filtroActual = 'todos';
let busquedaActual = '';

// Referencias al DOM
const contenedorPartidos = document.getElementById('contenedor-partidos');
const modal = document.getElementById('modal-estadisticas');
const btnCerrarModal = document.getElementById('btn-cerrar-modal');
const modalContenido = document.getElementById('modal-contenido');
const inputBuscar = document.getElementById('input-buscar');
const filterTabs = document.getElementById('filter-tabs');
const totalPartidosEl = document.getElementById('total-partidos');
const totalGolesEl = document.getElementById('total-goles');

// Inicialización
document.addEventListener('DOMContentLoaded', () => {
  cargarDatosCopa();
  configurarEventos();
});

/**
 * Carga el archivo JSON local con los datos de los partidos
 */
async function cargarDatosCopa() {
  try {
    contenedorPartidos.innerHTML = '<div class="mensaje-estado">Cargando datos del torneo...</div>';

    const respuesta = await fetch('datos_copa.json');
    if (!respuesta.ok) {
      throw new Error(`No se pudo cargar datos_copa.json (${respuesta.status})`);
    }

    partidosGlobales = await respuesta.json();
    
    // Calcular estadísticas globales
    actualizarResumenGlobal(partidosGlobales);
    
    // Renderizar
    filtrarYRenderizar();

  } catch (error) {
    console.error('Error al cargar datos:', error);
    contenedorPartidos.innerHTML = `
      <div class="mensaje-estado error">
        <p><strong>Error al cargar los datos de la Copa.</strong></p>
        <p style="font-size: 0.85rem; margin-top: 0.5rem;">
          Verifica que el archivo <code>datos_copa.json</code> esté en la misma carpeta.
        </p>
      </div>
    `;
  }
}

/**
 * Actualiza las cajas de resumen superior (partidos y goles totales)
 */
function actualizarResumenGlobal(partidos) {
  totalPartidosEl.textContent = partidos.length;
  
  let golesTotales = 0;
  partidos.forEach(p => {
    golesTotales += (p.goles_local || 0) + (p.goles_visitante || 0);
  });
  totalGolesEl.textContent = golesTotales;
}

/**
 * Configura los eventos de búsqueda, pestañas de filtro y modal
 */
function configurarEventos() {
  // Búsqueda en tiempo real
  inputBuscar.addEventListener('input', (e) => {
    busquedaActual = e.target.value.toLowerCase().trim();
    filtrarYRenderizar();
  });

  // Pestañas de filtro por fase
  filterTabs.addEventListener('click', (e) => {
    if (e.target.classList.contains('tab-btn')) {
      document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
      e.target.classList.add('active');
      filtroActual = e.target.dataset.fase;
      filtrarYRenderizar();
    }
  });

  // Modal
  btnCerrarModal.addEventListener('click', cerrarModal);
  modal.addEventListener('click', (e) => {
    if (e.target === modal) cerrarModal();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !modal.classList.contains('hidden')) {
      cerrarModal();
    }
  });
}

/**
 * Filtra los partidos según la fase seleccionada y el texto de búsqueda
 */
function filtrarYRenderizar() {
  let resultado = partidosGlobales;

  // Filtrar por fase
  if (filtroActual !== 'todos') {
    resultado = resultado.filter(p => p.fase.toLowerCase().includes(filtroActual));
  }

  // Filtrar por texto de búsqueda (equipo, estadio, fase, fecha, etc.)
  if (busquedaActual !== '') {
    resultado = resultado.filter(p => {
      const texto = `${p.fase} ${p.equipo_local} ${p.equipo_visitante} ${p.estadio} ${p.ganador} ${p.fecha}`.toLowerCase();
      return texto.includes(busquedaActual);
    });
  }

  renderizarTarjetas(resultado);
}

/**
 * Renderiza las tarjetas de partidos en el grid principal
 */
function renderizarTarjetas(partidos) {
  if (partidos.length === 0) {
    contenedorPartidos.innerHTML = `
      <div class="mensaje-estado">
        No se encontraron partidos que coincidan con la búsqueda.
      </div>
    `;
    return;
  }

  contenedorPartidos.innerHTML = '';

  partidos.forEach(partido => {
    const esGanadorLocal = partido.ganador === partido.equipo_local;
    const esGanadorVisitante = partido.ganador === partido.equipo_visitante;
    const esFinal = partido.fase.toLowerCase().includes('final');

    const penalesTexto = partido.penales && partido.penales.hubo_penales
      ? `<span style="font-size: 0.75rem; color: #f59e0b; font-weight: 600;">(Pen: ${partido.penales.local}-${partido.penales.visitante})</span>`
      : '';

    const estadioCorto = partido.estadio.split(',')[0];

    const tarjeta = document.createElement('article');
    tarjeta.className = `card-partido ${esFinal ? 'es-final' : ''}`;
    tarjeta.tabIndex = 0;
    tarjeta.setAttribute('aria-label', `Partido: ${partido.equipo_local} vs ${partido.equipo_visitante}`);

    tarjeta.innerHTML = `
      <div class="card-header">
        <span class="card-fase">${partido.fase}</span>
        <span>${partido.fecha}</span>
      </div>

      <div class="marcador-contenedor">
        <div class="fila-equipo ${esGanadorLocal ? 'ganador' : ''}">
          <span class="nombre-equipo">
            ${partido.equipo_local}
            ${esGanadorLocal ? '🏆' : ''}
          </span>
          <span class="goles">${partido.goles_local}</span>
        </div>

        <div class="fila-equipo ${esGanadorVisitante ? 'ganador' : ''}">
          <span class="nombre-equipo">
            ${partido.equipo_visitante}
            ${esGanadorVisitante ? '🏆' : ''}
          </span>
          <span class="goles">${partido.goles_visitante}</span>
        </div>
      </div>

      <div class="card-footer">
        <span class="estadio-info" title="${partido.estadio}">📍 ${estadioCorto} ${penalesTexto}</span>
        <button class="btn-ver-stats" data-id="${partido.id}">Ver Estadísticas</button>
      </div>
    `;

    tarjeta.addEventListener('click', () => abrirModalPartido(partido.id));
    tarjeta.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') abrirModalPartido(partido.id);
    });

    contenedorPartidos.appendChild(tarjeta);
  });
}

/**
 * Abre el modal con las estadísticas detalladas y goleadores de un partido
 */
function abrirModalPartido(partidoId) {
  const partido = partidosGlobales.find(p => p.id === partidoId);
  if (!partido) return;

  modal.classList.remove('hidden');
  renderizarDetalleModal(partido);
}

/**
 * Genera el contenido HTML del modal
 */
function renderizarDetalleModal(partido) {
  const stats = partido.estadisticas;
  const local = partido.equipo_local;
  const visit = partido.equipo_visitante;

  const penalesInfo = partido.penales && partido.penales.hubo_penales
    ? `<div style="font-size: 0.85rem; color: #f59e0b; font-weight: 700; margin-top: 0.35rem;">Definición por Penales: ${partido.penales.local} - ${partido.penales.visitante}</div>`
    : '';

  const campeonBadge = partido.campeon 
    ? `<div style="font-size: 0.9rem; color: #f59e0b; font-weight: 800; margin-top: 0.35rem;">🏆 ¡CAMPEÓN DE LA COPA SUDAMERICANA 2024! 🏆</div>` 
    : '';

  // Renderizar lista de goleadores si existe
  let goleadoresHtml = '';
  if (partido.goleadores && partido.goleadores.length > 0) {
    const items = partido.goleadores.map(g => `
      <div class="gol-item">
        <span style="color: #38bdf8; font-weight: 700;">⚽ ${g.minuto}</span>
        <span style="flex: 1; margin-left: 1rem; color: #f8fafc;">${g.jugador}</span>
        <span style="color: #94a3b8; font-size: 0.8rem;">(${g.equipo})</span>
      </div>
    `).join('');

    goleadoresHtml = `
      <div class="seccion-goles">
        <h3>Goles del Partido</h3>
        <div class="lista-goleadores">
          ${items}
        </div>
      </div>
    `;
  }

  modalContenido.innerHTML = `
    <div class="modal-marcador-central">
      <div class="team-col">
        <div class="team-name" style="color: #38bdf8;">${local}</div>
        <div class="score-big">${partido.goles_local}</div>
      </div>
      <div style="font-weight: 900; font-size: 1.3rem; color: #64748b; padding: 0 1rem;">VS</div>
      <div class="team-col">
        <div class="team-name" style="color: #f59e0b;">${visit}</div>
        <div class="score-big">${partido.goles_visitante}</div>
      </div>
    </div>

    <div style="text-align: center; margin-bottom: 1.5rem;">
      <p style="font-size: 0.9rem; color: #94a3b8; font-weight: 600;">${partido.fase} • ${partido.fecha}</p>
      <p style="font-size: 0.85rem; color: #cbd5e1; margin-top: 0.25rem;">📍 ${partido.estadio}</p>
      <p style="font-size: 0.9rem; color: #10b981; font-weight: 700; margin-top: 0.5rem;">
        Ganador: ${partido.ganador}
      </p>
      ${penalesInfo}
      ${campeonBadge}
    </div>

    ${goleadoresHtml}

    <div class="seccion-stats">
      <h3>Estadísticas del Encuentro</h3>
      ${crearBarraEstadistica('Posesión', `${stats.posesion.local}%`, `${stats.posesion.visitante}%`, stats.posesion.local, stats.posesion.visitante)}
      ${crearBarraEstadistica('Remates Totales', stats.remates_totales.local, stats.remates_totales.visitante, stats.remates_totales.local, stats.remates_totales.visitante)}
      ${crearBarraEstadistica('Remates al Arco', stats.remates_al_arco.local, stats.remates_al_arco.visitante, stats.remates_al_arco.local, stats.remates_al_arco.visitante)}
      ${crearBarraEstadistica('Tiros de Esquina', stats.tiros_de_esquina.local, stats.tiros_de_esquina.visitante, stats.tiros_de_esquina.local, stats.tiros_de_esquina.visitante)}
      ${crearBarraEstadistica('Faltas Cometidas', stats.faltas.local, stats.faltas.visitante, stats.faltas.local, stats.faltas.visitante)}
      ${crearBarraEstadistica('Tarjetas Amarillas', stats.tarjetas_amarillas.local, stats.tarjetas_amarillas.visitante, stats.tarjetas_amarillas.local, stats.tarjetas_amarillas.visitante)}
      ${crearBarraEstadistica('Tarjetas Rojas', stats.tarjetas_rojas.local, stats.tarjetas_rojas.visitante, stats.tarjetas_rojas.local, stats.tarjetas_rojas.visitante)}
    </div>
  `;
}

/**
 * Crea una barra de estadística comparativa
 */
function crearBarraEstadistica(titulo, valLocalTexto, valVisitanteTexto, valLocalNum, valVisitanteNum) {
  const suma = valLocalNum + valVisitanteNum;
  let porcentajeLocal = 50;
  let porcentajeVisitante = 50;

  if (suma > 0) {
    porcentajeLocal = Math.round((valLocalNum / suma) * 100);
    porcentajeVisitante = 100 - porcentajeLocal;
  }

  return `
    <div class="stat-row">
      <div class="stat-labels">
        <span style="font-weight: 800; color: #38bdf8;">${valLocalTexto}</span>
        <span class="stat-title">${titulo}</span>
        <span style="font-weight: 800; color: #f59e0b;">${valVisitanteTexto}</span>
      </div>
      <div class="stat-bar-wrapper">
        <div class="stat-bar-local" style="width: ${porcentajeLocal}%;"></div>
        <div class="stat-bar-visitante" style="width: ${porcentajeVisitante}%;"></div>
      </div>
    </div>
  `;
}

function cerrarModal() {
  modal.classList.add('hidden');
}
