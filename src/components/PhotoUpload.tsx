import { useRef, useState } from "react";
import { Camera, Trash2 } from "lucide-react";
import { uploadFoto } from "../lib/fotos";
import { FotoThumb } from "./FotoThumb";

interface PhotoUploadProps {
  pasta: "produtos" | "funcionarios";
  value: string | null;
  onChange: (path: string | null) => void;
}

/**
 * Campo de foto dos formulários: envia a imagem ao Storage na seleção e
 * devolve o caminho salvo. Remover apenas limpa a referência — o registro
 * é a fonte de verdade; arquivos órfãos serão limpos em rotina futura.
 */
export function PhotoUpload({ pasta, value, onChange }: PhotoUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    setError(null);
    try {
      const path = await uploadFoto(pasta, file);
      onChange(path);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
      e.target.value = "";
    }
  }

  return (
    <div>
      <span className="mb-1 block text-sm font-medium text-slate-700">Foto (opcional)</span>
      <div className="flex items-center gap-3">
        <FotoThumb path={value} alt="Foto selecionada" className="h-16 w-16 rounded-lg" />
        <div className="flex flex-col gap-1.5">
          <button
            type="button"
            disabled={busy}
            onClick={() => inputRef.current?.click()}
            className="flex items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50 disabled:opacity-60"
          >
            <Camera size={15} /> {busy ? "Enviando…" : value ? "Trocar foto" : "Escolher foto"}
          </button>
          {value && (
            <button
              type="button"
              onClick={() => onChange(null)}
              className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-red-600"
            >
              <Trash2 size={13} /> Remover
            </button>
          )}
        </div>
      </div>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handleSelect}
        className="hidden"
      />
    </div>
  );
}
