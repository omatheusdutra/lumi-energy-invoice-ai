import { CloudUpload, FileCheck2, ShieldCheck, Sparkles } from 'lucide-react';
import { UploadPanel } from '@/components/upload/upload-panel';

export default function UploadPage() {
  return (
    <div className="space-y-6">
      <header className="space-y-4 rounded-2xl border border-sky-100/80 bg-white/90 p-6 shadow-soft">
        <p className="text-sm font-medium text-slate-500">Upload &gt; Processamento multimodal</p>
        <h2 className="font-[var(--font-heading)] text-[2rem] font-semibold tracking-tight text-[#062a53] md:text-[2.2rem]">
          Upload de Faturas
        </h2>
        <p className="max-w-3xl text-sm text-muted-foreground">
          Envie PDFs para extração com IA multimodal, valide os dados calculados e acompanhe a
          persistência no backend em tempo real.
        </p>

        <div className="flex flex-wrap gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-sky-100 bg-sky-50/80 px-3 py-1 text-xs font-semibold text-sky-700">
            <CloudUpload className="h-3.5 w-3.5" aria-hidden="true" />
            Upload seguro
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-sky-100 bg-sky-50/80 px-3 py-1 text-xs font-semibold text-sky-700">
            <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
            Extração IA
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-sky-100 bg-sky-50/80 px-3 py-1 text-xs font-semibold text-sky-700">
            <FileCheck2 className="h-3.5 w-3.5" aria-hidden="true" />
            Validação de campos
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-sky-100 bg-sky-50/80 px-3 py-1 text-xs font-semibold text-sky-700">
            <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
            Persistência rastreável
          </span>
        </div>
      </header>

      <UploadPanel />
    </div>
  );
}
