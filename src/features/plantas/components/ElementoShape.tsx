import { useEffect, useReducer, useState } from "react";
import { Group, Image as KonvaImage, Rect, Text } from "react-konva";
import type { KonvaEventObject } from "konva/lib/Node";
import type { ElementoPlanta, TipoElemento } from "../types";
import mesaUrl from "../../../assets/moveis/mesa.svg";
import cadeiraUrl from "../../../assets/moveis/cadeira.svg";
import estanteUrl from "../../../assets/moveis/estante.svg";
import prateleiraUrl from "../../../assets/moveis/prateleira.svg";
import impressoraUrl from "../../../assets/moveis/impressora.svg";
import caixaUrl from "../../../assets/moveis/caixa.svg";
import computadorUrl from "../../../assets/moveis/computador.svg";

/**
 * Móveis desenhados como sprites SVG (ilustrações vetoriais com gradientes e
 * sombras difusas embutidas), no estilo das plantas de escritório de
 * referência — sóbrio, tons de madeira e cinza. Paredes, divisórias e áreas
 * continuam vetoriais simples. O laranja segue reservado ao destaque.
 */
const SPRITES: Partial<Record<TipoElemento, string>> = {
  mesa: mesaUrl,
  cadeira: cadeiraUrl,
  estante: estanteUrl,
  prateleira: prateleiraUrl,
  impressora: impressoraUrl,
  caixa: caixaUrl,
  computador: computadorUrl,
};

/** Tipos cujo sprite é horizontal e deve girar 90° quando o elemento é vertical. */
const GIRAM_QUANDO_VERTICAIS: TipoElemento[] = [
  "mesa",
  "estante",
  "prateleira",
  "impressora",
  "computador",
];

// Cache global de imagens: cada sprite é carregado uma única vez,
// independentemente de quantos móveis o usam na planta.
const cacheImagens = new Map<string, HTMLImageElement>();

function useImagem(url: string | null): HTMLImageElement | undefined {
  const [, atualizar] = useReducer((x: number) => x + 1, 0);

  useEffect(() => {
    if (!url) return;
    let img = cacheImagens.get(url);
    if (!img) {
      img = new window.Image();
      img.src = url;
      cacheImagens.set(url, img);
    }
    if (img.complete) return;
    img.addEventListener("load", atualizar);
    return () => img?.removeEventListener("load", atualizar);
  }, [url]);

  const img = url ? cacheImagens.get(url) : undefined;
  return img && img.complete && img.naturalWidth > 0 ? img : undefined;
}

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
  // A mesa inclui a cadeira no sprite; rótulo fica logo abaixo da caixa do elemento.
  const offsetRotulo = 6;

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
        <DesenhoElemento elemento={elemento} />
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
          fill={ehArea ? "#a8a29e" : "#57534e"}
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

/** Desenho do elemento: sprite SVG quando existe; vetor simples para o resto. */
function DesenhoElemento({ elemento }: { elemento: ElementoPlanta }) {
  const { tipo, largura: w, altura: h } = elemento;
  const url = SPRITES[tipo] ?? null;
  const img = useImagem(url);

  if (url) {
    if (!img) {
      // Enquanto o sprite carrega, um marcador discreto no lugar.
      return (
        <Rect
          width={w}
          height={h}
          fill="#e7e5e4"
          opacity={0.5}
          cornerRadius={6}
          perfectDrawEnabled={false}
        />
      );
    }
    // Sprites são horizontais: elementos "em pé" (altura > largura) giram 90°.
    const vertical = h > w && GIRAM_QUANDO_VERTICAIS.includes(tipo);
    if (vertical) {
      return (
        <KonvaImage
          image={img}
          x={w}
          rotation={90}
          width={h}
          height={w}
          perfectDrawEnabled={false}
        />
      );
    }
    return <KonvaImage image={img} width={w} height={h} perfectDrawEnabled={false} />;
  }

  switch (tipo) {
    case "parede":
    case "divisoria":
      return (
        <Rect
          width={w}
          height={h}
          fill="#a8a29e"
          cornerRadius={1}
          shadowColor="#292524"
          shadowOpacity={0.18}
          shadowBlur={8}
          shadowOffsetX={5}
          shadowOffsetY={7}
          perfectDrawEnabled={false}
        />
      );

    case "porta":
      // Sem desenho de portas na proposta atual — marca discreta no piso.
      return (
        <Rect width={w} height={h} fill="#e7e5e4" cornerRadius={2} perfectDrawEnabled={false} />
      );

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
        <Rect
          width={w}
          height={h}
          fill="#e7e5e4"
          stroke="#d6d3d1"
          cornerRadius={6}
          perfectDrawEnabled={false}
        />
      );
  }
}
