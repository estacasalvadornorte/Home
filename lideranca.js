/* ═══════════════════════════════════════════════════════════════════════
   PÁGINA DE LIDERANÇA
   Lê os dados da liderança na planilha do Google e monta a apresentação.

   VOCÊ NÃO PRECISA MEXER NESTE ARQUIVO.
   Para alterar pessoas, fotos e designações, entre em
   Área da Liderança > Liderança da Estaca.

   Os arquivos da pasta lideranca/ ficam só como reserva, para a página
   não ficar vazia se a planilha estiver fora do ar.
   ═══════════════════════════════════════════════════════════════════════ */

const PASTA_DADOS = 'lideranca/';
const PASTA_FOTOS = 'imagens/chamados/';

const GRUPOS_PESSOAS = ['Presidência', 'Secretários', 'Sumo Conselho'];

const CHAVE_COPIA_LIDERANCA = 'estaca-lideranca-copia';

// Cada pessoa:     { id, chamado, grupo, nome, data_designacao, foto }
// Cada designação: { id, designacao, grupo }
// Cada vínculo:    { designacao (id), chamado (id), excecao }
let PESSOAS = [];
let DESIGNACOES = [];
let VINCULOS = [];
let visaoLideranca = 'pessoas';


/* ─────────────────────────── AUXILIARES ────────────────────────────── */

function escaparTexto(texto) {
  const div = document.createElement('div');
  div.textContent = texto || '';
  return div.innerHTML;
}

// Calcula anos, meses e dias entre a designação e hoje
function tempoDeChamado(dataInicio) {
  if (!dataInicio) return null;

  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  if (dataInicio > hoje) return null;

  let anos = hoje.getFullYear() - dataInicio.getFullYear();
  let meses = hoje.getMonth() - dataInicio.getMonth();
  let dias = hoje.getDate() - dataInicio.getDate();

  if (dias < 0) {
    meses--;
    const mesAnterior = new Date(hoje.getFullYear(), hoje.getMonth(), 0);
    dias += mesAnterior.getDate();
  }
  if (meses < 0) {
    anos--;
    meses += 12;
  }

  const totalDias = Math.floor((hoje - dataInicio) / 86400000);

  const partes = [];
  if (anos > 0) partes.push(anos + (anos === 1 ? ' ano' : ' anos'));
  if (meses > 0) partes.push(meses + (meses === 1 ? ' mês' : ' meses'));
  if (dias > 0) partes.push(dias + (dias === 1 ? ' dia' : ' dias'));
  if (partes.length === 0) partes.push('hoje');

  let texto = partes[0];
  if (partes.length === 2) texto = partes[0] + ' e ' + partes[1];
  if (partes.length === 3) texto = partes[0] + ', ' + partes[1] + ' e ' + partes[2];

  return { texto: texto, totalDias: totalDias };
}

function formatarData(d) {
  if (!d) return '';
  return String(d.getDate()).padStart(2, '0') + '/' +
         String(d.getMonth() + 1).padStart(2, '0') + '/' +
         d.getFullYear();
}

// Endereço da foto: a enviada pelo site, a antiga da pasta imagens/chamados, ou nenhuma
function fotoDe(p) {
  if (p.foto === 'sem') return '';
  if (/^data:image\//.test(p.foto || '')) return p.foto;
  return PASTA_FOTOS + p.id + '.jpg';
}

// Nomes das designações de um cargo, na ordem da lista
function designacoesDe(id) {
  return DESIGNACOES.filter(function (d) {
    return VINCULOS.some(function (v) { return v.chamado === id && v.designacao === d.id; });
  }).map(function (d) { return d.designacao; });
}

// Quem responde por uma designação, separado por grupo
function ocupantesDe(designacao) {
  const ligados = VINCULOS.filter(function (v) { return v.designacao === designacao.id; });
  const presidencia = [];
  const sumo = [];

  ligados.forEach(function (v) {
    const p = PESSOAS.find(function (x) { return x.id === v.chamado; });
    if (!p) return;
    if (p.grupo === 'Presidência') presidencia.push(p);
    else sumo.push({ pessoa: p, excecao: v.excecao });
  });

  // A vaga normal aparece antes da vaga de exceção
  sumo.sort(function (a, b) {
    return (a.excecao === 'sim' ? 1 : 0) - (b.excecao === 'sim' ? 1 : 0);
  });

  return {
    presidencia: presidencia,
    sumo: sumo.map(function (x) { return x.pessoa; })
  };
}

function nomeValido(nome) {
  return nome && nome.toLowerCase() !== 'a definir';
}


/* ─────────────────────── VISÃO: POR PESSOA ─────────────────────────── */

function cartaoPessoa(p) {
  const data = csvData(p.data_designacao);
  const tempo = tempoDeChamado(data);
  const lista = designacoesDe(p.id);
  const temNome = nomeValido(p.nome);
  const endereco = fotoDe(p);

  const foto = endereco
    ? '<img src="' + escaparTexto(endereco) + '" alt="" ' +
      'onerror="this.parentNode.classList.add(\'sem-foto\'); this.remove();">'
    : '';

  let html = '<article class="lid-cartao">';

  html += '<div class="lid-foto' + (endereco ? '' : ' sem-foto') + '">' + foto +
          '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.1" stroke-linecap="round" stroke-linejoin="round">' +
            '<path d="M19 21v-2a5 5 0 0 0-5-5h-4a5 5 0 0 0-5 5v2"/>' +
            '<circle cx="12" cy="7" r="4"/>' +
          '</svg>' +
          '</div>';

  html += '<div class="lid-info">';
  html += '<span class="lid-cargo">' + escaparTexto(p.chamado) + '</span>';
  html += '<h3' + (temNome ? '' : ' class="lid-vago"') + '>' +
          escaparTexto(temNome ? p.nome : 'A definir') + '</h3>';

  if (data) {
    html += '<p class="lid-tempo">' +
              '<span>Desde ' + formatarData(data) + '</span>' +
              (tempo ? '<strong>' + tempo.texto +
                       ' <em>(' + tempo.totalDias + ' dias)</em></strong>' : '') +
            '</p>';
  }

  if (lista.length) {
    html += '<ul class="lid-designacoes">';
    lista.forEach(function (d) {
      html += '<li>' + escaparTexto(d) + '</li>';
    });
    html += '</ul>';
  }

  html += '</div></article>';
  return html;
}

function montarPorPessoa() {
  let html = '';

  GRUPOS_PESSOAS.forEach(function (grupo) {
    const doGrupo = PESSOAS.filter(function (p) { return p.grupo === grupo; });
    if (!doGrupo.length) return;

    html += '<section class="lid-grupo">';
    html += '<h2 class="lid-grupo-titulo">' + grupo + '</h2>';
    html += '<div class="lid-grade">';
    doGrupo.forEach(function (p) { html += cartaoPessoa(p); });
    html += '</div></section>';
  });

  return html || '<p class="cal-vazio">Nenhuma pessoa cadastrada.</p>';
}


/* ──────────────────── VISÃO: POR DESIGNAÇÃO ────────────────────────── */

function montarPorDesignacao() {
  if (!DESIGNACOES.length) {
    return '<p class="cal-vazio">Nenhuma designação cadastrada.</p>';
  }

  const grupos = [];
  DESIGNACOES.forEach(function (d) {
    const g = d.grupo || 'Outras';
    if (grupos.indexOf(g) === -1) grupos.push(g);
  });

  let html = '';

  grupos.forEach(function (grupo) {
    const doGrupo = DESIGNACOES.filter(function (d) {
      return (d.grupo || 'Outras') === grupo;
    });

    html += '<section class="lid-grupo">';
    html += '<h2 class="lid-grupo-titulo">' + escaparTexto(grupo) + '</h2>';
    html += '<div class="desig-lista">';

    doGrupo.forEach(function (d) {
      const oc = ocupantesDe(d);
      const completo = oc.presidencia.length > 0 && oc.sumo.length > 0;
      const vazio = oc.presidencia.length === 0 && oc.sumo.length === 0;
      const estado = completo ? 'completo' : (vazio ? 'vazio' : 'parcial');

      html += '<div class="desig-item estado-' + estado + '">';
      html += '<div class="desig-nome">' + escaparTexto(d.designacao) + '</div>';
      html += '<div class="desig-pessoas">';

      const linha = function (rotulo, pessoas) {
        if (!pessoas.length) {
          return '<span class="desig-vaga">' + rotulo + ' a definir</span>';
        }
        return pessoas.map(function (p) {
          const nome = nomeValido(p.nome) ? p.nome : p.chamado;
          return '<span class="desig-pessoa">' +
                   '<em>' + escaparTexto(p.chamado) + '</em>' +
                   escaparTexto(nome) +
                 '</span>';
        }).join('');
      };

      html += linha('Presidência', oc.presidencia);
      html += linha('Sumo conselho', oc.sumo);
      html += '</div></div>';
    });

    html += '</div></section>';
  });

  return html;
}


/* ─────────────────────────── RENDERIZAÇÃO ──────────────────────────── */

function renderizarLideranca() {
  const area = document.getElementById('lid-conteudo');
  if (!area) return;

  area.innerHTML = (visaoLideranca === 'pessoas')
    ? montarPorPessoa()
    : montarPorDesignacao();
}

function ligarAbasLideranca() {
  document.querySelectorAll('.lid-aba').forEach(function (aba) {
    aba.addEventListener('click', function () {
      document.querySelectorAll('.lid-aba').forEach(function (a) {
        a.classList.remove('ativo');
      });
      aba.classList.add('ativo');
      visaoLideranca = aba.getAttribute('data-visao');
      renderizarLideranca();
    });
  });
}


/* ─────────────────────────── INICIALIZAÇÃO ─────────────────────────── */

/* De onde vêm os dados:
   1. da planilha do Google, que é onde a liderança edita
   2. se a planilha não responder, da última cópia guardada no aparelho
   3. se não houver cópia, dos arquivos da pasta lideranca/ (reserva)      */

function receberDados(d) {
  PESSOAS = d.pessoas || [];
  DESIGNACOES = d.designacoes || [];
  VINCULOS = d.vinculos || [];
}

function guardarCopiaLideranca(d) {
  try {
    window.localStorage.setItem(CHAVE_COPIA_LIDERANCA, JSON.stringify(d));
  } catch (e) { /* aparelho sem espaço ou sem permissão: segue sem cópia */ }
}

function lerCopiaLideranca() {
  try {
    const texto = window.localStorage.getItem(CHAVE_COPIA_LIDERANCA);
    const d = texto ? JSON.parse(texto) : null;
    return d && Array.isArray(d.pessoas) && d.pessoas.length ? d : null;
  } catch (e) {
    return null;
  }
}

function buscarCSV(nome) {
  return fetch(PASTA_DADOS + nome + '?v=' + Date.now())
    .then(function (r) {
      if (!r.ok) throw new Error(nome);
      return r.text();
    })
    .then(csvLer);
}

// Converte os arquivos antigos para o mesmo formato da planilha
function lerReserva() {
  return Promise.all([
    buscarCSV('pessoas.csv'),
    buscarCSV('designacoes.csv'),
    buscarCSV('vinculos.csv')
  ]).then(function (res) {
    const idDoChamado = {};
    const pessoas = res[0].map(function (p) {
      const id = String(p.foto || p.chamado).replace(/\.[a-z]+$/i, '');
      idDoChamado[p.chamado] = id;
      return { id: id, chamado: p.chamado, grupo: p.grupo, nome: p.nome, data_designacao: p.data_designacao, foto: '' };
    });
    const designacoes = res[1].map(function (d) {
      return { id: d.designacao, designacao: d.designacao, grupo: d.grupo };
    });
    const vinculos = res[2].filter(function (v) { return v.designacao && idDoChamado[v.chamado]; })
      .map(function (v) { return { designacao: v.designacao, chamado: idDoChamado[v.chamado], excecao: v.excecao }; });
    return { pessoas: pessoas, designacoes: designacoes, vinculos: vinculos };
  });
}

function iniciarLideranca() {
  const area = document.getElementById('lid-conteudo');
  if (!area) return;

  const temPlanilha = typeof planilhaConfigurada === 'function' && planilhaConfigurada() &&
                      typeof planilhaLideranca === 'function';

  const daPlanilha = temPlanilha
    ? planilhaLideranca().then(function (d) {
        const dados = { pessoas: d.pessoas, designacoes: d.designacoes, vinculos: d.vinculos };
        guardarCopiaLideranca(dados);
        return dados;
      })
    : Promise.reject(new Error('sem planilha'));

  daPlanilha
    .catch(function () {
      return lerCopiaLideranca() || lerReserva();
    })
    .then(function (dados) {
      receberDados(dados);
      ligarAbasLideranca();
      renderizarLideranca();
    })
    .catch(function () {
      area.innerHTML = '' +
        '<div class="cal-erro">' +
          '<strong>Não foi possível carregar os dados da liderança.</strong>' +
          '<p>Confira sua internet e atualize a página.</p>' +
        '</div>';
    });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', iniciarLideranca);
} else {
  iniciarLideranca();
}
