/* ═══════════════════════════════════════════════════════════════════════
   DISCURSOS NAS ALAS (terceiro domingo de cada mês)
   Lê o calendário de discursos na planilha do Google e monta a página.

   VOCÊ NÃO PRECISA MEXER NESTE ARQUIVO.
   Para alterar os discursos, entre em
   Área da Liderança > Discursos nas Alas.

   Este arquivo também é usado pela tela de edição, que aproveita
   os nomes dos tipos e o desenho dos cartões.
   ═══════════════════════════════════════════════════════════════════════ */

// Tipos de domingo e o texto que aparece quando a observação está vazia
const TIPOS_DISCURSO = {
  sumo:         { nome: 'Sumo Conselho',                       texto: 'Tema será definido pela Presidência' },
  alas:         { nome: 'Alas',                                texto: 'Neste dia as Alas são responsáveis pelo último discurso' },
  organizacoes: { nome: 'Organizações da Estaca · Tema livre', texto: '' },
  conferencia:  { nome: 'Conferência da Estaca',               texto: '' },
  outro:        { nome: 'Outro',                               texto: '' }
};

const MESES_DISCURSO = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
                        'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

const CHAVE_COPIA_DISCURSOS = 'estaca-discursos-copia';

/* Reserva: o calendário de 2026, usado só se a planilha não responder e o
   aparelho ainda não tiver uma cópia guardada. */
const RESERVA_DISCURSOS = [
  ['18/01/2026', 'sumo', 'Tema será definido pela Presidência', []],
  ['15/02/2026', 'alas', 'Neste dia as Alas são responsáveis pelo último discurso', []],
  ['15/03/2026', 'organizacoes', '', [['Ala Cabula', 'THF'], ['Ala Cajazeiras', 'Escola Dominical'], ['Ala Engomadeira', 'Moças'], ['Ala Jaguaripe', 'Rapazes'], ['Ala Pernambués', 'Sociedade de Socorro'], ['Ala Sete de Abril', 'Primária'], ['Ala Tancredo Neves', 'Autossuficiência']]],
  ['19/04/2026', 'sumo', 'Tema será definido pela Presidência', []],
  ['17/05/2026', 'organizacoes', '', [['Ala Cabula', 'MAS'], ['Ala Cajazeiras', 'THF'], ['Ala Engomadeira', 'Escola Dominical'], ['Ala Jaguaripe', 'Moças'], ['Ala Pernambués', 'Rapazes'], ['Ala Sete de Abril', 'Conferência da Ala'], ['Ala Tancredo Neves', 'Primária']]],
  ['21/06/2026', 'alas', 'Neste dia as Alas são responsáveis pelo último discurso', []],
  ['19/07/2026', 'sumo', 'Tema será definido pela Presidência', []],
  ['16/08/2026', 'conferencia', '', []],
  ['20/09/2026', 'alas', 'Neste dia as Alas são responsáveis pelo último discurso', []],
  ['18/10/2026', 'sumo', 'Tema será definido pela Presidência', []],
  ['15/11/2026', 'organizacoes', '', [['Ala Cabula', 'Escola Dominical'], ['Ala Cajazeiras', 'JAS'], ['Ala Engomadeira', 'Apresentação da Primária'], ['Ala Jaguaripe', 'Sociedade de Socorro'], ['Ala Pernambués', 'Autossuficiência'], ['Ala Sete de Abril', 'Moças'], ['Ala Tancredo Neves', 'Rapazes']]],
  ['20/12/2026', 'alas', 'Neste dia as Alas são responsáveis pelo último discurso', []]
].map(function (x, i) {
  return { id: 'r' + i, data: x[0], tipo: x[1], titulo: '', texto: x[2],
           itens: x[3].map(function (a) { return { ala: a[0], valor: a[1] }; }) };
});


/* ─────────────────────────── AUXILIARES ────────────────────────────── */

function escaparDiscurso(texto) {
  const div = document.createElement('div');
  div.textContent = texto == null ? '' : texto;
  return div.innerHTML;
}

function partesDataDiscurso(texto) {
  const r = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(String(texto || ''));
  return r ? { dia: +r[1], mes: +r[2], ano: +r[3] } : null;
}

function ordemDiscurso(d) {
  const p = partesDataDiscurso(d.data);
  return p ? p.ano * 10000 + p.mes * 100 + p.dia : 99999999;
}

function tituloDiscurso(d) {
  if (d.tipo === 'outro') return d.titulo || 'Outro';
  return TIPOS_DISCURSO[d.tipo] ? TIPOS_DISCURSO[d.tipo].nome : 'A definir';
}

/** "Ala Sete de Abril" vira "Sete de Abril" no cartão. */
function nomeCurtoAla(ala) {
  return String(ala || '').replace(/^Ala\s+/i, '');
}

/**
 * Desenha o cartão de um domingo.
 * opcoes.atual: marca como "Este mês". opcoes.rodape: HTML extra no fim (botões do editor).
 */
function cartaoDiscurso(d, opcoes) {
  opcoes = opcoes || {};
  const p = partesDataDiscurso(d.data);
  const data = p ? p.dia + ' de ' + MESES_DISCURSO[p.mes - 1] : 'Data a definir';
  const itens = Array.isArray(d.itens) ? d.itens : [];

  return '' +
    '<article class="disc-cartao' + (opcoes.atual ? ' atual' : '') + (d.tipo ? '' : ' a-definir') + '">' +
      '<header class="disc-cab">' +
        '<h3>' + data + (opcoes.comAno && p ? ' <span>' + p.ano + '</span>' : '') + '</h3>' +
        (opcoes.atual ? '<span class="disc-tag">Este mês</span>' : '') +
      '</header>' +
      '<div class="disc-corpo">' +
        '<strong class="disc-tipo">' + escaparDiscurso(tituloDiscurso(d)) + '</strong>' +
        (d.texto ? '<p class="disc-texto">' + escaparDiscurso(d.texto) + '</p>' : '') +
        (itens.length
          ? '<ul class="disc-alas">' + itens.map(function (i) {
              return '<li><span>' + escaparDiscurso(nomeCurtoAla(i.ala)) + '</span>' + escaparDiscurso(i.valor) + '</li>';
            }).join('') + '</ul>'
          : '') +
      '</div>' +
      (opcoes.rodape || '') +
    '</article>';
}

/** O domingo do mês corrente; se o mês não tiver, o próximo; se não houver próximo, o último. */
function indiceDoMesCorrente(lista) {
  const hoje = new Date();
  const mes = hoje.getMonth() + 1;
  const ano = hoje.getFullYear();
  let i = lista.findIndex(function (d) {
    const p = partesDataDiscurso(d.data);
    return p && p.mes === mes && p.ano === ano;
  });
  if (i !== -1) return i;
  const chaveHoje = ano * 10000 + mes * 100 + hoje.getDate();
  i = lista.findIndex(function (d) { return ordemDiscurso(d) >= chaveHoje; });
  return i !== -1 ? i : lista.length - 1;
}

function ehMesCorrente(d) {
  const p = partesDataDiscurso(d.data);
  const hoje = new Date();
  return !!p && p.mes === hoje.getMonth() + 1 && p.ano === hoje.getFullYear();
}


/* ─────────────────────────── PÁGINA PÚBLICA ────────────────────────── */

let DISCURSOS_LISTA = [];
let visaoDiscursos = 'mes';
let indiceDiscurso = 0;
let anoDiscursos = 0;

function montarMesDiscursos() {
  const d = DISCURSOS_LISTA[indiceDiscurso];
  const p = partesDataDiscurso(d.data);
  return '' +
    '<div class="mes-nav disc-nav">' +
      '<button class="mes-btn" id="disc-anterior" aria-label="Mês anterior"' + (indiceDiscurso === 0 ? ' disabled' : '') + '>' +
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>' +
      '</button>' +
      '<h2>' + (p ? MESES_DISCURSO[p.mes - 1] + ' ' + p.ano : 'Sem data') + '</h2>' +
      '<button class="mes-btn" id="disc-seguinte" aria-label="Próximo mês"' + (indiceDiscurso === DISCURSOS_LISTA.length - 1 ? ' disabled' : '') + '>' +
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 6 15 12 9 18"/></svg>' +
      '</button>' +
    '</div>' +
    '<div class="disc-destaque">' + cartaoDiscurso(d, { atual: ehMesCorrente(d) }) + '</div>';
}

function montarAnoDiscursos() {
  const anos = [];
  DISCURSOS_LISTA.forEach(function (d) {
    const p = partesDataDiscurso(d.data);
    if (p && anos.indexOf(p.ano) === -1) anos.push(p.ano);
  });
  if (anos.indexOf(anoDiscursos) === -1) anoDiscursos = anos[anos.length - 1];

  let html = '';
  if (anos.length > 1) {
    html += '<div class="cal-filtros">' + anos.map(function (a) {
      return '<button class="filtro-pill' + (a === anoDiscursos ? ' ativo' : '') + '" data-ano="' + a + '">' + a + '</button>';
    }).join('') + '</div>';
  }
  html += '<div class="disc-grade">' +
    DISCURSOS_LISTA.filter(function (d) {
      const p = partesDataDiscurso(d.data);
      return p && p.ano === anoDiscursos;
    }).map(function (d) { return cartaoDiscurso(d, { atual: ehMesCorrente(d) }); }).join('') +
    '</div>';
  return html;
}

function renderizarDiscursos() {
  const area = document.getElementById('disc-conteudo');
  if (!DISCURSOS_LISTA.length) {
    area.innerHTML = '<p class="cal-vazio">Nenhum domingo de discursos cadastrado.</p>';
    return;
  }
  area.innerHTML = visaoDiscursos === 'mes' ? montarMesDiscursos() : montarAnoDiscursos();

  const anterior = document.getElementById('disc-anterior');
  const seguinte = document.getElementById('disc-seguinte');
  if (anterior) anterior.addEventListener('click', function () { indiceDiscurso--; renderizarDiscursos(); });
  if (seguinte) seguinte.addEventListener('click', function () { indiceDiscurso++; renderizarDiscursos(); });
  area.querySelectorAll('[data-ano]').forEach(function (b) {
    b.addEventListener('click', function () { anoDiscursos = Number(b.getAttribute('data-ano')); renderizarDiscursos(); });
  });

  const atual = area.querySelector('.disc-grade .disc-cartao.atual');
  if (atual && visaoDiscursos === 'ano' && !renderizarDiscursos.rolou) {
    renderizarDiscursos.rolou = true;
    atual.scrollIntoView({ block: 'center' });
  }
}

function ligarAbasDiscursos() {
  document.querySelectorAll('.disc-aba').forEach(function (aba) {
    aba.addEventListener('click', function () {
      document.querySelectorAll('.disc-aba').forEach(function (a) { a.classList.remove('ativo'); });
      aba.classList.add('ativo');
      visaoDiscursos = aba.getAttribute('data-visao');
      renderizarDiscursos();
    });
  });
}

function receberDiscursos(lista) {
  DISCURSOS_LISTA = (lista || []).slice().sort(function (a, b) { return ordemDiscurso(a) - ordemDiscurso(b); });
  indiceDiscurso = Math.max(0, indiceDoMesCorrente(DISCURSOS_LISTA));
  const p = DISCURSOS_LISTA.length ? partesDataDiscurso(DISCURSOS_LISTA[indiceDiscurso].data) : null;
  anoDiscursos = p ? p.ano : new Date().getFullYear();
}

function iniciarDiscursos() {
  const area = document.getElementById('disc-conteudo');
  if (!area) return;

  const temPlanilha = typeof planilhaConfigurada === 'function' && planilhaConfigurada() &&
                      typeof planilhaDiscursos === 'function';

  const daPlanilha = temPlanilha
    ? planilhaDiscursos().then(function (r) {
        try { window.localStorage.setItem(CHAVE_COPIA_DISCURSOS, JSON.stringify(r.discursos)); } catch (e) { /* sem espaço */ }
        return r.discursos;
      })
    : Promise.reject(new Error('sem planilha'));

  daPlanilha
    .catch(function () {
      try {
        const copia = JSON.parse(window.localStorage.getItem(CHAVE_COPIA_DISCURSOS) || 'null');
        if (Array.isArray(copia) && copia.length) return copia;
      } catch (e) { /* segue para a reserva */ }
      return RESERVA_DISCURSOS;
    })
    .then(function (lista) {
      receberDiscursos(lista);
      ligarAbasDiscursos();
      renderizarDiscursos();
    });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', iniciarDiscursos);
} else {
  iniciarDiscursos();
}
