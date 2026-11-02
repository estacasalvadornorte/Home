/* ═══════════════════════════════════════════════════════════════════════
   COMPONENTES DO SITE - CABEÇALHO E RODAPÉ
   Estaca Salvador Brasil Norte

   Este arquivo monta o menu e o rodapé em TODAS as páginas.
   Você só precisa editar aqui, nunca nas páginas.
   ═══════════════════════════════════════════════════════════════════════ */


/* ╔═════════════════════════════════════════════════════════════════════╗
   ║  PARA ADICIONAR UMA PÁGINA NOVA AO MENU                             ║
   ║                                                                     ║
   ║  Copie uma linha da lista abaixo e cole na posição desejada.        ║
   ║  Troque o nome do arquivo e o nome que aparece no menu.            ║
   ║                                                                     ║
   ║  Modelo:                                                            ║
   ║    { arquivo: 'NOME-DO-ARQUIVO.html', nome: 'NOME NO MENU' },       ║
   ║                                                                     ║
   ║  Atenção: toda linha termina com vírgula, menos a última.           ║
   ║  A ordem da lista é a ordem que aparece no menu.                    ║
   ╚═════════════════════════════════════════════════════════════════════╝ */

const PAGINAS = [
  { arquivo: 'index.html',          nome: 'Início' },
  { arquivo: 'calendario.html',     nome: 'Calendário' },
  { arquivo: 'discursos.html',      nome: 'Discursos' },
  { arquivo: 'lideranca.html',      nome: 'Liderança' },
  { arquivo: 'treinamentos.html',   nome: 'Treinamentos' },
  { arquivo: 'area-lideranca.html', nome: 'Área da Liderança' }
];


/* ╔═════════════════════════════════════════════════════════════════════╗
   ║  ONDE MEXER: ENDEREÇO DA PLANILHA DO CALENDÁRIO                     ║
   ║                                                                     ║
   ║  É o endereço do App da Web que você copia no final da              ║
   ║  instalação do script calendario-Codigo.gs.                         ║
   ║  Termina sempre com /exec.                                          ║
   ║                                                                     ║
   ║  Enquanto este endereço não for colado, o calendário do site        ║
   ║  continua funcionando pelo arquivo calendario.csv.                  ║
   ╚═════════════════════════════════════════════════════════════════════╝ */

const ENDERECO_PLANILHA = 'https://script.google.com/macros/s/AKfycbzDdvkdd7rz-qljvy1Mn-_xsOov69DO3NpJGX0Wn5NcLIDmZVUIqYxCy3Lw6oKNNhIg/exec';


/* ╔═════════════════════════════════════════════════════════════════════╗
   ║  ONDE MEXER: LINKS DA ÁREA DA LIDERANÇA                             ║
   ║                                                                     ║
   ║  São os atalhos que aparecem depois de digitar o código.            ║
   ║  Para acrescentar um, copie um bloco inteiro { ... } e cole         ║
   ║  abaixo do último, trocando o nome, a descrição e o link.           ║
   ║                                                                     ║
   ║  Use "icone" com uma destas palavras:                               ║
   ║  conferencia, calendario, pessoas, discurso, treinamento, documento ║
   ╚═════════════════════════════════════════════════════════════════════╝ */

const ATALHOS_LIDERANCA = [
  {
    nome: 'Conferência da Estaca',
    descricao: 'Checklist de preparação, designações do sumo e manual.',
    link: 'conferencia.html',
    icone: 'conferencia'
  },
  {
    nome: 'Calendário da Estaca',
    descricao: 'Criar, alterar e excluir os eventos que aparecem no site.',
    link: 'calendario-editor.html',
    icone: 'calendario'
  },
  {
    nome: 'Liderança da Estaca',
    descricao: 'Presidência, secretários e sumo conselho: nomes, fotos e designações.',
    link: 'lideranca-editor.html',
    icone: 'pessoas'
  },
  {
    nome: 'Discursos nas Alas',
    descricao: 'Quem discursa no 3º domingo de cada mês: sumo, alas ou organizações.',
    link: 'discursos-editor.html',
    icone: 'discurso'
  },
  {
    nome: 'Treinamentos',
    descricao: 'Criar, alterar, ordenar e remover os materiais de treinamento.',
    link: 'treinamentos-editor.html',
    icone: 'treinamento'
  }
];


/* ╔═════════════════════════════════════════════════════════════════════╗
   ║  TEXTOS DO CABEÇALHO E DO RODAPÉ                                    ║
   ║  Edite entre as aspas para mudar o que aparece no site.             ║
   ╚═════════════════════════════════════════════════════════════════════╝ */

const NOME_DA_ESTACA = 'Estaca Salvador Brasil Norte';
// O ano do rodapé muda sozinho todo ano
const TEXTO_DO_RODAPE = 'Estaca Salvador Brasil Norte &middot; ' + new Date().getFullYear();


/* ╔═════════════════════════════════════════════════════════════════════╗
   ║  ÍCONE DO SITE (favicon)                                            ║
   ║                                                                     ║
   ║  É a imagenzinha que aparece na aba do navegador e quando           ║
   ║  alguém salva o site na tela inicial do celular.                    ║
   ║                                                                     ║
   ║  PARA TROCAR: suba o arquivo novo no repositório com o mesmo        ║
   ║  nome, ou mude o nome entre as aspas abaixo.                        ║
   ╚═════════════════════════════════════════════════════════════════════╝ */

const ICONE_ABA = 'favicon.ico';              // aba do navegador
const ICONE_CELULAR = 'apple-touch-icon.png'; // tela inicial do celular


/* ═══════════════════════════════════════════════════════════════════════
   DAQUI PARA BAIXO NÃO PRECISA MEXER
   ═══════════════════════════════════════════════════════════════════════ */

// Descobre qual página está aberta para marcar o item ativo no menu
function paginaAtual() {
  let arquivo = window.location.pathname.split('/').pop();
  if (!arquivo || arquivo === '') {
    arquivo = 'index.html';
  }
  return arquivo;
}

// Monta o HTML do cabeçalho
function montarCabecalho() {
  const atual = paginaAtual();

  const itens = PAGINAS.map(function (pagina) {
    const ativo = (pagina.arquivo === atual) ? ' class="active"' : '';
    return '<li><a href="' + pagina.arquivo + '"' + ativo + '>' + pagina.nome + '</a></li>';
  }).join('');

  return '' +
    '<header class="site-header">' +
      '<div class="header-inner">' +
        '<a href="index.html" class="site-logo">' + NOME_DA_ESTACA + '</a>' +
        '<button class="menu-toggle" aria-label="Abrir menu" aria-expanded="false">' +
          '<span></span><span></span><span></span>' +
        '</button>' +
        '<ul class="nav-links">' + itens + '</ul>' +
      '</div>' +
    '</header>';
}

// Monta o HTML do rodapé
function montarRodape() {
  return '<footer class="site-footer">' + TEXTO_DO_RODAPE + '</footer>';
}

// Coloca o ícone do site na aba do navegador, em todas as páginas
function montarIcones() {
  const icones = [
    { rel: 'icon', href: ICONE_ABA },
    { rel: 'apple-touch-icon', href: ICONE_CELULAR }
  ];

  icones.forEach(function (item) {
    // Se a página já tiver o ícone declarado no HTML, não duplica
    if (document.querySelector('link[rel="' + item.rel + '"]')) return;

    const link = document.createElement('link');
    link.rel = item.rel;
    link.href = item.href;
    document.head.appendChild(link);
  });
}

// Insere cabeçalho e rodapé nas áreas reservadas da página
function iniciarComponentes() {
  montarIcones();

  const areaCabecalho = document.getElementById('cabecalho');
  const areaRodape = document.getElementById('rodape');

  if (areaCabecalho) {
    areaCabecalho.outerHTML = montarCabecalho();
  }
  if (areaRodape) {
    areaRodape.outerHTML = montarRodape();
  }

  // Botão do menu no celular
  const botao = document.querySelector('.menu-toggle');
  const menu = document.querySelector('.nav-links');

  if (botao && menu) {
    botao.addEventListener('click', function () {
      const aberto = menu.classList.toggle('open');
      botao.setAttribute('aria-expanded', aberto ? 'true' : 'false');
    });
  }

  // Na página inicial, o cabeçalho fica transparente sobre a foto
  // e vira azul sólido quando a pessoa rola a página
  if (document.body.classList.contains('home-page')) {
    const cabecalho = document.querySelector('.site-header');
    const aoRolar = function () {
      cabecalho.classList.toggle('scrolled', window.scrollY > 40);
    };
    aoRolar();
    window.addEventListener('scroll', aoRolar, { passive: true });
  }
}

// Executa assim que a página carregar
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', iniciarComponentes);
} else {
  iniciarComponentes();
}


/* ═══════════════════════════════════════════════════════════════════════
   ÁREA DA LIDERANÇA: CÓDIGO DE ACESSO E CONVERSA COM A PLANILHA

   O código NÃO fica escrito aqui. Ele é digitado pela pessoa e quem
   confere se está certo é a planilha do Google. Aqui o código só fica
   guardado no aparelho de quem já entrou, para não ter que digitar
   toda vez.
   ═══════════════════════════════════════════════════════════════════════ */

const CHAVE_CODIGO = 'estaca-codigo-lideranca';

/** O endereço da planilha já foi colado lá em cima? */
function planilhaConfigurada() {
  return /^https:\/\/script\.google\.com\/.+\/exec$/.test(String(ENDERECO_PLANILHA).trim());
}

function codigoSalvo() {
  try {
    return window.localStorage.getItem(CHAVE_CODIGO) || '';
  } catch (e) {
    return '';
  }
}

function salvarCodigo(codigo) {
  try {
    window.localStorage.setItem(CHAVE_CODIGO, codigo);
  } catch (e) { /* navegador sem permissão de guardar */ }
}

function esquecerCodigo() {
  try {
    window.localStorage.removeItem(CHAVE_CODIGO);
  } catch (e) { /* nada a fazer */ }
}

/** Lê os eventos do calendário. É público, não precisa de código. */
function planilhaEventos() {
  if (!planilhaConfigurada()) {
    return Promise.reject(new Error('sem-endereco'));
  }
  return fetch(ENDERECO_PLANILHA + '?acao=eventos&v=' + Date.now())
    .then(function (r) {
      if (!r.ok) throw new Error('A planilha não respondeu.');
      return r.json();
    })
    .then(function (resposta) {
      if (!resposta.ok) throw new Error(resposta.erro || 'A planilha não respondeu.');
      return resposta.eventos || [];
    });
}

/** Lê pessoas, designações e vínculos da liderança. É público, não precisa de código. */
function planilhaLideranca() {
  if (!planilhaConfigurada()) {
    return Promise.reject(new Error('sem-endereco'));
  }
  return fetch(ENDERECO_PLANILHA + '?acao=lideranca&v=' + Date.now())
    .then(function (r) {
      if (!r.ok) throw new Error('A planilha não respondeu.');
      return r.json();
    })
    .then(function (resposta) {
      if (!resposta.ok || !Array.isArray(resposta.pessoas)) {
        throw new Error(resposta.erro || 'A planilha ainda não tem a liderança.');
      }
      return resposta;
    });
}

/** Lê o calendário de discursos nas alas. É público, não precisa de código. */
function planilhaDiscursos() {
  if (!planilhaConfigurada()) {
    return Promise.reject(new Error('sem-endereco'));
  }
  return fetch(ENDERECO_PLANILHA + '?acao=discursos&v=' + Date.now())
    .then(function (r) {
      if (!r.ok) throw new Error('A planilha não respondeu.');
      return r.json();
    })
    .then(function (resposta) {
      if (!resposta.ok || !Array.isArray(resposta.discursos)) {
        throw new Error(resposta.erro || 'A planilha ainda não tem os discursos.');
      }
      return resposta;
    });
}

/** Envia uma alteração para a planilha. Precisa do código. */
function planilhaEnviar(acao, dados, codigo) {
  if (!planilhaConfigurada()) {
    return Promise.reject(new Error('O endereço da planilha ainda não foi colado no arquivo componentes.js.'));
  }
  const corpo = Object.assign({}, dados || {}, {
    acao: acao,
    codigo: codigo != null ? codigo : codigoSalvo()
  });

  return fetch(ENDERECO_PLANILHA, {
    method: 'POST',
    // texto simples evita a verificação extra do navegador, que o Google recusa
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify(corpo)
  })
    .then(function (r) {
      if (!r.ok) throw new Error('A planilha não respondeu.');
      return r.json();
    })
    .then(function (resposta) {
      if (!resposta.ok) {
        const erro = new Error(resposta.erro || 'Não foi possível salvar.');
        erro.tipo = resposta.codigo || '';
        throw erro;
      }
      return resposta;
    });
}
