import { useEffect, useMemo, useRef, useState } from "react";
import Konva from "konva";
import { Circle, Layer, Rect, Stage } from "react-konva";
import { MousePointerClick } from "lucide-react";
import type { KonvaEventObject } from "konva/lib/Node";
import type { Funcionario } from "../../funcionarios/types";
import type { ProdutoDetalhado } from "../../inventario/types";
import type { ElementoPlanta, PlantaDados } from "../types";
import { ElementoShape } from "./ElementoShape";
import { Callout } from "./Callout";

const ZOOM_MIN = 0.2;
const ZOOM_MAX = 4;

interface PlantaViewerProps {
  planta: PlantaDados;
  funcionarios: Map<string, Funcionario>;
  /** Itens por elemento da planta (posicao_id) e por funcionário designado. */
  produtosPorElemento: Map<string, ProdutoDetalhado[]>;
  produtosPorFuncionario: Map<string, ProdutoDetalhado[]>;
  /** Elemento destacado pela busca (pulso laranja). */
  highlightId: string | null;
  onProdutoClick: (produto: ProdutoDetalhado) => void;
  /** Administrador pode designar funcionário a uma mesa direto no cartão. */
  isAdmin: boolean;
  listaFuncionarios: Funcionario[];
  onDesignarFuncionario: (elementoId: string, funcionarioId: string | null) => void;
}

/**
 * Visualizador da planta 2D (Konva): pan (arrastar), zoom (roda do mouse na
 * posição do cursor), culling de viewport (só desenha o que está visível) e
 * cartões flutuantes ancorados aos elementos clicados.
 */
export function PlantaViewer({
  planta,
  funcionarios,
  produtosPorElemento,
  produtosPorFuncionario,
  highlightId,
  onProdutoClick,
  isAdmin,
  listaFuncionarios,
  onDesignarFuncionario,
}: PlantaViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const pulseRef = useRef<Konva.Circle>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });
  const [scale, setScale] = useState(1);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [calloutsAbertos, setCalloutsAbertos] = useState<string[]>([]);

  // Acompanha o tamanho do contêiner (janela redimensionável do desktop).
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new ResizeObserver(() => {
      setSize({ width: el.clientWidth, height: el.clientHeight });
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Enquadra a planta inteira quando ela (ou o contêiner) muda.
  useEffect(() => {
    if (!size.width || !size.height) return;
    const fit = Math.min(size.width / planta.largura, size.height / planta.altura) * 0.92;
    setScale(fit);
    setPos({
      x: (size.width - planta.largura * fit) / 2,
      y: (size.height - planta.altura * fit) / 2,
    });
  }, [planta.largura, planta.altura, size.width, size.height]);

  // Abre o cartão do elemento destacado pela busca.
  useEffect(() => {
    if (highlightId)
      setCalloutsAbertos((abertos) =>
        abertos.includes(highlightId) ? abertos : [...abertos, highlightId],
      );
  }, [highlightId]);

  // Pulso laranja do destaque — animação fora do ciclo do React (performance).
  useEffect(() => {
    const node = pulseRef.current;
    if (!node || !highlightId) return;
    const anim = new Konva.Animation((frame) => {
      if (!frame) return;
      const t = (frame.time % 1400) / 1400;
      node.radius(26 + t * 26);
      node.opacity(0.85 * (1 - t));
    }, node.getLayer());
    anim.start();
    return () => {
      anim.stop();
    };
  }, [highlightId, planta]);

  function handleWheel(e: KonvaEventObject<WheelEvent>) {
    e.evt.preventDefault();
    const stage = e.target.getStage();
    if (!stage) return;
    const pointer = stage.getPointerPosition();
    if (!pointer) return;
    const fator = e.evt.deltaY > 0 ? 1 / 1.12 : 1.12;
    const novoScale = Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, scale * fator));
    // Zoom centrado no cursor: mantém o ponto do mundo sob o ponteiro.
    const mundo = { x: (pointer.x - pos.x) / scale, y: (pointer.y - pos.y) / scale };
    setScale(novoScale);
    setPos({ x: pointer.x - mundo.x * novoScale, y: pointer.y - mundo.y * novoScale });
  }

  // Culling: só renderiza elementos que intersectam a área visível.
  const visiveis = useMemo(() => {
    if (!size.width) return planta.elementos;
    const margem = 100;
    const vx = -pos.x / scale - margem;
    const vy = -pos.y / scale - margem;
    const vw = size.width / scale + margem * 2;
    const vh = size.height / scale + margem * 2;
    return planta.elementos.filter(
      (el) =>
        el.x + el.largura >= vx && el.x <= vx + vw && el.y + el.altura >= vy && el.y <= vy + vh,
    );
  }, [planta.elementos, pos, scale, size]);

  const elementoDestacado = highlightId
    ? planta.elementos.find((el) => el.id === highlightId)
    : null;

  /** Itens exibidos no cartão de um elemento (na posição + do funcionário da mesa). */
  function itensDoElemento(elemento: ElementoPlanta): ProdutoDetalhado[] {
    const daPosicao = produtosPorElemento.get(elemento.id) ?? [];
    const doFuncionario = elemento.funcionario_id
      ? (produtosPorFuncionario.get(elemento.funcionario_id) ?? [])
      : [];
    return [...daPosicao, ...doFuncionario];
  }

  function toScreen(x: number, y: number) {
    return { x: x * scale + pos.x, y: y * scale + pos.y };
  }

  return (
    <div ref={containerRef} className="relative h-full w-full overflow-hidden bg-[#dedcd7]">
      <Stage
        width={size.width}
        height={size.height}
        scaleX={scale}
        scaleY={scale}
        x={pos.x}
        y={pos.y}
        draggable
        onDragMove={(e) => {
          if (e.target === e.target.getStage()) setPos({ x: e.target.x(), y: e.target.y() });
        }}
        onWheel={handleWheel}
      >
        <Layer>
          {/* Piso da sala (cinza-claro) com paredes espessas ao redor */}
          <Rect
            width={planta.largura}
            height={planta.altura}
            fill="#eceae5"
            stroke="#b3aea6"
            strokeWidth={10}
            cornerRadius={4}
            shadowColor="#292524"
            shadowOpacity={0.18}
            shadowBlur={22}
            shadowOffsetX={8}
            shadowOffsetY={12}
            perfectDrawEnabled={false}
            listening={false}
          />
          {visiveis.map((elemento) => (
            <ElementoShape
              key={elemento.id}
              elemento={elemento}
              nomeFuncionario={
                elemento.funcionario_id
                  ? (funcionarios.get(elemento.funcionario_id)?.nome ?? null)
                  : null
              }
              qtdItens={itensDoElemento(elemento).length}
              onClick={(el) =>
                setCalloutsAbertos((abertos) =>
                  abertos.includes(el.id)
                    ? abertos.filter((id) => id !== el.id)
                    : [...abertos, el.id],
                )
              }
            />
          ))}
          {/* Pulso de destaque do item buscado (laranja reservado a isso) */}
          {elementoDestacado && (
            <>
              <Circle
                x={elementoDestacado.x + elementoDestacado.largura / 2}
                y={elementoDestacado.y + elementoDestacado.altura / 2}
                radius={26}
                stroke="#f97316"
                strokeWidth={3}
                listening={false}
                perfectDrawEnabled={false}
              />
              <Circle
                ref={pulseRef}
                x={elementoDestacado.x + elementoDestacado.largura / 2}
                y={elementoDestacado.y + elementoDestacado.altura / 2}
                radius={26}
                stroke="#f97316"
                strokeWidth={3}
                listening={false}
                perfectDrawEnabled={false}
              />
            </>
          )}
        </Layer>
      </Stage>

      {/* Dica de interação enquanto nenhum cartão está aberto */}
      {calloutsAbertos.length === 0 && planta.elementos.length > 0 && (
        <div className="pointer-events-none absolute bottom-4 left-4 flex items-center gap-2 rounded-full bg-white/90 px-3 py-1.5 text-xs text-slate-500 shadow ring-1 ring-slate-200">
          <MousePointerClick size={14} className="text-blue-500" />
          Clique em um móvel para ver os itens dele
        </div>
      )}

      {/* Cartões flutuantes ancorados (overlay HTML sincronizado com o canvas) */}
      {calloutsAbertos.map((elementoId, indice) => {
        const elemento = planta.elementos.find((el) => el.id === elementoId);
        if (!elemento) return null;
        const ancora = toScreen(
          elemento.x + elemento.largura / 2,
          elemento.y + elemento.altura / 2,
        );
        return (
          <Callout
            key={elementoId}
            elemento={elemento}
            ancora={ancora}
            indice={indice}
            container={size}
            destaque={elementoId === highlightId}
            funcionario={
              elemento.funcionario_id ? (funcionarios.get(elemento.funcionario_id) ?? null) : null
            }
            itens={itensDoElemento(elemento)}
            onProdutoClick={onProdutoClick}
            isAdmin={isAdmin}
            listaFuncionarios={listaFuncionarios}
            onDesignarFuncionario={onDesignarFuncionario}
            onClose={() =>
              setCalloutsAbertos((abertos) => abertos.filter((id) => id !== elementoId))
            }
          />
        );
      })}
    </div>
  );
}
