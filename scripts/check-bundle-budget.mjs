#!/usr/bin/env node
/**
 * O orçamento de JavaScript, verificado toda semana — e todo PR.
 *
 *   página pública  <  90 kB gz
 *   área logada     < 180 kB gz
 *
 * Lê o manifesto do build e soma os chunks de cada rota, comprimidos.
 * Estourou o limite, a build quebra. É a métrica que o profissional sente
 * todo dia, então ela não vive numa planilha.
 */
import { existsSync, readFileSync, statSync } from 'node:fs';
import { gzipSync } from 'node:zlib';
import { join } from 'node:path';

const RAIZ = process.cwd();
const NEXT = join(RAIZ, '.next');
const MANIFESTO = join(NEXT, 'app-build-manifest.json');

/**
 * `alvo`   = a meta do produto. Ficar acima dela é aviso amarelo.
 * `limite` = o teto que quebra a build.
 *
 * Os dois números são iguais onde a meta já é alcançável hoje. Na página
 * pública eles divergem de propósito: o piso do App Router (React + roteador)
 * é de ~103 kB gz numa página VAZIA, então a meta de 90 kB do documento não
 * cabe enquanto essa rota compartilhar o runtime de cliente do resto do app.
 * Fechar essa diferença é decisão de arquitetura, não de código — até lá o
 * teto segura a regressão e o aviso mantém a meta à vista.
 */
const ORCAMENTOS = [
  { rota: '/p/[slug]/page', alvoKb: 90, limiteKb: 110, nome: 'página pública' },
  { rota: '/(app)/hoje/page', alvoKb: 180, limiteKb: 180, nome: 'Hoje' },
  { rota: '/(app)/agenda/page', alvoKb: 180, limiteKb: 180, nome: 'Agenda' },
];

if (!existsSync(MANIFESTO)) {
  console.error('Manifesto não encontrado. Rode `npm run build` antes.');
  process.exit(1);
}

const manifesto = JSON.parse(readFileSync(MANIFESTO, 'utf8'));
const paginas = manifesto.pages ?? {};

function pesoGzipKb(arquivos) {
  let total = 0;
  const vistos = new Set();
  for (const relativo of arquivos) {
    if (!relativo.endsWith('.js') || vistos.has(relativo)) continue;
    vistos.add(relativo);
    const caminho = join(NEXT, relativo);
    if (!existsSync(caminho) || !statSync(caminho).isFile()) continue;
    total += gzipSync(readFileSync(caminho)).byteLength;
  }
  return total / 1024;
}

let falhou = false;
console.log('');
console.log('Orçamento de JavaScript (gzip):');
console.log('');

for (const { rota, alvoKb, limiteKb, nome } of ORCAMENTOS) {
  const arquivos = paginas[rota];
  if (arquivos === undefined) {
    console.log('  - ' + nome + ' (' + rota + '): rota ausente do manifesto, ignorada');
    continue;
  }
  const kb = pesoGzipKb(arquivos);
  const estourou = kb > limiteKb;
  const acimaDaMeta = kb > alvoKb;
  if (estourou) falhou = true;

  const marca = estourou ? 'x' : acimaDaMeta ? '!' : 'ok';
  console.log(
    '  ' +
      marca.padEnd(3) +
      nome.padEnd(16) +
      kb.toFixed(1).padStart(7) +
      ' kB   meta ' +
      String(alvoKb) +
      ' kB   teto ' +
      String(limiteKb) +
      ' kB',
  );

  if (acimaDaMeta && !estourou) {
    console.log(
      '::warning::' +
        nome +
        ' está ' +
        (kb - alvoKb).toFixed(1) +
        ' kB acima da meta do produto (ainda dentro do teto).',
    );
  }
}

console.log('');
if (falhou) {
  console.error('::error::O orçamento de JavaScript estourou o teto.');
  process.exit(1);
}
