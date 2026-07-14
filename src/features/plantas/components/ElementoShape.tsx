import { useState } from "react";
import { Arc, Circle, Group, Line, Rect, Text } from "react-konva";
import type { KonvaEventObject } from "konva/lib/Node";
import type { ElementoPlanta, TipoElemento } from "../types";

/**
 * Móveis em vista de cima, estilo planta de escritório realista porém sóbria
 * (referência do cliente: mesas de madeira com cadeira encaixada, monitor e
 * papéis sobre o tampo, sombras longas e suaves — sem excesso de cor).
 * O laranja continua RESERVADO ao destaque do item buscado.
 */
const COR = {
  madeira: "#d7bd97",
  madeiraBorda: "#c2a67d",
  madeiraClara: "#e2cda9",
  cadeiraAssento: "#4b5563",
  cadeiraEncosto: "#374151",
  monitor: "#1f2937",
  telaApagada: "#64748b",
  teclado: "#475569",
  papel: "#fafaf9",
  papelBorda: "#e7e5e4",
  cinza: "#9ca3af",
  cinzaEscuro: "#6b7280",
  caixaPapelao: "#cbb287",
  caixaFita: "#a98e63",
  parede: "#a8a29e",
  rotulo: "#57534e",
} as const;

/** Sombra longa e diagonal, comum a todos os móveis (mesma "luz" da sala). */
const SOMBRA = {
  shadowColor: "#292524",
  shadowOpacity: 0.16,
  shadowBlur: 8,
  shadowOffsetX: 5,
  shadowOffsetY: 7,
  perfectDrawEnabled: false as const,
};

interface ElementoShapeProps {
  elemento: ElementoPlanta;
  nomeFuncionario?: string | null;
  qtdItens?: number;
  onClick?: (elemento: ElementoPlanta) => void;
}

export function ElementoShape({
  elemento,
  nomeFuncionario,
  qtdItens,
  onClick,
}: ElementoShapeProps) {
  const [hover, setHover] = useState(false);
  const ehParede = elemento.tipo === "parede" || elemento.tipo === "divisoria";
  const ehArea = elemento.tipo === "area";
  const clicavel = !!onClick && !ehParede;

  function setCursor(e: KonvaEventObject<MouseEvent>, cursor: string) {
    const stage = e.target.getStage();
    if (stage) stage.container().style.cursor = cursor;
  }

  const { largura: w, altura: h } = elemento;
  // A mesa tem cadeira que avança além do tampo: afasta o rótulo para não sobrepor.
  const offsetRotulo = elemento.tipo === "mesa" ? Math.min(17, w * 0.17) + 10 : 6;

  return (
    <Group
      x={elemento.x + w / 2}
      y={elemento.y + h / 2}
      scaleX={hover && clicavel ? 1.03 : 1}
      scaleY={hover && clicavel ? 1.03 : 1}
      onClick={clicavel ? () => onClick!(elemento) : undefined}
      onTap={clicavel ? () => onClick!(elemento) : undefined}
      onMouseEnter={
        clicavel
          ? (e) => {
              setCursor(e, "pointer");
              setHover(true);
            }
          : undefined
      }
      onMouseLeave={
        clicavel
          ? (e) => {
              setCursor(e, "default");
              setHover(false);
            }
          : undefined
      }
      listening={clicavel}
    >
      {/* Só o desenho gira; rótulos e selo ficam sempre legíveis */}
      <Group rotation={elemento.rotacao} offsetX={w / 2} offsetY={h / 2}>
        <Desenho tipo={elemento.tipo} w={w} h={h} hover={hover && clicavel} />
      </Group>

      {elemento.rotulo && (
        <Text
          text={elemento.rotulo}
          width={ehArea ? w - 16 : w + 60}
          x={ehArea ? -w / 2 + 10 : -w / 2 - 30}
          y={ehArea ? -h / 2 + 8 : h / 2 + offsetRotulo}
          align={ehArea ? "left" : "center"}
          fontSize={ehArea ? 13 : 11}
          fontStyle={ehArea ? "bold" : "normal"}
          fill={ehArea ? "#a8a29e" : COR.rotulo}
          listening={false}
          perfectDrawEnabled={false}
        />
      )}
      {nomeFuncionario && (
        <Text
          text={nomeFuncionario}
          width={w + 60}
          x={-w / 2 - 30}
          y={h / 2 + offsetRotulo + (elemento.rotulo ? 13 : 0)}
          align="center"
          fontSize={10}
          fill="#78716c"
          listening={false}
          perfectDrawEnabled={false}
        />
      )}
      {!!qtdItens && qtdItens > 0 && (
        <Group x={w / 2 - 11} y={-h / 2 - 7} listening={false}>
          <Rect
            width={22}
            height={16}
            cornerRadius={8}
            fill="#3b82f6"
            shadowColor="#0f172a"
            shadowOpacity={0.2}
            shadowBlur={3}
            shadowOffsetY={1}
            perfectDrawEnabled={false}
          />
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

/**
 * Cadeira de escritório vista de cima: assento arredondado, encosto em arco
 * e dois apoios de braço. `rotacaoLocal` gira a cadeira em torno do assento
 * (0 = encosto para baixo, como quem senta de frente para cima).
 */
function CadeiraTopo({
  cx,
  cy,
  r,
  rotacao = 0,
}: {
  cx: number;
  cy: number;
  r: number;
  rotacao?: number;
}) {
  return (
    <Group x={cx} y={cy} rotation={rotacao} listening={false}>
      {/* Encosto (arco na parte de baixo do assento) */}
      <Arc
        innerRadius={r * 0.92}
        outerRadius={r * 1.28}
        angle={130}
        rotation={25}
        fill={COR.cadeiraEncosto}
        cornerRadius={3}
        perfectDrawEnabled={false}
      />
      {/* Apoios de braço */}
      <Rect
        x={-r * 1.12}
        y={-r * 0.5}
        width={r * 0.3}
        height={r}
        cornerRadius={r * 0.15}
        fill={COR.cadeiraEncosto}
        perfectDrawEnabled={false}
      />
      <Rect
        x={r * 0.82}
        y={-r * 0.5}
        width={r * 0.3}
        height={r}
        cornerRadius={r * 0.15}
        fill={COR.cadeiraEncosto}
        perfectDrawEnabled={false}
      />
      {/* Assento */}
      <Circle radius={r * 0.9} fill={COR.cadeiraAssento} {...SOMBRA} />
      <Circle
        radius={r * 0.55}
        fill={COR.cadeiraEncosto}
        opacity={0.35}
        perfectDrawEnabled={false}
      />
    </Group>
  );
}

/** Desenho de cada tipo de móvel (coordenadas locais 0..w × 0..h). */
function Desenho({
  tipo,
  w,
  h,
  hover,
}: {
  tipo: TipoElemento;
  w: number;
  h: number;
  hover: boolean;
}) {
  const sombra = {
    ...SOMBRA,
    shadowOpacity: hover ? 0.26 : SOMBRA.shadowOpacity,
    shadowBlur: hover ? 11 : SOMBRA.shadowBlur,
  };

  switch (tipo) {
    case "mesa": {
      // Estação de trabalho: cadeira encaixada embaixo do tampo + monitor,
      // teclado e uma folha de papel sobre a mesa (como nas referências).
      const rCadeira = Math.min(17, w * 0.17);
      const mostrarItens = w >= 80 && h >= 50;
      const monitorW = w * 0.32;
      return (
        <>
          {/* Cadeira desenhada antes: o tampo cobre metade do assento (encaixada) */}
          <CadeiraTopo cx={w / 2} cy={h + rCadeira * 0.15} r={rCadeira} rotacao={0} />
          {/* Tampo de madeira */}
          <Rect
            width={w}
            height={h}
            fill={COR.madeira}
            stroke={COR.madeiraBorda}
            strokeWidth={1.5}
            cornerRadius={6}
            {...sombra}
          />
          <Rect
            x={3}
            y={3}
            width={w - 6}
            height={h - 6}
            fill={COR.madeiraClara}
            opacity={0.5}
            cornerRadius={4}
            listening={false}
            perfectDrawEnabled={false}
          />
          {mostrarItens && (
            <>
              {/* Monitor (barra escura) com pezinho */}
              <Rect
                x={w / 2 - monitorW / 2}
                y={h * 0.16}
                width={monitorW}
                height={7}
                cornerRadius={2.5}
                fill={COR.monitor}
                listening={false}
                perfectDrawEnabled={false}
              />
              <Rect
                x={w / 2 - 2}
                y={h * 0.16 + 7}
                width={4}
                height={4}
                fill={COR.monitor}
                listening={false}
                perfectDrawEnabled={false}
              />
              {/* Teclado */}
              <Rect
                x={w / 2 - monitorW * 0.4}
                y={h * 0.5}
                width={monitorW * 0.8}
                height={h * 0.16}
                cornerRadius={2}
                fill={COR.teclado}
                opacity={0.8}
                listening={false}
                perfectDrawEnabled={false}
              />
              {/* Folha de papel levemente girada */}
              <Rect
                x={w * 0.74}
                y={h * 0.3}
                width={w * 0.15}
                height={h * 0.42}
                cornerRadius={1}
                fill={COR.papel}
                stroke={COR.papelBorda}
                strokeWidth={0.5}
                rotation={12}
                listening={false}
                perfectDrawEnabled={false}
              />
            </>
          )}
        </>
      );
    }

    case "cadeira": {
      const r = Math.min(w, h) / 2;
      return <CadeiraTopo cx={w / 2} cy={h / 2} r={r} />;
    }

    case "estante":
    case "prateleira": {
      // Vista de cima de estante/prateleira: estrutura de madeira com
      // divisões e volumes neutros (caixas/pastas) dentro.
      const horizontal = w >= h;
      const numDivisoes = horizontal
        ? Math.max(2, Math.round(w / 55))
        : Math.max(2, Math.round(h / 55));
      const conteudo: React.ReactNode[] = [];
      for (let i = 0; i < numDivisoes; i++) {
        const t = (i + 0.5) / numDivisoes;
        const cx = horizontal ? t * w : w / 2;
        const cy = horizontal ? h / 2 : t * h;
        const tam =
          Math.min(horizontal ? w / numDivisoes : w, horizontal ? h : h / numDivisoes) * 0.5;
        conteudo.push(
          <Rect
            key={i}
            x={cx - tam / 2}
            y={cy - tam / 2}
            width={tam}
            height={tam}
            fill={i % 2 === 0 ? COR.caixaPapelao : COR.madeiraClara}
            stroke={COR.caixaFita}
            strokeWidth={0.5}
            cornerRadius={2}
            rotation={i % 3 === 1 ? 6 : 0}
            listening={false}
            perfectDrawEnabled={false}
          />,
        );
      }
      return (
        <>
          <Rect
            width={w}
            height={h}
            fill={COR.madeira}
            stroke={COR.madeiraBorda}
            strokeWidth={1.5}
            cornerRadius={4}
            {...sombra}
          />
          {Array.from({ length: numDivisoes - 1 }, (_, i) => {
            const t = ((i + 1) / numDivisoes) * (horizontal ? w : h);
            return (
              <Line
                key={i}
                points={horizontal ? [t, 2, t, h - 2] : [2, t, w - 2, t]}
                stroke={COR.madeiraBorda}
                strokeWidth={1.5}
                listening={false}
                perfectDrawEnabled={false}
              />
            );
          })}
          {conteudo}
        </>
      );
    }

    case "porta":
      // Sem desenho de portas na proposta atual — marca discreta no piso.
      return (
        <Rect width={w} height={h} fill="#e7e5e4" cornerRadius={2} perfectDrawEnabled={false} />
      );

    case "parede":
    case "divisoria":
      return <Rect width={w} height={h} fill={COR.parede} cornerRadius={1} {...sombra} />;

    case "computador": {
      // Monitor avulso visto de cima: barra escura + base.
      return (
        <>
          <Rect width={w} height={h * 0.42} cornerRadius={3} fill={COR.monitor} {...sombra} />
          <Rect
            x={w / 2 - 2}
            y={h * 0.42}
            width={4}
            height={h * 0.28}
            fill={COR.monitor}
            listening={false}
            perfectDrawEnabled={false}
          />
          <Rect
            x={w * 0.28}
            y={h * 0.7}
            width={w * 0.44}
            height={h * 0.2}
            cornerRadius={2}
            fill={COR.telaApagada}
            listening={false}
            perfectDrawEnabled={false}
          />
        </>
      );
    }

    case "impressora": {
      return (
        <>
          <Rect
            width={w}
            height={h}
            fill={COR.cinza}
            stroke={COR.cinzaEscuro}
            strokeWidth={1}
            cornerRadius={5}
            {...sombra}
          />
          <Rect
            x={w * 0.18}
            y={h * 0.12}
            width={w * 0.64}
            height={h * 0.3}
            cornerRadius={1}
            fill={COR.papel}
            stroke={COR.papelBorda}
            strokeWidth={0.5}
            listening={false}
            perfectDrawEnabled={false}
          />
          <Rect
            x={w * 0.12}
            y={h * 0.58}
            width={w * 0.76}
            height={h * 0.12}
            cornerRadius={2}
            fill={COR.cinzaEscuro}
            listening={false}
            perfectDrawEnabled={false}
          />
        </>
      );
    }

    case "caixa": {
      return (
        <>
          <Rect
            width={w}
            height={h}
            fill={COR.caixaPapelao}
            stroke={COR.caixaFita}
            strokeWidth={1}
            cornerRadius={3}
            {...sombra}
          />
          <Rect
            x={w / 2 - 2}
            y={0}
            width={4}
            height={h}
            fill={COR.caixaFita}
            opacity={0.55}
            listening={false}
            perfectDrawEnabled={false}
          />
          <Line
            points={[0, 0, w * 0.3, h / 2, 0, h]}
            stroke={COR.caixaFita}
            strokeWidth={0.8}
            opacity={0.6}
            listening={false}
            perfectDrawEnabled={false}
          />
          <Line
            points={[w, 0, w * 0.7, h / 2, w, h]}
            stroke={COR.caixaFita}
            strokeWidth={0.8}
            opacity={0.6}
            listening={false}
            perfectDrawEnabled={false}
          />
        </>
      );
    }

    case "area":
      return (
        <Rect
          width={w}
          height={h}
          fill="rgba(120, 113, 108, 0.05)"
          stroke="#d6d3d1"
          strokeWidth={1.5}
          dash={[8, 6]}
          cornerRadius={14}
          perfectDrawEnabled={false}
        />
      );

    default:
      return (
        <Rect width={w} height={h} fill="#e7e5e4" stroke="#d6d3d1" cornerRadius={6} {...sombra} />
      );
  }
}
