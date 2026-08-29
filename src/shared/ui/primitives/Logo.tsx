import { brand } from '../../config/brand';

/**
 * O simbolo: um circulo — o dia, o ciclo — com um quarto preenchido, que e o
 * horario que foi ocupado. A agenda se enche sozinha.
 *
 * O setor comeca as 12 h e termina as 3 h. NUNCA em outro angulo: o quarto
 * superior direito e o que faz ler como "comecou e esta avancando", e nao
 * como "esta pela metade".
 *
 * Uma cor so, via currentColor: herda a cor do contexto e funciona em
 * qualquer fundo permitido sem arquivo novo.
 */
export function Simbolo({ tamanho = 24 }: { readonly tamanho?: number }) {
  // Abaixo de 20 px o traco de 2.4 fecha o miolo do anel: a versao reduzida
  // engorda o traco e abre o raio.
  const reduzido = tamanho < 20;

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      width={tamanho}
      height={tamanho}
      role="img"
      aria-label={brand.name}
    >
      <circle
        cx="12"
        cy="12"
        r={reduzido ? 8.4 : 9}
        fill="none"
        stroke="currentColor"
        strokeWidth={reduzido ? 3.2 : 2.4}
      />
      <path
        d={
          reduzido
            ? 'M12 12V2.8A9.2 9.2 0 0 1 21.2 12H12Z'
            : 'M12 12V1.8A10.2 10.2 0 0 1 22.2 12H12Z'
        }
        fill="currentColor"
      />
    </svg>
  );
}

/**
 * O logotipo: o simbolo E a letra. Escreve-se "kair" + o simbolo no lugar do
 * "o" — uma peca, duas leituras. Nunca um icone ao lado do nome.
 */
export function Logo({ altura = 32 }: { readonly altura?: number }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 66 32"
      height={altura}
      width={(altura * 66) / 32}
      role="img"
      aria-label={brand.name}
    >
      <text
        x="0"
        y="24"
        fontFamily="Inter, system-ui, sans-serif"
        fontSize="26"
        fontWeight="600"
        letterSpacing="-0.52"
        fill="currentColor"
      >
        kair
      </text>
      <circle cx="50.7" cy="18" r="4.9" fill="none" stroke="currentColor" strokeWidth="2.6" />
      <path d="M50.7 18V11.8A6.2 6.2 0 0 1 56.9 18H50.7Z" fill="currentColor" />
    </svg>
  );
}
