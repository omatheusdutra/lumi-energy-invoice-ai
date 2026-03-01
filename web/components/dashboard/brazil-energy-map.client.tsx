'use client';

import { memo, useState } from 'react';
import type { ReactNode } from 'react';
import { ChevronDown, Filter } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { formatKwh } from '@/lib/format';
import type { PlantLocation } from '@/lib/dashboard/models';

interface BrazilEnergyMapProps {
  plants: PlantLocation[];
}

function BrazilEnergyMapComponent({ plants }: BrazilEnergyMapProps) {
  const [activePlant, setActivePlant] = useState<PlantLocation | null>(null);

  return (
    <Card className="h-fit border border-border/80 bg-white/90 shadow-soft">
      <CardHeader className="mb-2 flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <CardTitle>Mapa de usinas no Brasil</CardTitle>
          <CardDescription>
            Distribuição de plantas monitoradas por produção estimada.
          </CardDescription>
        </div>
        <div className="flex items-center gap-2">
          <HeaderChip icon={<Filter className="h-3.5 w-3.5" />} label="Usinas" />
          <HeaderChip icon={<span className="h-2 w-2 rounded-full bg-sky-600" />} label="Todas">
            <ChevronDown className="h-3.5 w-3.5" />
          </HeaderChip>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="relative overflow-hidden rounded-xl border border-slate-200 bg-gradient-to-b from-sky-50 to-white p-2">
          <svg viewBox="0 0 380 420" className="h-[320px] w-full">
            <path
              d="M112 22L154 42L208 40L252 76L300 104L314 146L300 182L316 228L284 256L286 312L246 338L228 380L188 396L146 372L128 336L88 322L70 278L40 238L52 194L40 158L70 120L70 74L94 56Z"
              fill="#dbeafe"
              stroke="#1d4ed8"
              strokeWidth="4"
              strokeLinejoin="round"
            />

            {plants.map((plant) => {
              const active = activePlant?.id === plant.id;
              return (
                <g key={plant.id}>
                  <circle
                    cx={plant.x}
                    cy={plant.y}
                    r={active ? 8 : 6}
                    fill={active ? '#0284c7' : '#38bdf8'}
                    stroke="#ffffff"
                    strokeWidth="2"
                    tabIndex={0}
                    role="button"
                    aria-label={`${plant.name} em ${plant.city} ${plant.state}`}
                    onMouseEnter={() => setActivePlant(plant)}
                    onMouseLeave={() =>
                      setActivePlant((current) => (current?.id === plant.id ? null : current))
                    }
                    onFocus={() => setActivePlant(plant)}
                    onBlur={() =>
                      setActivePlant((current) => (current?.id === plant.id ? null : current))
                    }
                  />
                  <circle
                    cx={plant.x}
                    cy={plant.y}
                    r={active ? 16 : 12}
                    fill="none"
                    stroke="#60a5fa"
                    strokeOpacity="0.4"
                  />
                </g>
              );
            })}
          </svg>

          {activePlant ? (
            <div className="absolute right-3 top-3 max-w-[220px] rounded-lg border border-slate-200 bg-white/95 p-3 text-xs shadow-md">
              <p className="font-semibold text-slate-900">{activePlant.name}</p>
              <p className="text-slate-600">
                {activePlant.city} - {activePlant.state}
              </p>
              <p className="mt-1 font-semibold text-sky-700">
                Produção estimada: {formatKwh(activePlant.productionKwh)}
              </p>
            </div>
          ) : null}
        </div>

        <ul className="grid gap-3 text-sm text-slate-600 sm:grid-cols-2 [&>li:last-child:nth-child(odd)]:sm:col-span-2">
          {plants.map((plant) => (
            <li
              key={plant.id}
              className="flex min-h-[108px] flex-col justify-between rounded-lg border border-border bg-white/70 p-3 transition hover:border-sky-300"
            >
              <p className="text-base font-semibold leading-snug text-slate-800">{plant.name}</p>
              <p>
                {plant.city} - {plant.state}
              </p>
              <p className="text-base font-semibold text-sky-700">
                {formatKwh(plant.productionKwh)}
              </p>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

export const BrazilEnergyMap = memo(BrazilEnergyMapComponent);

function HeaderChip({
  icon,
  label,
  children,
}: {
  icon: ReactNode;
  label: string;
  children?: ReactNode;
}) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-600">
      {icon}
      {label}
      {children}
    </span>
  );
}
