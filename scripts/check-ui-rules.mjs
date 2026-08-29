#!/usr/bin/env node
/**
 * As regras de UI que o ESLint não alcança, verificadas mecanicamente.
 *
 *   1. Nenhum z-index fora da escala de z-index.css
 *   2. Nenhuma biblioteca de data no cliente
 *   3. Nenhuma string literal em componente (todo texto vem de i18n)
 *   4. Nenhum `height` fixo em bloco com texto (use min-height)
 *
 * Roda em `npm run lint:ui` e no CI. Falhou, a build quebra — é para isso.
 */
import { readFileSync } from 'node:fs';
import { readdir } from 'node:fs/promises';
import { join, relative, sep } from 'node:path';

const RAIZ = process.cwd();
const FONTE = join(RAIZ, 'src');
const ARQUIVO_DA_ESCALA = join('src', 'shared', 'ui', 'tokens', 'z-index.css');

const problemas = [];

function reportar(arquivo, linha, regra, detalhe) {
  problemas.push({ arquivo: relative(RAIZ, arquivo).split(sep).join('/'), linha, regra, detalhe });
}

async function arquivos(dir) {
  const encontrados = [];
  for (const entrada of await readdir(dir, { withFileTypes: true })) {
    const caminho = join(dir, entrada.name);
    if (entrada.isDirectory()) encontrados.push(...(await arquivos(caminho)));
    else if (/\.(tsx?|css)$/.test(entrada.name)) encontrados.push(caminho);
  }
  return encontrados;
}

const REGRAS = [
  {
    nome: 'z-index fora da escala',
    aplica: (caminho) => !relative(RAIZ, caminho).endsWith(ARQUIVO_DA_ESCALA),
    padrao: /(?:^|[^-\w])z-index\s*:\s*(?!var\(--z-)[^;]+|className=["'][^"']*\bz-(?:\[|\d)/,
    dica: 'Use uma classe da escala (camada-base … camada-aviso) ou a variavel --z-*.',
  },
  {
    nome: 'biblioteca de data no cliente',
    aplica: (caminho) => /\.tsx?$/.test(caminho),
    contexto: 'cliente',
    padrao: /from\s+['"]date-fns(?:-tz)?['"]/,
    dica: 'date-fns só no servidor: o cliente recebe o texto já formatado.',
  },
  {
    nome: 'altura fixa em bloco de texto',
    aplica: (caminho) => /\.css$/.test(caminho),
    padrao: /^\s*height\s*:\s*\d+(px|rem|em)\s*;/,
    dica: 'Use min-height: o texto empurra em vez de vazar.',
  },
];

// O `(?<![=-])` evita confundir a seta de funcao com abertura de texto JSX:
// `=> Promise<T>` nao e texto na tela.
const TEXTO_LITERAL = /(?<![=-])>([^<>{}]*\p{L}{2,}[^<>{}]*)</u;

/**
 * O nome da marca vive em UM arquivo. Trocar a marca deve custar um
 * find-and-replace em brand.ts, nao um redesenho — e "Kairo" e nome de
 * trabalho, ainda pendente de busca no INPI.
 */
const NOME_DA_MARCA = /Kairo/;
const ARQUIVO_DA_MARCA = join('src', 'shared', 'config', 'brand.ts');

for (const caminho of await arquivos(FONTE)) {
  const conteudo = readFileSync(caminho, 'utf8');
  const ehCliente = /^['"]use client['"]/m.test(conteudo);
  const linhas = conteudo.split('\n');

  linhas.forEach((linha, i) => {
    const numero = i + 1;
    const semComentario = linha.replace(/\/\/.*$/, '').replace(/\/\*.*?\*\//g, '');

    for (const regra of REGRAS) {
      if (!regra.aplica(caminho)) continue;
      if (regra.contexto === 'cliente' && !ehCliente) continue;
      if (regra.padrao.test(semComentario)) reportar(caminho, numero, regra.nome, regra.dica);
    }

    // Nome da marca fora de brand.ts.
    if (!relative(RAIZ, caminho).endsWith(ARQUIVO_DA_MARCA) && NOME_DA_MARCA.test(semComentario)) {
      reportar(
        caminho,
        numero,
        'nome da marca fora de brand.ts',
        'Use `brand.name`. O nome e de trabalho e vive num arquivo so.',
      );
    }

    // Texto literal em JSX — fora de comentários e de arquivos de i18n.
    if (/\.tsx$/.test(caminho) && !caminho.includes(join('shared', 'i18n'))) {
      const achado = TEXTO_LITERAL.exec(semComentario);
      if (achado !== null && !/^\s*[*/]/.test(linha)) {
        reportar(
          caminho,
          numero,
          'string literal em componente',
          'Todo texto de interface mora em shared/i18n/pt-BR.ts. Encontrado: ' +
            (achado[1] ?? '').trim().slice(0, 40),
        );
      }
    }
  });
}

if (problemas.length === 0) {
  console.log('✓ regras de UI: nenhuma violação.');
  process.exit(0);
}

console.error('\n✗ ' + String(problemas.length) + ' violação(ões) das regras de UI:\n');
for (const p of problemas) {
  console.error('  ' + p.arquivo + ':' + String(p.linha) + '  [' + p.regra + ']');
  console.error('      ' + p.detalhe);
}
console.error('');
process.exit(1);
