import { expect, test } from '@playwright/test';

/**
 * A especificação do menu é curta e não é negociável — então ela é teste,
 * não revisão de gosto.
 */

test.describe('menu adaptativo', () => {
  test('abaixo de 768 px vira folha inferior', async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 780 });
    await page.goto('/hoje');

    const gatilho = page.getByRole('button', { name: 'Mais' });
    await gatilho.click();

    const menu = page.getByRole('menu');
    await expect(menu).toBeVisible();

    // Folha: encostada na base da tela.
    const caixa = await menu.boundingBox();
    expect(caixa).not.toBeNull();
    expect((caixa?.y ?? 0) + (caixa?.height ?? 0)).toBeGreaterThan(700);
  });

  test('a partir de 768 px vira popover e não cobre o gatilho', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/hoje');

    const gatilho = page.getByRole('button', { name: 'Mais' });
    const caixaGatilho = await gatilho.boundingBox();
    await gatilho.click();

    const menu = page.getByRole('menu');
    await expect(menu).toBeVisible();
    const caixaMenu = await menu.boundingBox();

    const separados =
      (caixaMenu?.y ?? 0) >= (caixaGatilho?.y ?? 0) + (caixaGatilho?.height ?? 0) ||
      (caixaMenu?.y ?? 0) + (caixaMenu?.height ?? 0) <= (caixaGatilho?.y ?? 0);
    expect(separados).toBe(true);
  });

  test('Esc fecha e devolve o foco ao gatilho', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/hoje');

    const gatilho = page.getByRole('button', { name: 'Mais' });
    await gatilho.click();
    await expect(page.getByRole('menu')).toBeVisible();

    await page.keyboard.press('Escape');
    await expect(page.getByRole('menu')).toHaveCount(0);
    await expect(gatilho).toBeFocused();
  });

  test('o gatilho declara aria-expanded', async ({ page }) => {
    await page.goto('/hoje');
    const gatilho = page.getByRole('button', { name: 'Mais' });
    await expect(gatilho).toHaveAttribute('aria-expanded', 'false');
    await gatilho.click();
    await expect(gatilho).toHaveAttribute('aria-expanded', 'true');
  });
});
