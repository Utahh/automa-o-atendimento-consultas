import { expect, test } from '@playwright/test';
import { alvosPequenos, colisoesDeTexto, estouroHorizontal } from './utils/layout';

/**
 * O app do cliente, com sessão de cliente.
 *
 * Roda num projeto separado de propósito: o cookie é outro, e o papel dentro
 * dele é o que decide o que o banco devolve. Se estas telas passassem com a
 * sessão do estúdio, o teste não estaria provando nada.
 */

const VIEWPORTS = [320, 360, 768, 1024, 1440] as const;
const ROTAS = ['/cliente', '/cliente/marcar'];

for (const largura of VIEWPORTS) {
  for (const rota of ROTAS) {
    test(rota + ' @ ' + String(largura) + 'px não estoura nem colide', async ({ page }) => {
      await page.setViewportSize({ width: largura, height: 800 });
      await page.goto(rota);
      await page.waitForLoadState('networkidle');

      // O cliente não pode ser redirecionado para a área do estúdio.
      expect(new URL(page.url()).pathname).toBe(rota);

      expect(await page.evaluate(estouroHorizontal)).toBeLessThanOrEqual(1);
      expect(await page.evaluate(colisoesDeTexto)).toEqual([]);
      expect(await page.evaluate(alvosPequenos)).toEqual([]);
    });
  }
}

test('o cliente não entra na área do estúdio', async ({ page }) => {
  // Mesma sessão, outra porta: quem é cliente é mandado de volta para a dele.
  await page.goto('/hoje');
  await page.waitForLoadState('networkidle');
  expect(new URL(page.url()).pathname).not.toBe('/hoje');
});

test('marcar começa pelo serviço, e o dia vem antes do profissional', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/cliente/marcar');

  // 1ª decisão: o serviço, com o preço à vista.
  await expect(page.getByRole('heading', { name: 'O que você quer marcar?' })).toBeVisible();
  await page.getByRole('button', { name: /Limpeza de pele/ }).click();

  // 2ª decisão: o dia — antes do profissional, de propósito.
  await expect(page.getByRole('heading', { name: 'Que dia fica bom?' })).toBeVisible();
});
