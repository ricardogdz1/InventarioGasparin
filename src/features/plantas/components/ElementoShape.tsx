import { useState } from "react";
import { Arc, Circle, Group, Line, Rect, Text } from "react-konva";
import type { KonvaEventObject } from "konva/lib/Node";
import type { ElementoPlanta, TipoElemento } from "../types";

/**
 * Móveis em flat design cartunizado (identidade visual da especificação):
 * cada tipo tem um desenho próprio, reconhecível à primeira vista mesmo sem
 * rótulo — mesa com cadeira, estante com caixas, porta com arco de abertura…
 * O laranja continua RESERVADO ao destaque do item buscado.
 */
const COR: Record<string, string> = {
  mesaTampo: "#bfdbfe",
  mesaBorda: "#93c5fd",
  mesaDetalhe: "#dbeafe",
  cadeira: "#cbd5e1",
  cadeiraBorda: "#94a3b8",
  estante: "#ddd6fe",
  estanteBorda: "#c4b5fd",
  caixaA: "#fed7aa",
  caixaB: "#fdba74",
  caixaFita: "#f59e0b",
  porta: "#86efac",
  parede: "#64748b",
  monitor: "#334155",
  tela: "#99f6e4",
  impressora: "#fde68a",
  impressoraBorda: "#fcd34d",
  papel: "#ffffff",
  rotulo: "#475569",
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

  return (
    <Group
      x={elemento.x + w / 2}
      y={elemento.y + h / 2}
      offsetX={w / 2}
      offsetY={h / 2}
      rotation={elemento.rotacao}
      scaleX={hover && clicavel ? 1.04 : 1}
      scaleY={hover && clicavel ? 1.04 : 1}
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
      <Desenho tipo={elemento.tipo} w={w} h={h} hover={hover && clicavel} />

      {/* Rótulo e nome do funcionário (informação extra, não é mais a única pista) */}
      {elemento.rotulo && (
        <Text
          text={elemento.rotulo}
          width={ehArea ? w - 16 : w}
          x={ehArea ? 10 : 0}
          y={ehArea ? 8 : h + 4}
          align={ehArea ? "left" : "center"}
          fontSize={ehArea ? 13 : 11}
          fontStyle={ehArea ? "bold" : "normal"}
          fill={ehArea ? "#94a3b8" : COR.rotulo}
          listening={false}
          perfectDrawEnabled={false}
        />
      )}
      {nomeFuncionario && (
        <Text
          text={nomeFuncionario}
          width={w + 40}
          x={-20}
          y={elemento.rotulo ? h + 17 : h + 4}
          align="center"
          fontSize={10}
          fill="#64748b"
          listening={false}
          perfectDrawEnabled={false}
        />
      )}
      {!!qtdItens && qtdItens > 0 && (
        <Group x={w - 11} y={-7} listening={false}>
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

/** Desenho específico de cada tipo de móvel (coordenadas locais 0..w × 0..h). */
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
    shadowColor: "#0f172a",
    shadowOpacity: hover ? 0.22 : 0.13,
    shadowBlur: hover ? 9 : 6,
    shadowOffsetY: 3,
    perfectDrawEnabled: false as const,
  };

  switch (tipo) {
    case "mesa": {
      const cadeiraR = Math.min(14, w * 0.14);
      return (
        <>
          {/* Cadeira atrás da mesa (deixa óbvio que é um posto de trabalho) */}
          <Circle
            x={w / 2}
            y={-cadeiraR * 0.4}
            radius={cadeiraR}
            fill={COR.cadeira}
            stroke={COR.cadeiraBorda}
            strokeWidth={1}
            perfectDrawEnabled={false}
          />
          <Arc
            x={w / 2}
            y={-cadeiraR * 0.4}
            innerRadius={cadeiraR}
            outerRadius={cadeiraR + 3.5}
            angle={150}
            rotation={195}
            fill={COR.cadeiraBorda}
            perfectDrawEnabled={false}
          />
          {/* Tampo da mesa */}
          <Rect
            width={w}
            height={h}
            fill={COR.mesaTampo}
            stroke={COR.mesaBorda}
            strokeWidth={1.5}
            cornerRadius={10}
            {...sombra}
          />
          <Rect
            x={5}
            y={5}
            width={w - 10}
            height={h - 10}
            fill={COR.mesaDetalhe}
            cornerRadius={7}
            listening={false}
            perfectDrawEnabled={false}
          />
        </>
      );
    }

    case "cadeira": {
      const r = Math.min(w, h) / 2;
      return (
        <>
          <Circle
            x={w / 2}
            y={h / 2}
            radius={r}
            fill={COR.cadeira}
            stroke={COR.cadeiraBorda}
            strokeWidth={1.5}
            {...sombra}
          />
          <Arc
            x={w / 2}
            y={h / 2}
            innerRadius={r}
            outerRadius={r + 4}
            angle={160}
            rotation={100}
            fill={COR.cadeiraBorda}
            perfectDrawEnabled={false}
          />
        </>
      );
    }

    case "estante":
    case "prateleira": {
      const horizontal = w >= h;
      const numDivisoes = horizontal
        ? Math.max(2, Math.round(w / 55))
        : Math.max(2, Math.round(h / 55));
      const caixas: React.ReactNode[] = [];
      // Caixinhas alternadas dentro dos compartimentos (leitura imediata: armazenagem)
      for (let i = 0; i < numDivisoes; i++) {
        const t = (i + 0.5) / numDivisoes;
        const cx = horizontal ? t * w : w / 2;
        const cy = horizontal ? h / 2 : t * h;
        const tam =
          Math.min(horizontal ? w / numDivisoes : w, horizontal ? h : h / numDivisoes) * 0.45;
        caixas.push(
          <Rect
            key={i}
            x={cx - tam / 2}
            y={cy - tam / 2}
            width={tam}
            height={tam}
            fill={i % 2 === 0 ? COR.caixaA : COR.caixaB}
            cornerRadius={2}
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
            fill={COR.estante}
            stroke={COR.estanteBorda}
            strokeWidth={1.5}
            cornerRadius={6}
            {...sombra}
          />
          {Array.from({ length: numDivisoes - 1 }, (_, i) => {
            const t = ((i + 1) / numDivisoes) * (horizontal ? w : h);
            return (
              <Line
                key={i}
                points={horizontal ? [t, 3, t, h - 3] : [3, t, w - 3, t]}
                stroke={COR.estanteBorda}
                strokeWidth={1.5}
                listening={false}
                perfectDrawEnabled={false}
              />
            );
          })}
          {caixas}
        </>
      );
    }

    case "porta": {
      // Convenção de planta baixa: folha da porta + arco de abertura
      const raio = Math.max(w, h);
      const horizontal = w >= h;
      return (
        <>
          <Rect width={w} height={h} fill={COR.porta} cornerRadius={2} perfectDrawEnabled={false} />
          <Arc
            x={0}
            y={horizontal ? h / 2 : 0}
            innerRadius={raio - 1.5}
            outerRadius={raio}
            angle={90}
            rotation={horizontal ? -90 : 0}
            stroke={COR.porta}
            strokeWidth={1.5}
            dash={[5, 4]}
            listening={false}
            perfectDrawEnabled={false}
          />
          <Line
            points={horizontal ? [0, h / 2, 0, h / 2 - raio] : [0, 0, raio, 0]}
            stroke={COR.porta}
            strokeWidth={3}
            lineCap="round"
            listening={false}
            perfectDrawEnabled={false}
          />
        </>
      );
    }

    case "parede":
    case "divisoria": {
      const horizontal = w >= h;
      const passos = Math.floor((horizontal ? w : h) / 14);
      return (
        <>
          <Rect
            width={w}
            height={h}
            fill={COR.parede}
            cornerRadius={2}
            perfectDrawEnabled={false}
          />
          {Array.from({ length: passos }, (_, i) => {
            const t = (i + 0.5) * 14;
            return (
              <Line
                key={i}
                points={
                  horizontal ? [t, 1, t + Math.min(6, h), h - 1] : [1, t, w - 1, t + Math.min(6, w)]
                }
                stroke="#f8fafc"
                strokeWidth={1}
                opacity={0.5}
                listening={false}
                perfectDrawEnabled={false}
              />
            );
          })}
        </>
      );
    }

    case "computador": {
      const baseH = h * 0.18;
      return (
        <>
          {/* Monitor com tela acesa + pé */}
          <Rect width={w} height={h - baseH - 3} fill={COR.monitor} cornerRadius={4} {...sombra} />
          <Rect
            x={2.5}
            y={2.5}
            width={w - 5}
            height={h - baseH - 8}
            fill={COR.tela}
            cornerRadius={2.5}
            listening={false}
            perfectDrawEnabled={false}
          />
          <Rect
            x={w / 2 - 2}
            y={h - baseH - 3}
            width={4}
            height={baseH}
            fill={COR.monitor}
            listening={false}
            perfectDrawEnabled={false}
          />
          <Rect
            x={w / 2 - w * 0.28}
            y={h - 2.5}
            width={w * 0.56}
            height={2.5}
            cornerRadius={1}
            fill={COR.monitor}
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
            y={h * 0.22}
            width={w}
            height={h * 0.78}
            fill={COR.impressora}
            stroke={COR.impressoraBorda}
            strokeWidth={1.5}
            cornerRadius={6}
            {...sombra}
          />
          {/* Papel saindo por cima */}
          <Rect
            x={w * 0.2}
            y={0}
            width={w * 0.6}
            height={h * 0.34}
            fill={COR.papel}
            stroke="#e2e8f0"
            strokeWidth={1}
            cornerRadius={1}
            listening={false}
            perfectDrawEnabled={false}
          />
          <Rect
            x={w * 0.12}
            y={h * 0.52}
            width={w * 0.76}
            height={h * 0.1}
            cornerRadius={2}
            fill={COR.impressoraBorda}
            listening={false}
            perfectDrawEnabled={false}
          />
          <Circle
            x={w * 0.85}
            y={h * 0.38}
            radius={2.5}
            fill="#22c55e"
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
            fill={COR.caixaA}
            stroke={COR.caixaB}
            strokeWidth={1.5}
            cornerRadius={4}
            {...sombra}
          />
          {/* Fita adesiva + abas da caixa */}
          <Rect
            x={w / 2 - 2.5}
            y={0}
            width={5}
            height={h}
            fill={COR.caixaFita}
            opacity={0.7}
            listening={false}
            perfectDrawEnabled={false}
          />
          <Line
            points={[0, 0, w * 0.32, h / 2, 0, h]}
            stroke={COR.caixaB}
            strokeWidth={1}
            listening={false}
            perfectDrawEnabled={false}
          />
          <Line
            points={[w, 0, w * 0.68, h / 2, w, h]}
            stroke={COR.caixaB}
            strokeWidth={1}
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
          fill="rgba(100, 116, 139, 0.05)"
          stroke="#cbd5e1"
          strokeWidth={1.5}
          dash={[8, 6]}
          cornerRadius={14}
          perfectDrawEnabled={false}
        />
      );

    default:
      return (
        <Rect width={w} height={h} fill="#e2e8f0" stroke="#cbd5e1" cornerRadius={6} {...sombra} />
      );
  }
}
