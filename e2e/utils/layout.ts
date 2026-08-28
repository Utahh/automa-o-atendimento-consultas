/**
 * As funções que rodam DENTRO da página.
 *
 * Cada uma é autocontida de propósito: o Playwright serializa a função e a
 * executa no navegador, então nada de fechar sobre variáveis daqui.
 */

/** Quantos pixels o corpo passa da largura da janela. Tolerância: 1 px. */
export function estouroHorizontal(): number {
  return Math.max(0, document.documentElement.scrollWidth - document.documentElement.clientWidth);
}

export type Colisao = { readonly a: string; readonly b: string; readonly texto: string };

/**
 * Percorre os nós de texto visíveis, compara os retângulos dois a dois e
 * devolve os pares que se interceptam SEM relação de ancestralidade.
 *
 * É um teste chato de escrever uma vez e que nunca mais deixa a regressão
 * passar — e substitui a revisão manual de "abre no celular e vê se quebrou".
 */
export function colisoesDeTexto(): Colisao[] {
  const AREA_MINIMA = 24; // px² — ignora encostões de 1 px em borda arredondada.

  const caminho = (el: Element): string => {
    const partes: string[] = [];
    let atual: Element | null = el;
    while (atual !== null && partes.length < 4) {
      const nome = atual.tagName.toLowerCase();
      const classe = atual.className;
      const sufixo =
        typeof classe === 'string' && classe.trim() !== ''
          ? '.' + classe.trim().split(/\s+/).slice(0, 2).join('.')
          : '';
      partes.unshift(nome + sufixo);
      atual = atual.parentElement;
    }
    return partes.join(' > ');
  };

  const visivel = (el: Element): boolean => {
    const s = getComputedStyle(el);
    if (s.visibility === 'hidden' || s.display === 'none') return false;
    if (Number(s.opacity) === 0) return false;
    return true;
  };

  type Caixa = { el: Element; r: DOMRect; texto: string };
  const caixas: Caixa[] = [];

  const andarilho = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  let no = andarilho.nextNode();
  while (no !== null) {
    const texto = (no.textContent ?? '').trim();
    const pai = no.parentElement;
    if (texto !== '' && pai !== null && visivel(pai)) {
      const alcance = document.createRange();
      alcance.selectNodeContents(no);
      const r = alcance.getBoundingClientRect();
      if (r.width > 0 && r.height > 0) caixas.push({ el: pai, r, texto });
      alcance.detach();
    }
    no = andarilho.nextNode();
  }

  const parentesco = (a: Element, b: Element): boolean => a.contains(b) || b.contains(a);

  const colisoes: Colisao[] = [];
  for (let i = 0; i < caixas.length; i++) {
    for (let j = i + 1; j < caixas.length; j++) {
      const a = caixas[i];
      const b = caixas[j];
      if (a === undefined || b === undefined) continue;
      if (parentesco(a.el, b.el)) continue;

      const largura = Math.min(a.r.right, b.r.right) - Math.max(a.r.left, b.r.left);
      const altura = Math.min(a.r.bottom, b.r.bottom) - Math.max(a.r.top, b.r.top);
      if (largura <= 0 || altura <= 0) continue;
      if (largura * altura < AREA_MINIMA) continue;

      colisoes.push({ a: caminho(a.el), b: caminho(b.el), texto: a.texto.slice(0, 40) });
      if (colisoes.length >= 10) return colisoes;
    }
  }
  return colisoes;
}

export type AlvoPequeno = {
  readonly seletor: string;
  readonly largura: number;
  readonly altura: number;
};

/** Nenhum alvo de toque abaixo de 48 px. É requisito, não cortesia. */
export function alvosPequenos(): AlvoPequeno[] {
  const MINIMO = 48;
  const seletor = 'a[href], button, [role="menuitem"], [role="tab"], input, select, textarea';

  return Array.from(document.querySelectorAll(seletor))
    .filter((el) => {
      const s = getComputedStyle(el);
      if (s.visibility === 'hidden' || s.display === 'none') return false;
      const r = el.getBoundingClientRect();
      if (r.width === 0 || r.height === 0) return false;
      /*
       * Link dentro de texto corrido é texto, não alvo isolado: o dedo mira a
       * frase, não o retângulo. Vale para parágrafo, item de lista e para
       * qualquer link que divida o pai com outro texto — o caso do e-mail do
       * encarregado no rodapé da página pública.
       */
      const emParagrafo = el.closest('p, li:not([class*="alvo"])') !== null;
      const pai = el.parentElement;
      const textoDoPai = (pai?.textContent ?? '').trim();
      const textoDoElemento = (el.textContent ?? '').trim();
      const divideLinhaComTexto =
        el.tagName === 'A' && pai !== null && textoDoPai.length > textoDoElemento.length;

      if (emParagrafo || divideLinhaComTexto) return false;
      return r.width < MINIMO || r.height < MINIMO;
    })
    .slice(0, 10)
    .map((el) => {
      const r = el.getBoundingClientRect();
      return {
        seletor: el.tagName.toLowerCase() + (el.id !== '' ? '#' + el.id : ''),
        largura: Math.round(r.width),
        altura: Math.round(r.height),
      };
    });
}
