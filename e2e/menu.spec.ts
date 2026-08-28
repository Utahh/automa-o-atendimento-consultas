import { expect, test } from '@playwright/test';

/**
 * A especificação do menu é curta e não é negociável — então ela é teste, não
 * revisão de gosto.
 *
 * O gatilho usado aqui é o "⋯" da agenda, que existe em toda largura: é onde
 * o mesmo componente aparece nas duas formas.
 */

const GATILHO = { name: 'Mais ações' };

test.describe('menu suspenso', () => {
  test('abaixo de 768 px vira folha inferior', async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 780 });
    await page.goto('/agenda');

    await page.getByRole('button', GATILHO).click();

    const menu = page.getByRole('menu');
    await expect(menu).toBeVisible();

    // Folha: encostada na base da tela.
    const caixa = await menu.boundingBox();
    expect(caixa).not.toBeNull();
    expect((caixa?.y ?? 0) + (caixa?.height ?? 0)).toBeGreaterThan(700);
  });

  test('a partir de 768 px vira popover e não cobre o gatilho', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/agenda');

    const gatilho = page.getByRole('button', GATILHO);
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
    await page.goto('/agenda');

    const gatilho = page.getByRole('button', GATILHO);
    await gatilho.click();
    await expect(page.getByRole('menu')).toBeVisible();

    await page.keyboard.press('Escape');
    await expect(page.getByRole('menu')).toHaveCount(0);
    await expect(gatilho).toBeFocused();
  });

  test('o gatilho declara aria-expanded', async ({ page }) => {
    await page.goto('/agenda');
    const gatilho = page.getByRole('button', GATILHO);
    await expect(gatilho).toHaveAttribute('aria-expanded', 'false');
    await gatilho.click();
    await expect(gatilho).toHaveAttribute('aria-expanded', 'true');
  });

  test('a ação destrutiva vem por último, separada, e com rótulo', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/agenda');
    await page.getByRole('button', GATILHO).click();

    const itens = page.getByRole('menuitem');
    const total = await itens.count();
    // Cor nunca comunica sozinha: o rótulo diz o que a ação faz.
    await expect(itens.nth(total - 1)).toHaveText('Marcar falta');
    await expect(page.getByRole('menu').getByRole('separator')).toHaveCount(1);
  });

  test('abrir a folha de novo agendamento fecha o menu', async ({ page }) => {
    // A 1280 px o menu e popover (camada 30) e nao tem cortina: da para tocar
    // no botao atras dele. Abaixo de 768 o proprio menu ja e uma folha, e a
    // cortina dela impede o toque — que e o comportamento certo.
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/agenda');

    await page.getByRole('button', GATILHO).click();
    await expect(page.getByRole('menu')).toBeVisible();

    // Nunca duas camadas do mesmo nível abertas: quem garante é o useOverlay.
    await page.getByRole('button', { name: 'Novo agendamento' }).click();
    await expect(page.getByRole('menu')).toHaveCount(0);
    await expect(page.getByRole('dialog', { name: 'Novo agendamento' })).toBeVisible();
  });
});
