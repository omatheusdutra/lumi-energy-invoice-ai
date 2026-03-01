'use client';

import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Clock3, FileCheck2, FileUp, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { Route } from 'next';
import { uploadInvoice } from '@/lib/api/upload';
import { queryKeys } from '@/lib/api/query-keys';
import { type Invoice } from '@/lib/api/schemas';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { InlineAlert } from '@/components/ui/inline-alert';
import { Progress } from '@/components/ui/progress';
import { Tooltip, TooltipInfo } from '@/components/ui/tooltip';
import { formatCurrency, formatKwh } from '@/lib/format';
import { loadOperationalPreferences } from '@/lib/settings/operational-preferences';

const MIN_PREVIEW_HOLD_SEC = 3;
const MAX_PREVIEW_HOLD_SEC = 30;
const FALLBACK_PREVIEW_HOLD_SEC = 8;

function resolveAutoRedirectDelayMs(): number {
  const configuredSeconds =
    loadOperationalPreferences().uploadPreviewHoldSec ?? FALLBACK_PREVIEW_HOLD_SEC;
  const normalizedSeconds = Math.min(
    MAX_PREVIEW_HOLD_SEC,
    Math.max(MIN_PREVIEW_HOLD_SEC, configuredSeconds),
  );
  return Math.round(normalizedSeconds * 1000);
}

export function UploadPanel() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const redirectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const countdownTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [progress, setProgress] = useState(0);
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);
  const [secondsToRedirect, setSecondsToRedirect] = useState<number | null>(null);

  function clearRedirectTimers() {
    if (redirectTimerRef.current) {
      clearTimeout(redirectTimerRef.current);
      redirectTimerRef.current = null;
    }
    if (countdownTimerRef.current) {
      clearInterval(countdownTimerRef.current);
      countdownTimerRef.current = null;
    }
    setSecondsToRedirect(null);
  }

  const mutation = useMutation({
    mutationFn: async (file: File) => {
      setProgress(0);
      return uploadInvoice(file, { onProgress: setProgress });
    },
    onSuccess: async (invoice) => {
      // Keep invoice detail hot and trigger refetch of dependent analytics views.
      queryClient.setQueryData(queryKeys.invoice(invoice.id), invoice);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.invoicesRoot }),
        queryClient.invalidateQueries({ queryKey: queryKeys.dashboardRoot }),
        queryClient.invalidateQueries({ queryKey: queryKeys.financialSummaryRoot }),
        queryClient.invalidateQueries({ queryKey: queryKeys.alertsRoot }),
        queryClient.invalidateQueries({ queryKey: queryKeys.invoicesSummaryRoot }),
      ]);
      setProgress(100);

      const targetUrl = `/invoices?numero_cliente=${encodeURIComponent(invoice.numeroCliente)}&mes_referencia=${encodeURIComponent(invoice.mesReferencia)}&page=1&pageSize=20`;
      const autoRedirectDelayMs = resolveAutoRedirectDelayMs();
      clearRedirectTimers();
      setSecondsToRedirect(Math.ceil(autoRedirectDelayMs / 1000));

      countdownTimerRef.current = setInterval(() => {
        setSecondsToRedirect((current) => {
          if (current === null || current <= 1) {
            if (countdownTimerRef.current) {
              clearInterval(countdownTimerRef.current);
              countdownTimerRef.current = null;
            }
            return null;
          }
          return current - 1;
        });
      }, 1000);

      redirectTimerRef.current = setTimeout(() => {
        router.push(targetUrl as Route);
      }, autoRedirectDelayMs);
    },
  });

  const uploaded = mutation.data;
  const errorMessage = mutation.error instanceof Error ? mutation.error.message : null;
  const statusLabel = useMemo(() => {
    if (mutation.isPending) {
      return 'Enviando arquivo e processando com IA...';
    }
    if (mutation.isSuccess) {
      return 'Fatura processada com sucesso.';
    }
    return null;
  }, [mutation.isPending, mutation.isSuccess]);

  useEffect(() => {
    return () => {
      clearRedirectTimers();
    };
  }, []);

  function handleFiles(files: FileList | File[] | null) {
    const file =
      files && 'item' in files && typeof files.item === 'function' ? files.item(0) : files?.[0];
    if (!file) {
      return;
    }

    setSelectedFileName(file.name);
    mutation.reset();
    clearRedirectTimers();
    mutation.mutate(file);
  }

  return (
    <section className="grid gap-6 lg:grid-cols-[1.1fr_1fr]">
      <Card className="rounded-2xl border border-sky-100/80 bg-white/95 shadow-soft">
        <CardHeader>
          <CardTitle className="flex items-center gap-1">
            Upload de fatura
            <TooltipInfo content="PDF da conta de energia enviado para extração multimodal e persistência." />
          </CardTitle>
          <CardDescription>
            Arraste e solte um PDF de fatura de energia. O arquivo vai direto para o modelo
            multimodal, sem OCR local.
          </CardDescription>
          <div className="mt-2 flex flex-wrap gap-2">
            <span className="inline-flex items-center gap-1 rounded-full border border-sky-100 bg-sky-50/70 px-2.5 py-1 text-[0.7rem] font-semibold text-sky-700">
              <FileCheck2 className="h-3.5 w-3.5" aria-hidden="true" />
              Validação automática
            </span>
            <span className="inline-flex items-center gap-1 rounded-full border border-sky-100 bg-sky-50/70 px-2.5 py-1 text-[0.7rem] font-semibold text-sky-700">
              <Clock3 className="h-3.5 w-3.5" aria-hidden="true" />
              Redirecionamento configurável
            </span>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          <Tooltip
            content="Aceita apenas PDF. O arquivo é enviado direto para processamento multimodal."
            side="top"
            className="block"
          >
            <label
              htmlFor={inputId}
              role="button"
              tabIndex={0}
              aria-label="Área de upload de arquivo PDF"
              className={`block cursor-pointer rounded-xl border-2 border-dashed p-8 text-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${
                dragActive
                  ? 'border-primary bg-gradient-to-b from-sky-50 to-transparent'
                  : 'border-border bg-gradient-to-b from-slate-50 to-transparent'
              }`}
              onDragEnter={(event) => {
                event.preventDefault();
                setDragActive(true);
              }}
              onDragOver={(event) => {
                event.preventDefault();
                event.dataTransfer.dropEffect = 'copy';
                setDragActive(true);
              }}
              onDragLeave={() => setDragActive(false)}
              onDrop={(event) => {
                event.preventDefault();
                setDragActive(false);
                handleFiles(event.dataTransfer.files);
              }}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();
                  inputRef.current?.click();
                }
              }}
            >
              <FileUp className="mx-auto mb-3 h-9 w-9 text-primary" aria-hidden="true" />
              <p className="mb-2 text-sm font-semibold">
                Clique para selecionar ou arraste um PDF aqui
              </p>
              <p className="text-xs text-muted-foreground">
                Apenas arquivos PDF. Limite definido pelo backend.
              </p>
            </label>
          </Tooltip>

          <input
            id={inputId}
            ref={inputRef}
            type="file"
            accept=".pdf,application/pdf"
            className="sr-only"
            onChange={(event) => {
              handleFiles(event.target.files);
              event.currentTarget.value = '';
            }}
          />

          {mutation.isPending ? (
            <div className="space-y-2" aria-live="polite">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                {statusLabel}
              </div>
              <Progress value={progress} />
              <p className="text-xs text-muted-foreground">{progress}% concluído</p>
            </div>
          ) : null}

          {selectedFileName ? (
            <span
              className="inline-flex max-w-full items-center gap-2 rounded-full border border-sky-100 bg-sky-50/70 px-3 py-1 text-xs font-medium text-slate-700"
              aria-live="polite"
            >
              <FileCheck2 className="h-3.5 w-3.5 text-sky-700" aria-hidden="true" />
              <span className="truncate">Arquivo selecionado: {selectedFileName}</span>
            </span>
          ) : null}

          {mutation.isSuccess && statusLabel ? (
            <InlineAlert
              variant="success"
              title={statusLabel}
              description={
                secondsToRedirect
                  ? `Abrindo a listagem em ${secondsToRedirect}s.`
                  : 'Você pode revisar o preview abaixo antes de abrir a listagem.'
              }
            />
          ) : null}
          {mutation.isSuccess && uploaded ? (
            <div className="flex flex-wrap gap-2">
              <Link
                href={`/invoices?numero_cliente=${encodeURIComponent(uploaded.numeroCliente)}&mes_referencia=${encodeURIComponent(uploaded.mesReferencia)}&page=1&pageSize=20`}
                className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
              >
                Ir para faturas agora
              </Link>
              <button
                type="button"
                className="inline-flex items-center justify-center rounded-md border border-border bg-background px-4 py-2 text-sm font-semibold text-foreground transition hover:bg-muted"
                onClick={() => clearRedirectTimers()}
              >
                Manter preview na tela
              </button>
            </div>
          ) : null}
          {errorMessage ? (
            <InlineAlert
              variant="danger"
              title="Falha no upload"
              description={errorMessage}
              className="border-danger/30"
            />
          ) : null}
        </CardContent>
      </Card>

      <InvoicePreview invoice={uploaded} />
    </section>
  );
}

function InvoicePreview({ invoice }: { invoice?: Invoice }) {
  if (!invoice) {
    return (
      <Card className="rounded-2xl border border-sky-100/80 bg-white/95 shadow-soft">
        <CardHeader>
          <CardTitle className="flex items-center gap-1">
            Preview
            <TooltipInfo content="Exibe os dados persistidos após o processamento da fatura." />
          </CardTitle>
          <CardDescription>
            Os dados extraídos e calculados serão exibidos aqui após o processamento.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="h-12 rounded-lg border border-sky-100/70 bg-sky-50/50" />
          <div className="h-12 rounded-lg border border-sky-100/70 bg-sky-50/40" />
          <div className="h-12 rounded-lg border border-sky-100/70 bg-sky-50/30" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="rounded-2xl border border-sky-100/80 bg-white/95 shadow-soft">
      <CardHeader>
        <CardTitle>Fatura salva</CardTitle>
        <CardDescription>
          Cliente {invoice.numeroCliente} - {invoice.mesReferencia}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <dl className="space-y-2 text-sm">
          <Row
            label="Consumo total"
            value={formatKwh(invoice.consumoKwh)}
            tooltip="Soma de energia elétrica e energia SCEEE no período."
          />
          <Row
            label="Energia compensada"
            value={formatKwh(invoice.energiaCompensadaKwh)}
            tooltip="Energia compensada GD utilizada na fatura."
          />
          <Row
            label="Valor sem GD"
            value={formatCurrency(invoice.valorTotalSemGd)}
            tooltip="Valor estimado da conta sem compensação."
          />
          <Row
            label="Economia GD"
            value={formatCurrency(invoice.economiaGdRs)}
            tooltip="Economia financeira atribuída à compensação GD."
          />
          <Row
            label="Arquivo"
            value={invoice.sourceFilename}
            tooltip="Nome original do arquivo enviado."
          />
        </dl>

        <Tooltip content="Abre a listagem já filtrada por cliente e mês desta fatura." side="top">
          <Link
            href={`/invoices?numero_cliente=${encodeURIComponent(invoice.numeroCliente)}&mes_referencia=${encodeURIComponent(invoice.mesReferencia)}&page=1&pageSize=20`}
            className="mt-4 inline-block text-sm font-semibold"
          >
            Ver esta fatura na listagem
          </Link>
        </Tooltip>
      </CardContent>
    </Card>
  );
}

function Row({ label, value, tooltip }: { label: string; value: string; tooltip?: string }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-border pb-2">
      <dt className="flex items-center gap-1 text-muted-foreground">
        {label}
        {tooltip ? <TooltipInfo content={tooltip} side="top" /> : null}
      </dt>
      <dd className="text-right font-semibold">{value}</dd>
    </div>
  );
}
