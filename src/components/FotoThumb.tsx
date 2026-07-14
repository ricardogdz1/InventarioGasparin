import { useQuery } from "@tanstack/react-query";
import { ImageOff } from "lucide-react";
import { getFotoUrl } from "../lib/fotos";

interface FotoThumbProps {
  path: string | null;
  alt: string;
  /** Classes de tamanho/forma (ex.: "h-10 w-10 rounded-lg"). */
  className?: string;
}

/**
 * Miniatura de foto do bucket privado. A URL assinada expira em 1h,
 * então o cache do TanStack Query é renovado antes disso (45 min).
 */
export function FotoThumb({ path, alt, className = "h-10 w-10 rounded-lg" }: FotoThumbProps) {
  const { data: url } = useQuery({
    queryKey: ["foto", path],
    queryFn: () => getFotoUrl(path!),
    enabled: !!path,
    staleTime: 45 * 60 * 1000,
  });

  if (!path || !url) {
    return (
      <div className={`flex items-center justify-center bg-slate-100 text-slate-300 ${className}`}>
        <ImageOff size={16} />
      </div>
    );
  }

  return <img src={url} alt={alt} className={`object-cover ${className}`} />;
}
