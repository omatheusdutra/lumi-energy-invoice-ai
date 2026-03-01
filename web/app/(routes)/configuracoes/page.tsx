'use client';

import { useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import {
  BellRing,
  BrainCircuit,
  Download,
  Gauge,
  RefreshCcw,
  Save,
  Settings,
  ShieldCheck,
  Sparkles,
  UploadCloud,
} from 'lucide-react';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { InlineAlert } from '@/components/ui/inline-alert';
import { Input } from '@/components/ui/input';
import { TooltipInfo } from '@/components/ui/tooltip';
import {
  createDefaultOperationalPreferences,
  loadOperationalPreferences,
  operationalPreferencesSchema,
  saveOperationalPreferences,
  type OperationalPreferences,
} from '@/lib/settings/operational-preferences';
import { formatPercent } from '@/lib/format';
import { cn } from '@/lib/utils';

type Feedback = {
  variant: 'success' | 'danger' | 'info';
  title: string;
  description?: string;
} | null;

type InsightMode = OperationalPreferences['insightMode'];

function normalizeOptional(value: string): string | undefined {
  const normalized = value.trim();
  return normalized.length > 0 ? normalized : undefined;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function safeNumber(value: string, fallback: number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function riskScore(preferences: OperationalPreferences): number {
  const compensationRisk = 100 - preferences.compensationTargetPercent;
  const consumptionRisk = preferences.consumptionSpikePercent;
  const economyRisk = preferences.economyDropPercent;
  const modeOffset =
    preferences.insightMode === 'aggressive'
      ? -8
      : preferences.insightMode === 'conservative'
        ? 8
        : 0;

  return clamp(
    Math.round(compensationRisk * 0.45 + consumptionRisk * 0.3 + economyRisk * 0.25 + modeOffset),
    0,
    100,
  );
}

function riskTone(score: number): { label: string; className: string } {
  if (score <= 35) {
    return { label: 'Operação resiliente', className: 'text-sky-700 bg-sky-50 border-sky-200' };
  }
  if (score <= 65) {
    return {
      label: 'Operação monitorada',
      className: 'text-amber-700 bg-amber-50 border-amber-200',
    };
  }
  return { label: 'Risco elevado', className: 'text-rose-700 bg-rose-50 border-rose-200' };
}

function modeDescription(mode: InsightMode): string {
  if (mode === 'aggressive') {
    return 'Detecta desvios mais cedo e prioriza ação imediata (mais alertas).';
  }
  if (mode === 'conservative') {
    return 'Reduz ruído operacional e destaca apenas desvios relevantes.';
  }
  return 'Equilibra sensibilidade e estabilidade para rotina diária.';
}

export default function ConfiguracoesPage() {
  const [draft, setDraft] = useState<OperationalPreferences>(() =>
    createDefaultOperationalPreferences(),
  );
  const [profileJson, setProfileJson] = useState('');
  const [feedback, setFeedback] = useState<Feedback>(null);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    const loaded = loadOperationalPreferences();
    setDraft(loaded);
    setProfileJson(JSON.stringify(loaded, null, 2));
    setIsHydrated(true);
  }, []);

  const score = useMemo(() => riskScore(draft), [draft]);
  const scoreTone = useMemo(() => riskTone(score), [score]);

  const recommendation = useMemo(() => {
    if (score <= 35) {
      return 'Perfil pronto para escala. Recomenda-se manter atualização automática e guardrails atuais.';
    }
    if (score <= 65) {
      return 'Operação estável com pontos de atenção. Ajuste limites de consumo e economia para reduzir variabilidade.';
    }
    return 'Risco alto. Reduza limiares de oscilação, aumente meta de compensação e habilite monitoramento agressivo.';
  }, [score]);

  function setNumericPreference(
    key:
      | 'autoRefreshIntervalSec'
      | 'uploadPreviewHoldSec'
      | 'compensationTargetPercent'
      | 'consumptionSpikePercent'
      | 'economyDropPercent',
    raw: string,
  ) {
    setDraft((previous) => ({
      ...previous,
      [key]: safeNumber(raw, previous[key]),
    }));
  }

  function savePreferences() {
    try {
      const normalized = operationalPreferencesSchema.parse({
        ...draft,
        defaultClientNumber: normalizeOptional(draft.defaultClientNumber ?? ''),
        defaultPeriodStart: normalizeOptional(draft.defaultPeriodStart ?? ''),
        defaultPeriodEnd: normalizeOptional(draft.defaultPeriodEnd ?? ''),
        autoRefreshIntervalSec: clamp(Math.round(draft.autoRefreshIntervalSec), 30, 600),
        uploadPreviewHoldSec: clamp(Math.round(draft.uploadPreviewHoldSec), 3, 30),
        compensationTargetPercent: clamp(draft.compensationTargetPercent, 20, 100),
        consumptionSpikePercent: clamp(draft.consumptionSpikePercent, 5, 80),
        economyDropPercent: clamp(draft.economyDropPercent, 5, 80),
        updatedAtIso: new Date().toISOString(),
      });

      const saved = saveOperationalPreferences(normalized);
      setDraft(saved);
      setProfileJson(JSON.stringify(saved, null, 2));
      setFeedback({
        variant: 'success',
        title: 'Configurações salvas',
        description:
          'As preferências foram persistidas e passam a orientar filtros padrão e atualização automática do dashboard.',
      });
    } catch (error) {
      setFeedback({
        variant: 'danger',
        title: 'Não foi possível salvar as configurações',
        description:
          error instanceof z.ZodError
            ? `Validação falhou: ${error.issues[0]?.message ?? 'dados inválidos'}`
            : 'Revise os campos e tente novamente.',
      });
    }
  }

  function resetDefaults() {
    const defaults = createDefaultOperationalPreferences();
    setDraft(defaults);
    setProfileJson(JSON.stringify(defaults, null, 2));
    setFeedback({
      variant: 'info',
      title: 'Perfil restaurado para padrão',
      description: 'Revise os valores e clique em salvar para aplicar no dashboard.',
    });
  }

  async function copyJson() {
    try {
      await navigator.clipboard.writeText(profileJson);
      setFeedback({
        variant: 'success',
        title: 'JSON copiado',
        description: 'Perfil operacional copiado para área de transferência.',
      });
    } catch {
      setFeedback({
        variant: 'danger',
        title: 'Falha ao copiar JSON',
        description:
          'Seu navegador bloqueou a cópia automática. Copie manualmente do campo abaixo.',
      });
    }
  }

  function importFromJson() {
    try {
      const parsed = JSON.parse(profileJson) as unknown;
      if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
        throw new Error('Objeto JSON inválido para perfil operacional.');
      }
      const candidate = operationalPreferencesSchema.parse({
        ...(parsed as Record<string, unknown>),
        updatedAtIso: new Date().toISOString(),
      });

      setDraft(candidate);
      setFeedback({
        variant: 'success',
        title: 'Perfil carregado no formulário',
        description: 'Clique em salvar para persistir esse perfil e aplicá-lo ao dashboard.',
      });
    } catch (error) {
      setFeedback({
        variant: 'danger',
        title: 'JSON inválido para importação',
        description:
          error instanceof z.ZodError
            ? `Estrutura inválida: ${error.issues[0]?.path.join('.') ?? 'campo desconhecido'}`
            : 'Confira a sintaxe do JSON e tente novamente.',
      });
    }
  }

  return (
    <section className="space-y-5" aria-label="Central de configurações operacionais">
      <Card className="border border-slate-200/80 bg-white/95 shadow-[0_8px_24px_-18px_rgba(15,23,42,0.45)]">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 font-[var(--font-heading)] text-[1.56rem] font-semibold tracking-tight text-[#062a53] md:text-[1.75rem]">
            <Settings className="h-5 w-5 text-sky-700" aria-hidden="true" />
            Configurações inteligentes de operação
          </CardTitle>
          <CardDescription className="text-sm text-slate-600">
            Centro de controle para automação, risco energético e padrões de leitura do dashboard.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid items-stretch gap-3 space-y-0 md:auto-rows-fr md:grid-cols-3">
          <GuideCard
            title="Perfil operacional"
            description="Define o cliente e janela padrão para abrir o dashboard já no contexto correto."
            icon={<BrainCircuit className="h-4 w-4 text-sky-700" aria-hidden="true" />}
          />
          <GuideCard
            title="Guardrails de risco"
            description="Controla limites de oscilação de consumo e queda de economia para detecção precoce."
            icon={<ShieldCheck className="h-4 w-4 text-sky-700" aria-hidden="true" />}
          />
          <GuideCard
            title="Automação contínua"
            description="Ajusta atualização automática e modo de insights para reduzir latência de decisão."
            icon={<RefreshCcw className="h-4 w-4 text-sky-700" aria-hidden="true" />}
          />
        </CardContent>
      </Card>

      {feedback ? (
        <InlineAlert
          variant={feedback.variant}
          title={feedback.title}
          description={feedback.description}
        />
      ) : null}

      <div className="grid gap-5 2xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-5">
          <Card className="border border-border/80 bg-white/90 shadow-soft">
            <CardHeader className="pb-3">
              <CardTitle>Perfil e escopo padrão</CardTitle>
              <CardDescription>
                Esses valores são aplicados automaticamente no dashboard quando a opção de
                autoaplicar está ativa.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid gap-3 md:grid-cols-2">
                <FieldLabel
                  label="Nome do perfil"
                  tooltip="Identifica o perfil para export/import entre ambientes."
                />
                <FieldLabel
                  label="Cliente padrão"
                  tooltip="Número do cliente aplicado como filtro inicial do dashboard."
                />
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <Input
                  value={draft.profileName}
                  onChange={(event) =>
                    setDraft((prev) => ({ ...prev, profileName: event.target.value }))
                  }
                  placeholder="Operação principal"
                />
                <Input
                  value={draft.defaultClientNumber ?? ''}
                  onChange={(event) =>
                    setDraft((prev) => ({
                      ...prev,
                      defaultClientNumber: normalizeOptional(event.target.value),
                    }))
                  }
                  inputMode="numeric"
                  placeholder="3001116735"
                />
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <FieldLabel
                  label="Período início"
                  tooltip="Início da janela padrão no formato YYYY-MM."
                />
                <FieldLabel
                  label="Período fim"
                  tooltip="Fim da janela padrão no formato YYYY-MM."
                />
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <Input
                  value={draft.defaultPeriodStart ?? ''}
                  onChange={(event) =>
                    setDraft((prev) => ({
                      ...prev,
                      defaultPeriodStart: normalizeOptional(event.target.value),
                    }))
                  }
                  placeholder="2024-01"
                />
                <Input
                  value={draft.defaultPeriodEnd ?? ''}
                  onChange={(event) =>
                    setDraft((prev) => ({
                      ...prev,
                      defaultPeriodEnd: normalizeOptional(event.target.value),
                    }))
                  }
                  placeholder="2024-12"
                />
              </div>
            </CardContent>
          </Card>

          <Card className="border border-border/80 bg-white/90 shadow-soft">
            <CardHeader className="pb-3">
              <CardTitle>Automação e inteligência</CardTitle>
              <CardDescription>
                Configure o ritmo de atualização e o comportamento do motor de insights
                operacionais.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid items-start gap-3 md:grid-cols-2 xl:grid-cols-3">
                <ToggleRow
                  label="Atualização automática"
                  description="Controla polling contínuo do dashboard."
                  enabled={draft.autoRefreshEnabled}
                  onToggle={(next) => setDraft((prev) => ({ ...prev, autoRefreshEnabled: next }))}
                />
                <ToggleRow
                  label="Autoaplicar filtros padrão"
                  description="Abre dashboard com cliente e janela do perfil."
                  enabled={draft.autoApplyDashboardFilters}
                  onToggle={(next) =>
                    setDraft((prev) => ({ ...prev, autoApplyDashboardFilters: next }))
                  }
                />
                <ToggleRow
                  label="Destacar anomalias"
                  description="Prioriza visualmente desvios críticos."
                  enabled={draft.highlightAnomalies}
                  onToggle={(next) => setDraft((prev) => ({ ...prev, highlightAnomalies: next }))}
                />
              </div>

              <div className="grid items-start gap-3 md:grid-cols-2">
                <Field
                  label="Intervalo de atualização (seg)"
                  tooltip="Intervalo entre recargas automáticas no dashboard (30 a 600)."
                >
                  <Input
                    type="number"
                    min={30}
                    max={600}
                    className="appearance-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                    value={String(draft.autoRefreshIntervalSec)}
                    onChange={(event) =>
                      setNumericPreference('autoRefreshIntervalSec', event.target.value)
                    }
                  />
                </Field>

                <Field
                  label="Preview antes do redirecionamento (seg)"
                  tooltip="Tempo para revisar a fatura processada no Upload antes de abrir a listagem."
                >
                  <Input
                    type="number"
                    min={3}
                    max={30}
                    className="appearance-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                    value={String(draft.uploadPreviewHoldSec)}
                    onChange={(event) =>
                      setNumericPreference('uploadPreviewHoldSec', event.target.value)
                    }
                  />
                </Field>
              </div>

              <div className="space-y-1">
                <label className="inline-flex items-center gap-1 text-[0.72rem] font-semibold uppercase tracking-wide text-slate-500">
                  Modo de insights
                  <TooltipInfo content="Define a sensibilidade da leitura de risco do painel." />
                </label>
                <select
                  value={draft.insightMode}
                  onChange={(event) =>
                    setDraft((prev) => ({
                      ...prev,
                      insightMode: event.target.value as InsightMode,
                    }))
                  }
                  className="flex h-10 w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                >
                  <option value="balanced">Balanceado</option>
                  <option value="aggressive">Agressivo (resposta rápida)</option>
                  <option value="conservative">Conservador (menos ruído)</option>
                </select>
                <p className="text-xs text-slate-500">{modeDescription(draft.insightMode)}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border border-border/80 bg-white/90 shadow-soft">
            <CardHeader className="pb-3">
              <CardTitle>Guardrails de risco energético</CardTitle>
              <CardDescription>
                Limiar para alertas operacionais e estabilidade financeira da base monitorada.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                <FieldLabel
                  label="Meta de compensação (%)"
                  tooltip="Percentual mínimo desejado de energia compensada sobre consumo."
                />
                <FieldLabel
                  label="Alerta de pico de consumo (%)"
                  tooltip="Dispara atenção quando consumo sobe acima desse limiar."
                />
                <FieldLabel
                  label="Alerta de queda de economia (%)"
                  tooltip="Dispara atenção quando economia GD cai além do limite definido."
                />
              </div>

              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                <Input
                  type="number"
                  min={20}
                  max={100}
                  className="appearance-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                  value={String(draft.compensationTargetPercent)}
                  onChange={(event) =>
                    setNumericPreference('compensationTargetPercent', event.target.value)
                  }
                />
                <Input
                  type="number"
                  min={5}
                  max={80}
                  className="appearance-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                  value={String(draft.consumptionSpikePercent)}
                  onChange={(event) =>
                    setNumericPreference('consumptionSpikePercent', event.target.value)
                  }
                />
                <Input
                  type="number"
                  min={5}
                  max={80}
                  className="appearance-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                  value={String(draft.economyDropPercent)}
                  onChange={(event) =>
                    setNumericPreference('economyDropPercent', event.target.value)
                  }
                />
              </div>
            </CardContent>
          </Card>

          <Card className="border border-border/80 bg-white/90 shadow-soft">
            <CardHeader className="pb-3">
              <CardTitle>Portabilidade de perfil</CardTitle>
              <CardDescription>
                Exporte e importe a configuração para replicar estratégia entre ambientes e membros
                do time.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <textarea
                value={profileJson}
                onChange={(event) => setProfileJson(event.target.value)}
                className="min-h-[180px] w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                aria-label="JSON de perfil operacional"
              />
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  className="gap-2"
                  onClick={() => void copyJson()}
                >
                  <Download className="h-4 w-4" aria-hidden="true" />
                  Copiar JSON
                </Button>
                <Button type="button" variant="ghost" className="gap-2" onClick={importFromJson}>
                  <UploadCloud className="h-4 w-4" aria-hidden="true" />
                  Carregar no formulário
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-5">
          <Card className="border border-border/80 bg-white/90 shadow-soft">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2">
                <Gauge className="h-5 w-5 text-sky-700" aria-hidden="true" />
                Radar operacional
              </CardTitle>
              <CardDescription>
                Score sintético para avaliar a robustez do perfil configurado.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Score de risco
                  </p>
                  <span className="text-2xl font-semibold text-slate-900">{score}</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-slate-200">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-sky-500 to-blue-700"
                    style={{ width: `${score}%` }}
                    aria-hidden="true"
                  />
                </div>
                <p
                  className={cn(
                    'mt-2 inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold',
                    scoreTone.className,
                  )}
                >
                  {scoreTone.label}
                </p>
              </div>

              <MetricBar
                label="Meta de compensação"
                value={formatPercent(draft.compensationTargetPercent)}
                progress={draft.compensationTargetPercent}
              />
              <MetricBar
                label="Limiar de pico de consumo"
                value={formatPercent(draft.consumptionSpikePercent)}
                progress={draft.consumptionSpikePercent}
              />
              <MetricBar
                label="Limiar de queda de economia"
                value={formatPercent(draft.economyDropPercent)}
                progress={draft.economyDropPercent}
              />

              <div className="rounded-xl border border-sky-100 bg-sky-50/60 p-3 text-sm text-slate-700">
                <p className="mb-1 inline-flex items-center gap-2 font-semibold text-[#0a2340]">
                  <Sparkles className="h-4 w-4 text-sky-700" aria-hidden="true" />
                  Recomendação automática
                </p>
                <p>{recommendation}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border border-border/80 bg-white/90 shadow-soft">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Aplicar alterações</CardTitle>
              <CardDescription>
                Salve para sincronizar imediatamente com o comportamento do dashboard.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button type="button" className="w-full gap-2" onClick={savePreferences}>
                <Save className="h-4 w-4" aria-hidden="true" />
                Salvar configurações
              </Button>
              <Button type="button" variant="secondary" className="w-full" onClick={resetDefaults}>
                Restaurar perfil padrão
              </Button>
              <p className="text-xs text-slate-500">
                Última atualização local:{' '}
                <span suppressHydrationWarning>
                  {isHydrated ? new Date(draft.updatedAtIso).toLocaleString('pt-BR') : '-'}
                </span>
              </p>
            </CardContent>
          </Card>

          <Card className="border border-border/80 bg-white/90 shadow-soft">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <BellRing className="h-4 w-4 text-sky-700" aria-hidden="true" />
                Próximos passos sugeridos
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-slate-600">
              <p>1. Salve este perfil e valide o dashboard com os filtros padrão aplicados.</p>
              <p>2. Ajuste os guardrails após observar 2-3 ciclos de faturas reais.</p>
              <p>3. Exporte o JSON para padronizar operação entre ambientes.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}

function Field({
  label,
  tooltip,
  children,
}: {
  label: string;
  tooltip?: string;
  children: ReactNode;
}) {
  return (
    <div className="flex min-h-[4.25rem] flex-col justify-start gap-1">
      <label className="m-0 inline-flex h-6 items-center p-0 text-[0.72rem] font-semibold uppercase tracking-wide leading-none text-slate-500">
        <span>{label}</span>
        <span className="ml-1 inline-flex h-4 w-4 items-center justify-center">
          {tooltip ? <TooltipInfo content={tooltip} className="h-4 w-4" /> : null}
        </span>
      </label>
      <div className="h-10">{children}</div>
    </div>
  );
}

function FieldLabel({ label, tooltip }: { label: string; tooltip?: string }) {
  return (
    <label className="m-0 inline-flex h-6 items-center p-0 text-[0.72rem] font-semibold uppercase tracking-wide leading-none text-slate-500">
      <span>{label}</span>
      <span className="ml-1 inline-flex h-4 w-4 items-center justify-center">
        {tooltip ? <TooltipInfo content={tooltip} className="h-4 w-4" /> : null}
      </span>
    </label>
  );
}

function GuideCard({
  title,
  description,
  icon,
}: {
  title: string;
  description: string;
  icon: ReactNode;
}) {
  return (
    <div className="grid h-full min-h-[132px] grid-rows-[auto_1fr] rounded-xl border border-sky-100 bg-sky-50/40 p-4">
      <div className="inline-flex items-center gap-2 text-sm font-semibold text-[#0a2340]">
        {icon}
        {title}
      </div>
      <p className="mt-2 text-sm leading-relaxed text-slate-600">{description}</p>
    </div>
  );
}

function ToggleRow({
  label,
  description,
  enabled,
  onToggle,
}: {
  label: string;
  description: string;
  enabled: boolean;
  onToggle: (value: boolean) => void;
}) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50/70 p-3">
      <div className="mb-1 flex items-center justify-between gap-2">
        <p className="text-sm font-semibold text-slate-800">{label}</p>
        <button
          type="button"
          className={cn(
            'inline-flex min-w-[52px] justify-center rounded-full border px-2 py-1 text-xs font-semibold transition',
            enabled
              ? 'border-sky-300 bg-sky-100 text-sky-700'
              : 'border-slate-300 bg-white text-slate-500',
          )}
          onClick={() => onToggle(!enabled)}
        >
          {enabled ? 'ON' : 'OFF'}
        </button>
      </div>
      <p className="text-xs text-slate-500">{description}</p>
    </div>
  );
}

function MetricBar({ label, value, progress }: { label: string; value: string; progress: number }) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs text-slate-600">
        <span>{label}</span>
        <span className="font-semibold text-slate-800">{value}</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-slate-200">
        <div
          className="h-full rounded-full bg-gradient-to-r from-sky-500 to-blue-700"
          style={{ width: `${Math.min(progress, 100)}%` }}
          aria-hidden="true"
        />
      </div>
    </div>
  );
}
