/* ═══════════════════════════════════════════════════════════════════════
   TREINAMENTOS
   Lê a lista de treinamentos na planilha do Google e monta a página.

   VOCÊ NÃO PRECISA MEXER NESTE ARQUIVO.
   Para criar, alterar ou remover treinamentos, entre em
   Área da Liderança > Treinamentos.

   Este arquivo também é usado pela tela de edição, que aproveita o
   reconhecimento dos links e o desenho do player.
   ═══════════════════════════════════════════════════════════════════════ */

const CHAVE_COPIA_TREINAMENTOS = 'estaca-treinamentos-copia';

/* Reserva: os treinamentos que estavam no site, usados só se a planilha
   não responder e o aparelho ainda não tiver uma cópia guardada. */
const RESERVA_TREINAMENTOS = [
  { id: 'r1', titulo: 'Treinamento de Novos Bispos', descricao: 'Orientações para bispos recém-chamados',
    conteudo: 'https://www.canva.com/design/DAGYwGNIEUw/Z1ZAyrvPEoPnz980KazJfg/view?embed', proporcao: 56.25 },
  { id: 'r2', titulo: 'Treinamento de Secretários de Ala', descricao: 'Procedimentos e boas práticas para secretários de ala',
    conteudo: 'https://www.canva.com/design/DAGebluLdWk/HdFhBpGgz8Z_TSBLU8UQnA/view?embed', proporcao: 75 },
  { id: 'r3', titulo: 'Visão da Primeira Presidência para nossa Estaca', descricao: 'Prioridades para o Conselho',
    conteudo: 'https://drive.google.com/file/d/1eKsHNd5ex0cZVCMXSKVunsuxKLllbBdB/preview', proporcao: 56.25 },
  { id: 'r4', titulo: 'Como enviar o Relatório Trimestral',
    descricao: 'Referência do Manual Geral 33. Material revisado anualmente. Última revisão: 2026',
    conteudo: 'https://sway.cloud.microsoft/s/hfTT2rXFRilRHf8S/embed', proporcao: 65.79 }
];


/* ─────────────────────── RECONHECER O CONTEÚDO ─────────────────────── */

/**
 * Recebe o que foi colado (código do Canva, link do Drive, Sway ou YouTube)
 * e devolve o endereço do player e a proporção da altura.
 * Só estes serviços são aceitos; qualquer outra coisa volta null.
 */
function reconhecerConteudo(texto) {
  const t = String(texto || '').trim();
  if (!t) return null;
  const proporcaoDoCodigo = /padding-top:\s*([\d.]+)%/i.exec(t);
  let m;

  m = /https:\/\/www\.canva\.com\/design\/([\w-]+)\/([\w-]+)\/view/i.exec(t);
  if (m) {
    return { tipo: 'Canva', proporcao: proporcaoDoCodigo ? Number(proporcaoDoCodigo[1]) : 56.25,
             src: 'https://www.canva.com/design/' + m[1] + '/' + m[2] + '/view?embed' };
  }

  m = /drive\.google\.com\/file\/d\/([\w-]+)/i.exec(t) || /drive\.google\.com\/(?:open|uc)\?(?:[^#\s"]*&)?id=([\w-]+)/i.exec(t);
  if (m) {
    const chave = /[?&]resourcekey=([\w-]+)/i.exec(t);
    return { tipo: 'Google Drive', proporcao: 56.25,
             src: 'https://drive.google.com/file/d/' + m[1] + '/preview' + (chave ? '?resourcekey=' + chave[1] : '') };
  }

  m = /docs\.google\.com\/(presentation|document)\/d\/([\w-]+)/i.exec(t);
  if (m && m[2] !== 'e') {
    return { tipo: 'Google Drive', proporcao: 56.25,
             src: 'https://docs.google.com/' + m[1] + '/d/' + m[2] + '/preview' };
  }

  m = /https:\/\/(sway\.cloud\.microsoft|sway\.office\.com)\/s\/([\w-]+)/i.exec(t);
  if (m) {
    return { tipo: 'Sway', proporcao: 65.79, src: 'https://' + m[1].toLowerCase() + '/s/' + m[2] + '/embed' };
  }

  m = /(?:youtube\.com\/watch\?(?:[^#\s"]*&)?v=|youtu\.be\/|youtube(?:-nocookie)?\.com\/(?:embed|shorts)\/)([\w-]{11})/i.exec(t);
  if (m) {
    return { tipo: 'YouTube', proporcao: 56.25, src: 'https://www.youtube-nocookie.com/embed/' + m[1] };
  }

  return null;
}

function escaparTreinamento(texto) {
  const div = document.createElement('div');
  div.textContent = texto == null ? '' : texto;
  return div.innerHTML;
}

/**
 * Player de um treinamento. O endereço só é usado depois de passar
 * de novo pelo reconhecimento, para nunca entrar outra coisa na página.
 * O vídeo ou apresentação só carrega quando o treinamento é aberto.
 */
function htmlPlayer(conteudo, proporcao, carregarJa) {
  const r = reconhecerConteudo(conteudo);
  if (!r) {
    return '<div class="embed-wrapper"><div class="embed-placeholder"><p>' +
      (conteudo ? 'Link não reconhecido.' : 'Material em preparação.') + '</p></div></div>';
  }
  const altura = Math.min(150, Math.max(30, Number(proporcao) || r.proporcao));
  return '' +
    '<div class="embed-wrapper tem-conteudo">' +
      '<div class="trein-player' + (r.tipo === 'Sway' ? ' trein-alto' : '') + '" style="padding-top:' + altura + '%">' +
        '<iframe ' + (carregarJa ? 'src' : 'data-src') + '="' + escaparTreinamento(r.src) + '" ' +
          'allow="autoplay; fullscreen" allowfullscreen loading="lazy" title="Material do treinamento"></iframe>' +
      '</div>' +
    '</div>';
}


/* ──────────────────────────── SANFONA ──────────────────────────────── */

function abrirTreinamento(item) {
  const corpo = item.querySelector('.accordion-body');
  item.classList.add('open');
  item.querySelectorAll('iframe[data-src]').forEach(function (q) {
    if (!q.getAttribute('src')) q.setAttribute('src', q.getAttribute('data-src'));
  });
  corpo.style.maxHeight = corpo.scrollHeight + 'px';
  // Depois de abrir, libera a altura para acompanhar a tela (ex.: girar o celular)
  setTimeout(function () {
    if (item.classList.contains('open')) corpo.style.maxHeight = 'none';
  }, 400);
}

function fecharTreinamento(item) {
  const corpo = item.querySelector('.accordion-body');
  corpo.style.maxHeight = corpo.scrollHeight + 'px';
  void corpo.offsetHeight;
  corpo.style.maxHeight = null;
  item.classList.remove('open');
  // Tira o vídeo ou a apresentação para parar o som ao fechar
  item.querySelectorAll('iframe[data-src]').forEach(function (q) { q.removeAttribute('src'); });
}

function alternarTreinamento(cabecalho) {
  const item = cabecalho.parentElement;
  const aberto = item.classList.contains('open');
  document.querySelectorAll('.accordion-item.open').forEach(function (outro) {
    if (outro !== item) fecharTreinamento(outro);
  });
  if (aberto) fecharTreinamento(item);
  else abrirTreinamento(item);
}

function htmlTreinamento(t) {
  return '' +
    '<div class="accordion-item">' +
      '<button class="accordion-header" type="button">' +
        '<div>' +
          '<div class="accordion-title">' + escaparTreinamento(t.titulo) + '</div>' +
          (t.descricao ? '<div class="accordion-subtitle">' + escaparTreinamento(t.descricao) + '</div>' : '') +
        '</div>' +
        '<svg class="accordion-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>' +
      '</button>' +
      '<div class="accordion-body"><div class="accordion-body-inner">' + htmlPlayer(t.conteudo, t.proporcao, false) + '</div></div>' +
    '</div>';
}


/* ─────────────────────────── PÁGINA PÚBLICA ────────────────────────── */

function montarTreinamentos(lista) {
  const area = document.getElementById('trein-lista');
  if (!lista.length) {
    area.innerHTML = '<p class="cal-vazio">Nenhum treinamento cadastrado.</p>';
    return;
  }
  area.innerHTML = lista.map(htmlTreinamento).join('');
  area.querySelectorAll('.accordion-header').forEach(function (b) {
    b.addEventListener('click', function () { alternarTreinamento(b); });
  });
}

function iniciarTreinamentos() {
  const area = document.getElementById('trein-lista');
  if (!area) return;

  const temPlanilha = typeof planilhaConfigurada === 'function' && planilhaConfigurada() &&
                      typeof ENDERECO_PLANILHA !== 'undefined';

  const daPlanilha = temPlanilha
    ? fetch(ENDERECO_PLANILHA + '?acao=treinamentos&v=' + Date.now())
        .then(function (r) { if (!r.ok) throw new Error('planilha'); return r.json(); })
        .then(function (r) {
          if (!r.ok || !Array.isArray(r.treinamentos)) throw new Error('sem treinamentos');
          try { window.localStorage.setItem(CHAVE_COPIA_TREINAMENTOS, JSON.stringify(r.treinamentos)); } catch (e) { /* sem espaço */ }
          return r.treinamentos;
        })
    : Promise.reject(new Error('sem planilha'));

  daPlanilha
    .catch(function () {
      try {
        const copia = JSON.parse(window.localStorage.getItem(CHAVE_COPIA_TREINAMENTOS) || 'null');
        if (Array.isArray(copia) && copia.length) return copia;
      } catch (e) { /* segue para a reserva */ }
      return RESERVA_TREINAMENTOS;
    })
    .then(montarTreinamentos);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', iniciarTreinamentos);
} else {
  iniciarTreinamentos();
}
