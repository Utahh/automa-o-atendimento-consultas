import { expect, test } from '@playwright/test';
import { alvosPequenos, colisoesDeTexto, estouroHorizontal } from './utils/layout';

/**
 * O teste que impede a regressão. Roda em todo PR.
 *
 * Três garantias mecânicas, em cinco larguras: o corpo nunca rola na
 * horizontal, nenhum texto fica em cima de outro texto, e nenhum alvo de
 * toque é menor que 48 px.
 */

const VIEWPORTS = [320, 360, 768, 1024, 1440] as const;

const ROTAS = [
  '/hoje',
  '/agenda',
  '/agenda/semana',
  '/clientes',
  '/conversas',
  '/servicos',
  '/financeiro',
  '/automacoes',
  '/conta',
  '/p/demo',
];

for (const largura of VIEWPORTS) {
  for (const rota of ROTAS) {
    test(rota + ' @ ' + String(largura) + 'px não estoura nem colide', async ({ page }) => {
      await page.setViewportSize({ width: largura, height: 800 });
      await page.goto(rota);
      await page.waitForLoadState('networkidle');

      // Sem isto, uma sessao invalida redireciona tudo para /entrar e a suite
      // fica verde medindo a tela errada.
      expect(new URL(page.url()).pathname).toBe(rota);

      // 1. o corpo nunca rola na horizontal
      expect(await page.evaluate(estouroHorizontal)).toBeLessThanOrEqual(1);

      // 2. nenhum texto sobreposto a outro texto
      expect(await page.evaluate(colisoesDeTexto)).toEqual([]);

      // 3. nenhum alvo de toque menor que 48 px
      expect(await page.evaluate(alvosPequenos)).toEqual([]);
    });
  }
}

// Zoom de 200% em 320 px e requisito (WCAG 1.4.4), nao cortesia — e e onde a
// agenda cheia estoura primeiro: chip de horario, nome e etiqueta de estado
// disputam a mesma linha.
for (const rota of ['/hoje', '/agenda', '/p/demo']) {
  test(rota + ' com zoom de 200% continua sem estouro horizontal', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 800 });
    await page.goto(rota);
    await page.evaluate(() => {
      document.documentElement.style.fontSize = '200%';
    });
    expect(await page.evaluate(estouroHorizontal)).toBeLessThanOrEqual(1);
  });
}
