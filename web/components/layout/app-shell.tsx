'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import type { Route } from 'next';
import { usePathname } from 'next/navigation';
import {
  BarChart3,
  ChevronLeft,
  ChevronRight,
  Building2,
  CreditCard,
  FileSpreadsheet,
  Menu,
  Settings,
  Zap,
  Wallet,
  X,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { Tooltip } from '@/components/ui/tooltip';

interface NavItem {
  href: Route;
  label: string;
  icon: LucideIcon;
  aliases?: string[];
}

const navItems: NavItem[] = [
  { href: '/dashboard', label: 'Dashboard', icon: BarChart3 },
  { href: '/creditos', label: 'Créditos', icon: Wallet },
  {
    href: '/faturas',
    label: 'Faturas',
    icon: FileSpreadsheet,
    aliases: ['/invoices'],
  },
  { href: '/unidades', label: 'Unidades', icon: Building2, aliases: ['/minhas-unidades'] },
  { href: '/configuracoes', label: 'Configurações', icon: Settings },
  { href: '/pagamentos', label: 'Pagamentos', icon: CreditCard },
];

function isActive(pathname: string, item: NavItem): boolean {
  if (pathname === item.href || pathname.startsWith(`${item.href}/`)) {
    return true;
  }

  if (item.aliases?.some((alias) => pathname === alias || pathname.startsWith(`${alias}/`))) {
    return true;
  }

  return false;
}

function BrandLogo({ collapsed }: { collapsed: boolean }) {
  return (
    <div className={cn('flex items-center gap-3', collapsed ? 'lg:justify-center' : '')}>
      <div
        className={cn(
          'relative overflow-hidden rounded-2xl border border-sky-700/60 bg-gradient-to-br from-[#0b2b4a] to-[#05162b] shadow-[0_10px_24px_-14px_rgba(14,165,233,0.55)]',
          collapsed ? 'h-10 w-10' : 'h-14 w-14',
        )}
        aria-hidden="true"
      >
        <svg viewBox="0 0 64 64" className="h-full w-full">
          <defs>
            <linearGradient id="sidebarBolt" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#8ef5ff" />
              <stop offset="100%" stopColor="#1fb6ff" />
            </linearGradient>
          </defs>
          <path
            d="M35 10L20 36h12l-3 18 15-26H32l3-18z"
            fill="url(#sidebarBolt)"
            stroke="#d8ffee"
            strokeWidth="1.2"
            strokeLinejoin="round"
          />
          <circle cx="49" cy="15" r="4.5" fill="#ff9a2f" />
        </svg>
      </div>

      <div className={cn('space-y-1', collapsed ? 'lg:hidden' : '')}>
        <p className="text-sm font-semibold uppercase tracking-[0.32em] text-sky-300">Energy</p>
        <p className="text-[0.78rem] font-medium uppercase tracking-[0.25em] text-sky-100/90">
          Analytics Hub
        </p>
      </div>
    </div>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [desktopCollapsed, setDesktopCollapsed] = useState(false);

  useEffect(() => {
    function onEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setMobileOpen(false);
      }
    }

    window.addEventListener('keydown', onEscape);
    return () => window.removeEventListener('keydown', onEscape);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    const stored = window.localStorage.getItem('lumi.sidebar.collapsed');
    if (stored === '1') {
      setDesktopCollapsed(true);
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem('lumi.sidebar.collapsed', desktopCollapsed ? '1' : '0');
  }, [desktopCollapsed]);

  return (
    <div className="min-h-screen bg-[#f4f6f8] text-slate-900">
      <a
        href="#main-content"
        className="sr-only z-50 rounded-md bg-sky-700 px-4 py-2 text-sm font-semibold text-white focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
      >
        Pular para o conteúdo principal
      </a>

      {mobileOpen ? (
        <button
          aria-label="Fechar menu lateral"
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      ) : null}

      {!mobileOpen ? (
        <button
          type="button"
          aria-label="Abrir menu"
          aria-expanded={mobileOpen}
          aria-controls="sidebar"
          className="fixed left-4 top-4 z-40 inline-flex h-10 w-10 items-center justify-center rounded-md border border-slate-300 bg-white text-slate-700 shadow-sm lg:hidden"
          onClick={() => setMobileOpen(true)}
        >
          <Menu className="h-5 w-5" aria-hidden="true" />
        </button>
      ) : null}

      <aside
        id="sidebar"
        aria-label="Navegação principal"
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-56 overflow-hidden rounded-r-[26px] border-r border-sky-900/70 bg-gradient-to-b from-[#041a33] to-[#020f22] text-sky-50 shadow-[0_20px_60px_rgba(3,20,37,0.45)] transition-[width,transform] duration-300 lg:translate-x-0',
          desktopCollapsed ? 'lg:w-20' : 'lg:w-56',
          mobileOpen ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <div className="flex h-full flex-col">
          <div className="relative border-b border-sky-900/70 px-5 pb-5 pt-7">
            <button
              type="button"
              aria-label="Fechar menu"
              className="absolute right-4 top-4 inline-flex h-9 w-9 items-center justify-center rounded-md border border-sky-800 bg-sky-900/70 text-sky-100 lg:hidden"
              onClick={() => setMobileOpen(false)}
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
            <Tooltip content="Energy Analytics Hub" side="right">
              <div>
                <BrandLogo collapsed={desktopCollapsed} />
              </div>
            </Tooltip>
          </div>

          <nav className="flex-1 space-y-1.5 p-3">
            {navItems.map((item) => {
              const active = isActive(pathname, item);
              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? 'page' : undefined}
                  aria-label={item.label}
                  title={item.label}
                  className={cn(
                    'group flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-[1.05rem] font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300',
                    desktopCollapsed ? 'lg:justify-center lg:px-2' : '',
                    active
                      ? 'bg-sky-700 text-white shadow-lg shadow-sky-950/40 ring-2 ring-sky-200/70'
                      : 'text-sky-100 hover:bg-sky-900/80',
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                  <span className={cn('truncate', desktopCollapsed ? 'lg:hidden' : '')}>
                    {item.label}
                  </span>
                </Link>
              );
            })}
          </nav>

          <div className="border-t border-sky-900/70 p-3">
            <button
              type="button"
              aria-label={desktopCollapsed ? 'Expandir menu lateral' : 'Recolher menu lateral'}
              title={desktopCollapsed ? 'Expandir menu' : 'Recolher menu'}
              className="mb-3 hidden h-11 w-11 items-center justify-center rounded-full border border-sky-700 bg-sky-800/70 text-sky-100 transition hover:bg-sky-700 lg:inline-flex"
              onClick={() => setDesktopCollapsed((value) => !value)}
            >
              {desktopCollapsed ? (
                <ChevronRight className="h-5 w-5" aria-hidden="true" />
              ) : (
                <ChevronLeft className="h-5 w-5" aria-hidden="true" />
              )}
            </button>

            <Tooltip
              content="Abrir fluxo de upload de nova fatura em PDF"
              side="right"
              className="w-full"
            >
              <Link
                href="/upload"
                className={cn(
                  'inline-flex w-full items-center justify-center gap-2 rounded-xl bg-sky-600 px-3 py-2.5 text-base font-semibold text-white transition hover:bg-sky-500',
                  desktopCollapsed ? 'lg:px-2' : '',
                )}
                aria-label="Enviar nova fatura"
                title="Enviar nova fatura"
              >
                <Zap className="h-4 w-4" aria-hidden="true" />
                <span className={cn(desktopCollapsed ? 'lg:hidden' : '')}>Enviar nova fatura</span>
              </Link>
            </Tooltip>
          </div>
        </div>
      </aside>

      <div
        className={cn(
          'transition-[padding] duration-300',
          desktopCollapsed ? 'lg:pl-20' : 'lg:pl-56',
        )}
      >
        <main id="main-content" className="mx-auto max-w-[1600px] px-4 py-6 sm:px-6 lg:px-8">
          {children}
        </main>
      </div>
    </div>
  );
}
