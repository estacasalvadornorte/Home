/* ═══════════════════════════════════════════════════════════════════════
   PÁGINA DE TREINAMENTOS
   Lê o arquivo treinamentos.csv e monta as abas e a lista.

   VOCÊ NÃO PRECISA MEXER NESTE ARQUIVO.
   Para alterar os treinamentos, edite o arquivo treinamentos.csv
   ═══════════════════════════════════════════════════════════════════════ */

const ARQUIVO_TREINAMENTOS = 'treinamentos.csv';
const ABA_PADRAO = 'Treinamentos gerais';

let ABAS = [];            // [{ nome, id, itens: [] }]
let ITENS_POR_ID = {};    // id do treinamento -> dados
let abaAtiva = 0;
let itemAberto = null;    // elemento do treinamento aberto no momento


/* ───────────────────────────── AUXILIARES ──────────────────────────── */

function tirarAcentos(texto) {
  return (texto || '').normalize('NFD').replace(/[̀-ͯ]/g, '');
}

function escaparTexto(texto) {
  const div = document.createElement('div');
  div.textContent = texto || '';
  return div.innerHTML;
}

function escaparAtributo(texto) {
  return (texto || '')
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

// Cria um identificador sem acento e sem espaço, usado no link direto
function criarId(texto, usados) {
  const base = tirarAcentos(texto).toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'treinamento';
  let id = base;
  let n = 2;
  while (usados[id]) {
    id = base + '-' + n;
    n++;
  }
  usados[id] = true;
  return id;
}


/* ───────────────────────────── LEITURA DO CSV ───────────────────────── */

function lerTreinamentos(texto) {
  texto = texto.replace(/^﻿/, '');

  const linhas = texto.replace(/\r/g, '').split('\n').filter(function (l) {
    return l.trim() !== '';
  });
  if (linhas.length < 2) return [];

  const sep = csvSeparador(linhas[0]);
  const colunas = csvDividirLinha(linhas[0], sep).map(function (c) {
    return tirarAcentos(c).toLowerCase();
  });
  const posDescricao = colunas.indexOf('descricao');

  const registros = [];
  for (let i = 1; i < linhas.length; i++) {
    const campos = csvDividirLinha(linhas[i], sep);

    // Descarta colunas vazias sobrando no fim da linha
    while (campos.length > colunas.length && campos[campos.length - 1] === '') {
      campos.pop();
    }

    // Se a descrição tiver vírgula sem aspas, a linha fica com colunas a mais.
    // Junta as sobras de volta na descrição para o tipo e o link não se perderem.
    const sobra = campos.length - colunas.length;
    if (sobra > 0 && posDescricao !== -1) {
      const juntos = campos.slice(posDescricao, posDescricao + sobra + 1)
        .join(sep === ',' ? ', ' : ' ');
      campos.splice(posDescricao, sobra + 1, juntos);
    }

    const obj = {};
    colunas.forEach(function (c, idx) {
      obj[c] = campos[idx] || '';
    });
    if (!obj.titulo) continue;
    registros.push(obj);
  }
  return registros;
}


/* ─────────────────────── CONVERSÃO DOS LINKS ───────────────────────── */

// Aceita o link puro ou o código de incorporação inteiro (pega só o src)
function limparLink(bruto) {
  if (!bruto) return '';
  let link = bruto.trim();

  const src = link.match(/src\s*=\s*["']([^"']+)["']/i);
  if (src) link = src[1];

  link = link.replace(/&amp;/g, '&').trim();
  if (!/^https?:\/\//i.test(link)) return '';
  return link.replace(/^http:\/\//i, 'https://');
}

// Link de edição do Canva dá acesso para alterar o design. Nunca publicar.
function ehEdicaoCanva(link) {
  return /canva\.com\/design\/[^?#]*\/edit/i.test(link);
}

// Transforma o link de compartilhamento no endereço do player
function linkParaPlayer(link) {
  if (!link) return null;
  let m;

  // Google Drive: vídeo, PowerPoint, PDF
  m = link.match(/drive\.google\.com\/file\/d\/([\w-]+)/i) ||
      link.match(/drive\.google\.com\/(?:open|uc)\?(?:[^#]*&)?id=([\w-]+)/i);
  if (m) {
    const chave = link.match(/[?&]resourcekey=([\w-]+)/i);
    return 'https://drive.google.com/file/d/' + m[1] + '/preview' +
           (chave ? '?resourcekey=' + chave[1] : '');
  }

  // Google Apresentações ou Documentos publicados na web
  m = link.match(/docs\.google\.com\/(presentation|document)\/d\/e\/([\w-]+)/i);
  if (m) {
    return 'https://docs.google.com/' + m[1] + '/d/e/' + m[2] +
           (m[1] === 'presentation' ? '/embed' : '/pub?embedded=true');
  }

  // Google Apresentações ou Documentos compartilhados por link
  m = link.match(/docs\.google\.com\/(presentation|document)\/d\/([\w-]+)/i);
  if (m) {
    return 'https://docs.google.com/' + m[1] + '/d/' + m[2] + '/preview';
  }

  // Canva
  m = link.match(/canva\.com\/design\/([\w-]+)(?:\/([\w-]+))?/i);
  if (m) {
    const reservado = ['view', 'edit', 'watch'];
    const token = (m[2] && reservado.indexOf(m[2].toLowerCase()) === -1) ? '/' + m[2] : '';
    const modo = /\/watch/i.test(link) ? 'watch' : 'view';
    return 'https://www.canva.com/design/' + m[1] + token + '/' + modo + '?embed';
  }

  // YouTube
  m = link.match(/(?:youtube\.com\/(?:watch\?(?:[^#]*&)?v=|embed\/|shorts\/|live\/)|youtu\.be\/)([\w-]{11})/i);
  if (m) {
    return 'https://www.youtube-nocookie.com/embed/' + m[1] + '?rel=0';
  }

  // Já é um link de incorporação (OneDrive, PowerPoint online e outros)
  if (/embed/i.test(link)) return link;

  return null;
}


/* ─────────────────────────── TIPOS E ÍCONES ────────────────────────── */

function classeTipo(item) {
  const t = tirarAcentos(item.tipo).toLowerCase();
  if (/video|youtube/.test(t)) return 'video';
  if (/apresenta|powerpoint|ppt|slide/.test(t)) return 'apresentacao';
  if (/canva/.test(t)) return 'canva';
  if (/pdf|documento|apostila|manual/.test(t)) return 'documento';

  if (!t && item.link) {
    if (/canva\.com/i.test(item.link)) return 'canva';
    if (/youtu/i.test(item.link)) return 'video';
    if (/docs\.google\.com\/presentation/i.test(item.link)) return 'apresentacao';
  }
  return 'outro';
}

function rotuloTipo(item) {
  if (item.tipo) return item.tipo;
  const nomes = {
    video: 'Vídeo',
    apresentacao: 'Apresentação',
    canva: 'Canva',
    documento: 'Documento'
  };
  return nomes[item.classe] || 'Material';
}

const ICONES = {
  video:
    '<circle cx="12" cy="12" r="9"/>' +
    '<polygon points="10 8.5 15.5 12 10 15.5 10 8.5"/>',
  apresentacao:
    '<rect x="3" y="4" width="18" height="12" rx="1.5"/>' +
    '<line x1="12" y1="16" x2="12" y2="20"/>' +
    '<line x1="8" y1="20" x2="16" y2="20"/>' +
    '<polyline points="7 12.5 10 9.5 13 11.5 17 7.5"/>',
  canva:
    '<rect x="3" y="3" width="18" height="18" rx="2"/>' +
    '<line x1="3" y1="9" x2="21" y2="9"/>' +
    '<line x1="9" y1="9" x2="9" y2="21"/>',
  documento:
    '<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/>' +
    '<polyline points="14 3 14 8 19 8"/>' +
    '<line x1="9" y1="13" x2="15" y2="13"/>' +
    '<line x1="9" y1="17" x2="13" y2="17"/>',
  outro:
    '<path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H19v15H6.5A2.5 2.5 0 0 0 4 20.5z"/>' +
    '<line x1="8" y1="8" x2="15" y2="8"/>' +
    '<line x1="8" y1="12" x2="13" y2="12"/>'
};

function icone(classe) {
  return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" ' +
         'stroke-linecap="round" stroke-linejoin="round">' +
         (ICONES[classe] || ICONES.outro) + '</svg>';
}


/* ─────────────────────────── MONTAGEM ──────────────────────────────── */

function organizar(registros) {
  const usados = {};
  ABAS = [];
  ITENS_POR_ID = {};

  registros.forEach(function (r) {
    const nomeAba = r.aba || ABA_PADRAO;
    let aba = ABAS.find(function (a) { return a.nome === nomeAba; });
    if (!aba) {
      aba = { nome: nomeAba, id: criarId('aba-' + nomeAba, usados), itens: [] };
      ABAS.push(aba);
    }

    const link = limparLink(r.link);
    const item = {
      titulo: r.titulo,
      descricao: r.descricao,
      tipo: r.tipo,
      link: link,
      edicaoCanva: ehEdicaoCanva(link),
      player: ehEdicaoCanva(link) ? null : linkParaPlayer(link),
      aba: ABAS.indexOf(aba),
      id: criarId(r.titulo, usados)
    };
    item.classe = classeTipo(item);

    aba.itens.push(item);
    ITENS_POR_ID[item.id] = item;
  });
}

function montarAbas() {
  const area = document.getElementById('trein-abas');
  if (!area) return;

  // Com uma aba só, a barra de abas não aparece
  area.hidden = ABAS.length < 2;

  area.innerHTML = ABAS.map(function (aba, i) {
    const ativo = (i === abaAtiva);
    return '<button class="aba' + (ativo ? ' ativo' : '') + '" role="tab" ' +
             'aria-selected="' + ativo + '" data-aba="' + i + '">' +
             escaparTexto(aba.nome) +
             '<span class="aba-contagem">' + aba.itens.length + '</span>' +
           '</button>';
  }).join('');

  area.querySelectorAll('.aba').forEach(function (botao) {
    botao.addEventListener('click', function () {
      trocarAba(parseInt(botao.getAttribute('data-aba'), 10));
    });
  });
}

function cartaoItem(item) {
  return '' +
    '<div class="accordion-item trein-item" id="' + item.id + '">' +
      '<button class="accordion-header" aria-expanded="false" ' +
              'aria-controls="' + item.id + '-corpo">' +
        '<span class="trein-icone">' + icone(item.classe) + '</span>' +
        '<span class="trein-cabecalho-texto">' +
          '<span class="accordion-title">' + escaparTexto(item.titulo) + '</span>' +
          (item.descricao
            ? '<span class="accordion-subtitle">' + escaparTexto(item.descricao) + '</span>'
            : '') +
        '</span>' +
        '<span class="trein-tipo">' + escaparTexto(rotuloTipo(item)) + '</span>' +
        '<svg class="accordion-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" ' +
             'stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
          '<polyline points="6 9 12 15 18 9"/>' +
        '</svg>' +
      '</button>' +
      '<div class="accordion-body" id="' + item.id + '-corpo" role="region">' +
        '<div class="accordion-body-inner">' +
          '<div class="trein-conteudo"></div>' +
        '</div>' +
      '</div>' +
    '</div>';
}

function montarLista() {
  const lista = document.getElementById('trein-lista');
  if (!lista) return;

  itemAberto = null;
  const aba = ABAS[abaAtiva];

  if (!aba || !aba.itens.length) {
    lista.innerHTML = '<p class="cal-vazio">Nenhum treinamento nesta aba.</p>';
    return;
  }

  lista.innerHTML = aba.itens.map(cartaoItem).join('');

  lista.querySelectorAll('.trein-item').forEach(function (el) {
    el.querySelector('.accordion-header').addEventListener('click', function () {
      if (el.classList.contains('open')) {
        fecharItem(el);
        limparEndereco();
      } else {
        abrirItem(el, false);
      }
    });
  });
}


/* ─────────────────────── CONTEÚDO DO TREINAMENTO ───────────────────── */

function conteudoDe(item) {
  const acaoAbrir = item.link
    ? '<a class="trein-acao" href="' + escaparAtributo(item.link) + '" ' +
        'target="_blank" rel="noopener">Abrir em nova aba</a>'
    : '';
  const acaoCopiar = '<button class="trein-acao trein-copiar" type="button">' +
                       'Copiar link</button>';

  if (!item.link) {
    return '<p class="trein-aviso">Material ainda não disponível.</p>';
  }

  if (item.edicaoCanva) {
    return '<p class="trein-aviso">Este é um link de edição do Canva e não pode ser publicado. ' +
           'Use o link de incorporação: Compartilhar, Mais, Incorporar.</p>';
  }

  if (!item.player) {
    return '<p class="trein-aviso">Este material abre fora do site.</p>' +
           '<div class="trein-acoes">' +
             '<a class="ed-btn" href="' + escaparAtributo(item.link) + '" ' +
               'target="_blank" rel="noopener">Abrir o treinamento</a>' +
             acaoCopiar +
           '</div>';
  }

  return '<div class="trein-player"></div>' +
         '<div class="trein-acoes">' + acaoAbrir + acaoCopiar + '</div>';
}

function abrirItem(el, rolar) {
  if (itemAberto && itemAberto !== el) fecharItem(itemAberto);

  const item = ITENS_POR_ID[el.id];
  const corpo = el.querySelector('.accordion-body');
  const conteudo = el.querySelector('.trein-conteudo');

  conteudo.innerHTML = conteudoDe(item);

  // O player só é carregado ao abrir, para a página não ficar pesada
  const player = conteudo.querySelector('.trein-player');
  if (player && item.player) {
    const quadro = document.createElement('iframe');
    quadro.src = item.player;
    quadro.title = item.titulo;
    quadro.setAttribute('allow', 'autoplay; fullscreen; encrypted-media; picture-in-picture');
    quadro.setAttribute('allowfullscreen', '');
    player.appendChild(quadro);
  }

  const copiar = conteudo.querySelector('.trein-copiar');
  if (copiar) {
    copiar.addEventListener('click', function () {
      const endereco = window.location.href.split('#')[0] + '#' + el.id;
      copiarTexto(endereco, copiar);
    });
  }

  el.classList.add('open');
  el.querySelector('.accordion-header').setAttribute('aria-expanded', 'true');
  itemAberto = el;

  corpo.style.maxHeight = corpo.scrollHeight + 'px';
  const liberar = function () {
    if (el.classList.contains('open')) corpo.style.maxHeight = 'none';
  };
  corpo.addEventListener('transitionend', liberar, { once: true });
  setTimeout(liberar, 450);

  history.replaceState(null, '', '#' + el.id);
  if (rolar) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function fecharItem(el) {
  const corpo = el.querySelector('.accordion-body');

  // Remove o player na hora para o vídeo parar de tocar
  const quadro = el.querySelector('.trein-player iframe');
  if (quadro) quadro.remove();

  corpo.style.maxHeight = corpo.scrollHeight + 'px';
  void corpo.offsetHeight;
  corpo.style.maxHeight = '0px';

  el.classList.remove('open');
  el.querySelector('.accordion-header').setAttribute('aria-expanded', 'false');
  if (itemAberto === el) itemAberto = null;

  setTimeout(function () {
    if (!el.classList.contains('open')) {
      el.querySelector('.trein-conteudo').innerHTML = '';
    }
  }, 400);
}

function trocarAba(indice) {
  if (itemAberto) fecharItem(itemAberto);
  abaAtiva = indice;
  montarAbas();
  montarLista();
  history.replaceState(null, '', '#' + ABAS[indice].id);
}

function limparEndereco() {
  history.replaceState(null, '', window.location.pathname + window.location.search);
}

function copiarTexto(texto, botao) {
  const rotulo = botao.textContent;
  const confirmar = function () {
    botao.textContent = 'Link copiado';
    setTimeout(function () { botao.textContent = rotulo; }, 1800);
  };
  const alternativa = function () {
    const campo = document.createElement('textarea');
    campo.value = texto;
    campo.setAttribute('readonly', '');
    campo.style.position = 'fixed';
    campo.style.opacity = '0';
    document.body.appendChild(campo);
    campo.select();
    try { document.execCommand('copy'); } catch (e) { /* sem suporte */ }
    campo.remove();
    confirmar();
  };

  if (navigator.clipboard && window.isSecureContext) {
    navigator.clipboard.writeText(texto).then(confirmar, alternativa);
  } else {
    alternativa();
  }
}


/* ─────────────────────── LINK DIRETO (#endereço) ───────────────────── */

// Permite mandar pelo WhatsApp um link que já abre o treinamento certo
function aplicarEndereco() {
  const alvo = decodeURIComponent(window.location.hash.slice(1));
  if (!alvo) return;

  const item = ITENS_POR_ID[alvo];
  if (item) {
    if (item.aba !== abaAtiva) {
      abaAtiva = item.aba;
      montarAbas();
      montarLista();
    }
    const el = document.getElementById(alvo);
    if (el && !el.classList.contains('open')) abrirItem(el, true);
    return;
  }

  const indice = ABAS.findIndex(function (a) { return a.id === alvo; });
  if (indice !== -1 && indice !== abaAtiva) {
    if (itemAberto) fecharItem(itemAberto);
    abaAtiva = indice;
    montarAbas();
    montarLista();
  }
}


/* ─────────────────────────── INICIALIZAÇÃO ─────────────────────────── */

function iniciarTreinamentos() {
  const lista = document.getElementById('trein-lista');
  if (!lista) return;

  fetch(ARQUIVO_TREINAMENTOS + '?v=' + Date.now())
    .then(function (r) {
      if (!r.ok) throw new Error('Não foi possível ler o arquivo');
      return r.text();
    })
    .then(function (texto) {
      const registros = lerTreinamentos(texto);

      if (!registros.length) {
        lista.innerHTML = '<p class="cal-vazio">Nenhum treinamento cadastrado no arquivo treinamentos.csv.</p>';
        return;
      }

      organizar(registros);
      abaAtiva = 0;
      montarAbas();
      montarLista();
      aplicarEndereco();
      window.addEventListener('hashchange', aplicarEndereco);
    })
    .catch(function () {
      lista.innerHTML = '' +
        '<div class="cal-erro">' +
          '<strong>Não foi possível carregar os treinamentos.</strong>' +
          '<p>Se você abriu este arquivo direto do computador com dois cliques, ' +
          'o navegador bloqueia a leitura do CSV por segurança. Isso é normal. ' +
          'Depois de enviar os arquivos para o GitHub, a página funciona.</p>' +
          '<p>Se já está no GitHub e o erro continua, confira se o arquivo ' +
          '<code>treinamentos.csv</code> está na mesma pasta das páginas.</p>' +
        '</div>';
    });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', iniciarTreinamentos);
} else {
  iniciarTreinamentos();
}
