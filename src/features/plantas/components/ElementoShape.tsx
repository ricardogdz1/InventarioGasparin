import { Group, Rect, Text, Line } from "react-konva";
import type { ElementoPlanta, TipoElemento } from "../types";

/**
 * Estilo flat cartunizado e sóbrio (identidade visual da especificação):
 * formas arredondadas, cores suaves por categoria e leve sombra projetada.
 * O laranja fica RESERVADO para o destaque do item buscado.
 */
const ESTILO: Record<TipoElemento, { fill: string; stroke: string }> = {
  mesa: { fill: "#bfdbfe", stroke: "#93c5fd" },
  cadeira: { fill: "#e2e8f0", stroke: "#cbd5e1" },
  estante: { fill: "#ddd6fe", stroke: "#c4b5fd" },
  prateleira: { fill: "#ddd6fe", stroke: "#c4b5fd" },
  porta: { fill: "#bbf7d0", stroke: "#86efac" },
  parede: { fill: "#94a3b8", stroke: "#94a3b8" },
  divisoria: { fill: "#94a3b8", stroke: "#94a3b8" },
  computador: { fill: "#99f6e4", stroke: "#5eead4" },
  impressora: { fill: "#fde68a", stroke: "#fcd34d" },
  caixa: { fill: "#fed7aa", stroke: "#fdba74" },
  area: { fill: "rgba(100, 116, 139, 0.05)", stroke: "#cbd5e1" },
};

interface ElementoShapeProps {
  elemento: ElementoPlanta;
  /** Nome do funcionário designado (exibido sob o rótulo da mesa). */
  nomeFuncionario?: string | null;
  /** Quantidade de itens nesta posição (mostra um selo discreto). */
  qtdItens?: number;
  onClick?: (elemento: ElementoPlanta) => void;
}

/** Desenha um elemento da planta com rotação em torno do próprio centro. */
export function ElementoShape({
  elemento,
  nomeFuncionario,
  qtdItens,
  onClick,
}: ElementoShapeProps) {
  const estilo = ESTILO[elemento.tipo];
  const ehParede = elemento.tipo === "parede" || elemento.tipo === "divisoria";
  const ehArea = elemento.tipo === "area";
  const clicavel = !!onClick && !ehParede;

  return (
    <Group
      x={elemento.x + elemento.largura / 2}
      y={elemento.y + elemento.altura / 2}
      offsetX={elemento.largura / 2}
      offsetY={elemento.altura / 2}
      rotation={elemento.rotacao}
      onClick={clicavel ? () => onClick!(elemento) : undefined}
      onTap={clicavel ? () => onClick!(elemento) : undefined}
      listening={clicavel}
    >
      <Rect
        width={elemento.largura}
        height={elemento.altura}
        fill={estilo.fill}
        stroke={estilo.stroke}
        strokeWidth={ehArea ? 1.5 : 1}
        dash={ehArea ? [8, 6] : undefined}
        cornerRadius={ehParede ? 2 : ehArea ? 14 : Math.min(10, elemento.altura / 4)}
        shadowColor={ehParede || ehArea ? undefined : "#0f172a"}
        shadowOpacity={ehParede || ehArea ? 0 : 0.12}
        shadowBlur={6}
        shadowOffsetY={3}
        perfectDrawEnabled={false}
      />
      {/* Linhas internas sugerindo prateleiras nas estantes */}
      {(elemento.tipo === "estante" || elemento.tipo === "prateleira") &&
        elemento.altura > 60 &&
        [1, 2, 3].map((i) => (
          <Line
            key={i}
            points={[6, (elemento.altura / 4) * i, elemento.largura - 6, (elemento.altura / 4) * i]}
            stroke="#c4b5fd"
            strokeWidth={1}
            perfectDrawEnabled={false}
            listening={false}
          />
        ))}
      {elemento.rotulo && (
        <Text
          text={elemento.rotulo}
          width={ehArea ? elemento.largura - 16 : elemento.largura}
          x={ehArea ? 10 : 0}
          y={ehArea ? 8 : nomeFuncionario ? elemento.altura / 2 - 16 : elemento.altura / 2 - 7}
          align={ehArea ? "left" : "center"}
          fontSize={ehArea ? 13 : 12}
          fontStyle={ehArea ? "bold" : "normal"}
          fill={ehArea ? "#94a3b8" : "#475569"}
          listening={false}
          perfectDrawEnabled={false}
        />
      )}
      {nomeFuncionario && (
        <Text
          text={nomeFuncionario}
          width={elemento.largura}
          y={elemento.altura / 2 + 1}
          align="center"
          fontSize={11}
          fill="#64748b"
          listening={false}
          perfectDrawEnabled={false}
        />
      )}
      {/* Selo com a quantidade de itens na posição */}
      {!!qtdItens && qtdItens > 0 && (
        <Group x={elemento.largura - 11} y={-7} listening={false}>
          <Rect width={22} height={16} cornerRadius={8} fill="#3b82f6" perfectDrawEnabled={false} />
          <Text
            text={String(qtdItens)}
            width={22}
            y={3}
            align="center"
            fontSize={10}
            fontStyle="bold"
            fill="#ffffff"
            perfectDrawEnabled={false}
          />
        </Group>
      )}
    </Group>
  );
}
