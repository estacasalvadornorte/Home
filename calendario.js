/* ═══════════════════════════════════════════════════════════════════════
   CALENDÁRIO DA ESTACA
   Lê o arquivo calendario.csv e monta as visualizações da página.

   VOCÊ NÃO PRECISA MEXER NESTE ARQUIVO.
   Para alterar os eventos, edite o arquivo calendario.csv
   ═══════════════════════════════════════════════════════════════════════ */

const ARQUIVO_CSV = 'calendario.csv';

const MESES = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
               'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

const MESES_CURTOS = ['JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN',
                      'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ'];

const DIAS_SEMANA = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

// Estado da página
let TODOS_EVENTOS = [];
let filtroTipo = 'Todos';
let mesAtual = new Date().getMonth();
let anoAtual = new Date().getFullYear();
let visaoAtual = 'proximos';


/* ───────────────────────────── LEITURA DO CSV ───────────────────────── */

// Descobre o separador do arquivo: vírgula, ponto e vírgula ou tabulação.
// Isso evita quebrar quando o arquivo vem colado de uma planilha (tabulação)
// ou exportado pelo Excel em português (ponto e vírgula).
function detectarSeparador(linhaCabecalho) {
  const candidatos = [',', ';', '\t'];
  let melhor = ',';
  let maior = 0;

  candidatos.forEach(function (sep) {
    let contagem = 0;
    let dentroDeAspas = false;
    for (let i = 0; i < linhaCabecalho.length; i++) {
      const c = linhaCabecalho[i];
      if (c === '"') dentroDeAspas = !dentroDeAspas;
      else if (c === sep && !dentroDeAspas) contagem++;
    }
    if (contagem > maior) {
      maior = contagem;
      melhor = sep;
    }
  });

  return melhor;
}

// Divide uma linha de CSV respeitando textos entre aspas
function dividirLinha(linha, sep) {
  sep = sep || ',';
  const campos = [];
  let atual = '';
  let dentroDeAspas = false;

  for (let i = 0; i < linha.length; i++) {
    const c = linha[i];
    if (c === '"') {
      if (dentroDeAspas && linha[i + 1] === '"') {
        atual += '"';
        i++;
      } else {
        dentroDeAspas = !dentroDeAspas;
      }
    } else if (c === sep && !dentroDeAspas) {
      campos.push(atual);
      atual = '';
    } else {
      atual += c;
    }
  }
  campos.push(atual);
  return campos.map(function (x) { return x.trim(); });
}

function lerCSV(texto) {
  // Remove a marca invisível que o Excel coloca no início do arquivo (BOM)
  texto = texto.replace(/^\uFEFF/, '');

  const linhas = texto.replace(/\r/g, '').split('\n').filter(function (l) {
    return l.trim() !== '';
  });
  if (linhas.length < 2) return [];

  const sep = detectarSeparador(linhas[0]);

  const cabecalho = dividirLinha(linhas[0], sep).map(function (h) {
    return h.toLowerCase();
  });

  const registros = [];
  for (let i = 1; i < linhas.length; i++) {
    const campos = dividirLinha(linhas[i], sep);
    const obj = {};
    cabecalho.forEach(function (coluna, idx) {
      obj[coluna] = campos[idx] || '';
    });
    const data = interpretarData(obj.data);
    if (!data) continue;
    obj._data = data;
    registros.push(obj);
  }

  registros.sort(function (a, b) {
    const dif = a._data - b._data;
    if (dif !== 0) return dif;
    return (a.horario || '').localeCompare(b.horario || '');
  });

  return registros;
}

// Aceita 15/03/2026 e também 2026-03-15
function interpretarData(texto) {
  if (!texto) return null;
  texto = texto.trim();

  let dia, mes, ano;

  let m = texto.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (m) {
    dia = +m[1]; mes = +m[2]; ano = +m[3];
  } else {
    m = texto.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
    if (!m) return null;
    ano = +m[1]; mes = +m[2]; dia = +m[3];
  }

  const d = new Date(ano, mes - 1, dia);

  // Rejeita datas que não existem, como 31/02 ou 99/99/9999.
  // Sem esta checagem o JavaScript converteria 31/02 em 03/03.
  if (d.getFullYear() !== ano || d.getMonth() !== mes - 1 || d.getDate() !== dia) {
    return null;
  }

  return d;
}


/* ───────────────────────────── AUXILIARES ──────────────────────────── */

function classeTipo(tipo) {
  const mapa = {
    'reunião': 'reuniao',
    'reuniao': 'reuniao',
    'treinamento': 'treinamento',
    'conferência': 'conferencia',
    'conferencia': 'conferencia',
    'atividade': 'atividade'
  };
  return mapa[(tipo || '').toLowerCase()] || 'outro';
}

function escapar(texto) {
  const div = document.createElement('div');
  div.textContent = texto || '';
  return div.innerHTML;
}

function eventosVisiveis() {
  if (filtroTipo === 'Todos') return TODOS_EVENTOS;
  return TODOS_EVENTOS.filter(function (e) { return e.tipo === filtroTipo; });
}

function hojeZerado() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

// Diz se dois eventos caem no mesmo dia.
// Serve para agrupar os eventos do dia e separar um dia do outro.
function mesmoDia(a, b) {
  return !!(a && b) && a._data.getTime() === b._data.getTime();
}

// Classes que agrupam os eventos do mesmo dia nas listas de linhas
// (Por mês e Ano inteiro). A linha separadora só aparece entre dias.
function classesDoDia(lista, i) {
  let classes = '';
  if (mesmoDia(lista[i], lista[i - 1])) classes += ' mesmo-dia';
  if (mesmoDia(lista[i], lista[i + 1])) classes += ' continua';
  return classes;
}


/* ───────────────────────── VISÃO: PRÓXIMOS ─────────────────────────── */

function montarProximos() {
  const hoje = hojeZerado();
  const futuros = eventosVisiveis().filter(function (e) {
    return e._data >= hoje;
  }).slice(0, 12);

  if (futuros.length === 0) {
    return '<p class="cal-vazio">Nenhum evento futuro encontrado para este filtro.</p>';
  }

  const itens = futuros.map(function (e, idx) {
    const d = e._data;
    // Linha separadora quando muda o dia
    const separador = (idx > 0 && !mesmoDia(e, futuros[idx - 1]))
      ? '<div class="dia-sep" aria-hidden="true"></div>'
      : '';
    return separador +
      '<button class="prox-item" data-idx="' + TODOS_EVENTOS.indexOf(e) + '">' +
        '<div class="prox-data tipo-' + classeTipo(e.tipo) + '">' +
          '<span class="prox-dia">' + String(d.getDate()).padStart(2, '0') + '</span>' +
          '<span class="prox-mes">' + MESES_CURTOS[d.getMonth()] + '</span>' +
        '</div>' +
        '<div class="prox-texto">' +
          '<h3>' + escapar(e.evento) + '</h3>' +
          '<p>' +
            (e.horario ? escapar(e.horario) + ' &middot; ' : '') +
            (e.local ? escapar(e.local) : '') +
          '</p>' +
          (e.publico
            ? '<p class="prox-publico">' +
                '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">' +
                  '<path d="M16 20v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2"/>' +
                  '<circle cx="9.5" cy="7" r="3.5"/>' +
                  '<path d="M21 20v-2a4 4 0 0 0-3-3.87"/>' +
                '</svg>' +
                escapar(e.publico) +
              '</p>'
            : '') +
        '</div>' +
        '<span class="prox-tag tipo-' + classeTipo(e.tipo) + '">' + escapar(e.tipo) + '</span>' +
      '</button>';
  }).join('');

  return '<div class="prox-lista">' + itens + '</div>';
}


/* ─────────────────────────── VISÃO: MÊS ────────────────────────────── */

function montarMes() {
  const primeiro = new Date(anoAtual, mesAtual, 1);
  const diasNoMes = new Date(anoAtual, mesAtual + 1, 0).getDate();
  const comecaEm = primeiro.getDay();
  const hoje = hojeZerado();

  const doMes = eventosVisiveis().filter(function (e) {
    return e._data.getFullYear() === anoAtual && e._data.getMonth() === mesAtual;
  });

  // Cabeçalho com navegação
  let html = '' +
    '<div class="mes-nav">' +
      '<button class="mes-btn" id="mesAnterior" aria-label="Mês anterior">' +
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>' +
      '</button>' +
      '<h2>' + MESES[mesAtual] + ' ' + anoAtual + '</h2>' +
      '<button class="mes-btn" id="mesSeguinte" aria-label="Próximo mês">' +
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 6 15 12 9 18"/></svg>' +
      '</button>' +
    '</div>';

  // Grade do calendário
  html += '<div class="grade-cal">';
  DIAS_SEMANA.forEach(function (d) {
    html += '<div class="grade-cabecalho">' + d + '</div>';
  });

  for (let i = 0; i < comecaEm; i++) {
    html += '<div class="grade-dia vazio"></div>';
  }

  for (let dia = 1; dia <= diasNoMes; dia++) {
    const dataDia = new Date(anoAtual, mesAtual, dia);
    const doDia = doMes.filter(function (e) {
      return e._data.getDate() === dia;
    });
    const ehHoje = dataDia.getTime() === hoje.getTime();

    html += '<div class="grade-dia' + (ehHoje ? ' hoje' : '') +
            (doDia.length ? ' com-evento' : '') + '">';
    html += '<span class="grade-numero">' + dia + '</span>';

    if (doDia.length) {
      html += '<div class="grade-pontos">';
      doDia.slice(0, 3).forEach(function (e) {
        html += '<span class="ponto tipo-' + classeTipo(e.tipo) + '" title="' +
                escapar(e.evento) + '"></span>';
      });
      html += '</div>';
    }
    html += '</div>';
  }
  html += '</div>';

  // Lista dos eventos do mês
  if (doMes.length === 0) {
    html += '<p class="cal-vazio">Nenhum evento neste mês para o filtro selecionado.</p>';
  } else {
    html += '<div class="mes-lista">';
    doMes.forEach(function (e, i) {
      const d = e._data;
      html += '' +
        '<button class="mes-item' + classesDoDia(doMes, i) + '" data-idx="' + TODOS_EVENTOS.indexOf(e) + '">' +
          '<span class="mes-item-data">' +
            String(d.getDate()).padStart(2, '0') + '/' +
            String(d.getMonth() + 1).padStart(2, '0') +
            (e.horario ? '<span>' + escapar(e.horario) + '</span>' : '') +
          '</span>' +
          '<span class="mes-item-barra tipo-' + classeTipo(e.tipo) + '"></span>' +
          '<span class="mes-item-texto">' +
            '<strong>' + escapar(e.evento) + '</strong>' +
            (e.local ? '<span>' + escapar(e.local) + '</span>' : '') +
          '</span>' +
        '</button>';
    });
    html += '</div>';
  }

  return html;
}


/* ─────────────────────────── VISÃO: ANO ────────────────────────────── */

function montarAno() {
  const visiveis = eventosVisiveis();
  const anos = {};

  visiveis.forEach(function (e) {
    const a = e._data.getFullYear();
    const m = e._data.getMonth();
    if (!anos[a]) anos[a] = {};
    if (!anos[a][m]) anos[a][m] = [];
    anos[a][m].push(e);
  });

  const listaAnos = Object.keys(anos).sort();
  if (listaAnos.length === 0) {
    return '<p class="cal-vazio">Nenhum evento encontrado para este filtro.</p>';
  }

  let html = '';
  listaAnos.forEach(function (ano) {
    const meses = Object.keys(anos[ano]).sort(function (a, b) { return a - b; });
    meses.forEach(function (m) {
      html += '<section class="ano-mes">';
      html += '<h2 class="ano-mes-titulo">' + MESES[m] + ' <span>' + ano + '</span></h2>';
      html += '<div class="ano-eventos">';
      anos[ano][m].forEach(function (e, i, doMesAno) {
        const d = e._data;
        html += '' +
          '<button class="ano-item' + classesDoDia(doMesAno, i) + '" data-idx="' + TODOS_EVENTOS.indexOf(e) + '">' +
            '<span class="ano-item-dia">' +
              String(d.getDate()).padStart(2, '0') +
              '<span>' + DIAS_SEMANA[d.getDay()] + '</span>' +
            '</span>' +
            '<span class="ano-item-barra tipo-' + classeTipo(e.tipo) + '"></span>' +
            '<span class="ano-item-texto">' +
              '<strong>' + escapar(e.evento) + '</strong>' +
              '<span>' +
                (e.horario ? escapar(e.horario) : '') +
                (e.horario && e.local ? ' &middot; ' : '') +
                (e.local ? escapar(e.local) : '') +
              '</span>' +
            '</span>' +
            '<span class="ano-item-tag tipo-' + classeTipo(e.tipo) + '">' + escapar(e.tipo) + '</span>' +
          '</button>';
      });
      html += '</div></section>';
    });
  });

  return html;
}


/* ──────────────────────────── JANELA DE DETALHE ────────────────────── */

function abrirDetalhe(indice) {
  const e = TODOS_EVENTOS[indice];
  if (!e) return;

  const d = e._data;
  const dataTexto = DIAS_SEMANA[d.getDay()] + ', ' + d.getDate() + ' de ' +
                    MESES[d.getMonth()].toLowerCase() + ' de ' + d.getFullYear();

  const linha = function (rotulo, valor) {
    if (!valor) return '';
    return '<div class="detalhe-linha"><span>' + rotulo + '</span><strong>' +
           escapar(valor) + '</strong></div>';
  };

  const modal = document.createElement('div');
  modal.className = 'detalhe-fundo';
  modal.innerHTML = '' +
    '<div class="detalhe-caixa" role="dialog" aria-modal="true">' +
      '<button class="detalhe-fechar" aria-label="Fechar">' +
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><line x1="6" y1="6" x2="18" y2="18"/><line x1="18" y1="6" x2="6" y2="18"/></svg>' +
      '</button>' +
      '<span class="detalhe-tag tipo-' + classeTipo(e.tipo) + '">' + escapar(e.tipo) + '</span>' +
      '<h2>' + escapar(e.evento) + '</h2>' +
      '<div class="detalhe-corpo">' +
        linha('Data', dataTexto) +
        linha('Horário', e.horario) +
        linha('Local', e.local) +
        linha('Participantes', e.publico) +
        linha('Responsável', e.responsavel) +
      '</div>' +
    '</div>';

  document.body.appendChild(modal);
  document.body.style.overflow = 'hidden';

  const fechar = function () {
    modal.remove();
    document.body.style.overflow = '';
    document.removeEventListener('keydown', aoTeclar);
  };
  const aoTeclar = function (ev) {
    if (ev.key === 'Escape') fechar();
  };

  modal.addEventListener('click', function (ev) {
    if (ev.target === modal) fechar();
  });
  modal.querySelector('.detalhe-fechar').addEventListener('click', fechar);
  document.addEventListener('keydown', aoTeclar);
}


/* ──────────────────────────── RENDERIZAÇÃO ─────────────────────────── */

function renderizar() {
  const area = document.getElementById('cal-conteudo');
  if (!area) return;

  if (visaoAtual === 'proximos') area.innerHTML = montarProximos();
  else if (visaoAtual === 'mes') area.innerHTML = montarMes();
  else area.innerHTML = montarAno();

  // Clique em qualquer evento abre o detalhe
  area.querySelectorAll('[data-idx]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      abrirDetalhe(parseInt(btn.getAttribute('data-idx'), 10));
    });
  });

  // Navegação entre meses
  const anterior = document.getElementById('mesAnterior');
  const seguinte = document.getElementById('mesSeguinte');
  if (anterior) {
    anterior.addEventListener('click', function () {
      mesAtual--;
      if (mesAtual < 0) { mesAtual = 11; anoAtual--; }
      renderizar();
    });
  }
  if (seguinte) {
    seguinte.addEventListener('click', function () {
      mesAtual++;
      if (mesAtual > 11) { mesAtual = 0; anoAtual++; }
      renderizar();
    });
  }
}

function montarFiltros() {
  const tipos = ['Todos'];
  TODOS_EVENTOS.forEach(function (e) {
    if (e.tipo && tipos.indexOf(e.tipo) === -1) tipos.push(e.tipo);
  });

  const area = document.getElementById('cal-filtros');
  if (!area) return;

  area.innerHTML = tipos.map(function (t) {
    const ativo = (t === filtroTipo) ? ' ativo' : '';
    const cor = (t === 'Todos') ? '' : ' tipo-' + classeTipo(t);
    return '<button class="filtro-pill' + ativo + cor + '" data-tipo="' + escapar(t) + '">' +
           escapar(t) + '</button>';
  }).join('');

  area.querySelectorAll('.filtro-pill').forEach(function (btn) {
    btn.addEventListener('click', function () {
      filtroTipo = btn.getAttribute('data-tipo');
      montarFiltros();
      renderizar();
    });
  });
}

function ligarAbas() {
  document.querySelectorAll('.cal-aba').forEach(function (aba) {
    aba.addEventListener('click', function () {
      document.querySelectorAll('.cal-aba').forEach(function (a) {
        a.classList.remove('ativo');
      });
      aba.classList.add('ativo');
      visaoAtual = aba.getAttribute('data-visao');
      renderizar();
    });
  });
}


/* ──────────────────────────── INICIALIZAÇÃO ────────────────────────── */

/* De onde vem o calendário:
   1. da planilha do Google, que é onde a liderança edita os eventos
   2. se a planilha não responder, da última cópia guardada no aparelho
   3. se não houver cópia, do arquivo calendario.csv                      */

const CHAVE_COPIA = 'estaca-calendario-copia';

/** Prepara a lista que veio da planilha, do mesmo jeito que a do CSV. */
function prepararEventos(registros) {
  const prontos = [];
  (registros || []).forEach(function (r) {
    const data = interpretarData(r.data);
    if (!data) return;
    const e = Object.assign({}, r);
    e._data = data;
    prontos.push(e);
  });

  prontos.sort(function (a, b) {
    const dif = a._data - b._data;
    if (dif !== 0) return dif;
    return (a.horario || '').localeCompare(b.horario || '');
  });

  return prontos;
}

function guardarCopia(lista) {
  try {
    window.localStorage.setItem(CHAVE_COPIA, JSON.stringify(lista));
  } catch (e) { /* navegador sem permissão de guardar */ }
}

function lerCopia() {
  try {
    const texto = window.localStorage.getItem(CHAVE_COPIA);
    return texto ? JSON.parse(texto) : null;
  } catch (e) {
    return null;
  }
}

function lerDoArquivo() {
  return fetch(ARQUIVO_CSV + '?v=' + Date.now())
    .then(function (r) {
      if (!r.ok) throw new Error('Não foi possível ler o arquivo');
      return r.text();
    })
    .then(lerCSV);
}

function iniciarCalendario() {
  const area = document.getElementById('cal-conteudo');
  if (!area) return;

  const temPlanilha = typeof planilhaConfigurada === 'function' && planilhaConfigurada();

  const daPlanilha = temPlanilha
    ? planilhaEventos().then(function (lista) {
        const prontos = prepararEventos(lista);
        if (!prontos.length) throw new Error('planilha vazia');
        guardarCopia(lista);
        return prontos;
      })
    : Promise.reject(new Error('sem planilha'));

  daPlanilha
    .catch(function () {
      const copia = lerCopia();
      const prontos = copia ? prepararEventos(copia) : [];
      return prontos.length ? prontos : lerDoArquivo();
    })
    .then(function (lista) {
      TODOS_EVENTOS = lista;

      if (TODOS_EVENTOS.length === 0) {
        area.innerHTML = '<p class="cal-vazio">Nenhum evento cadastrado no calendário.</p>';
        return;
      }

      // Abre no mês atual se houver eventos nele, senão no primeiro mês com eventos
      const hoje = hojeZerado();
      const futuro = TODOS_EVENTOS.find(function (e) { return e._data >= hoje; });
      if (futuro) {
        mesAtual = futuro._data.getMonth();
        anoAtual = futuro._data.getFullYear();
      } else {
        mesAtual = TODOS_EVENTOS[0]._data.getMonth();
        anoAtual = TODOS_EVENTOS[0]._data.getFullYear();
      }

      montarFiltros();
      ligarAbas();
      renderizar();
    })
    .catch(function () {
      area.innerHTML = '' +
        '<div class="cal-erro">' +
          '<strong>Não foi possível carregar o calendário.</strong>' +
          '<p>Se você abriu este arquivo direto do computador com dois cliques, ' +
          'o navegador bloqueia a leitura por segurança. Isso é normal. ' +
          'Depois de enviar os arquivos para o GitHub, o calendário funciona normalmente.</p>' +
          '<p>Se já está no GitHub e o erro continua, confira sua internet e se o arquivo ' +
          '<code>calendario.csv</code> está na mesma pasta das páginas.</p>' +
        '</div>';
    });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', iniciarCalendario);
} else {
  iniciarCalendario();
}
