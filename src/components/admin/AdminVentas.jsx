import { useState } from 'react';
import { TrendingUp, TrendingDown, Minus, RefreshCw } from 'lucide-react';
import { useVentas } from '../../hooks/useVentas';

const G      = '#2d6a2d';
const G_DARK = '#1a4a1a';

function fmt(n) {
    return '$' + Number(n).toLocaleString('es-AR', { maximumFractionDigits: 0 });
}

/* ── KPI card ── */
function KpiCard({ label, value, highlight }) {
    return (
        <div
            className={highlight ? 'rounded-2xl p-4 flex flex-col gap-1' : 'admin-card p-4 flex flex-col gap-1'}
            style={highlight ? { background: G_DARK, boxShadow: '0 4px 20px rgba(26,74,26,0.25)' } : undefined}
        >
            <p className="admin-label" style={highlight ? { color: 'rgba(255,255,255,0.55)' } : undefined}>
                {label}
            </p>
            <p className="font-display leading-none" style={{ fontSize: 'clamp(1.4rem, 4vw, 2rem)', color: highlight ? '#fff' : '#111' }}>
                {value}
            </p>
        </div>
    );
}

/* ── Vs period badge ── */
function VsBadge({ pct }) {
    if (pct === null) return (
        <div className="admin-card p-4 flex flex-col gap-1">
            <p className="admin-label">vs período ant.</p>
            <div className="flex items-center gap-1.5">
                <Minus className="w-5 h-5" style={{ color: 'rgba(0,0,0,0.25)' }} />
                <p className="font-display text-2xl leading-none" style={{ color: 'rgba(0,0,0,0.25)' }}>—</p>
            </div>
            <p className="admin-sub">sin datos anteriores</p>
        </div>
    );

    const positive = pct >= 0;
    const Icon = positive ? TrendingUp : TrendingDown;
    return (
        <div
            className="rounded-2xl p-4 flex flex-col gap-1"
            style={{
                background: positive ? 'rgba(45,106,45,0.07)' : 'rgba(239,68,68,0.06)',
                border: positive ? '1px solid rgba(45,106,45,0.20)' : '1px solid rgba(239,68,68,0.18)',
                boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
            }}
        >
            <p className="admin-label">vs período ant.</p>
            <div className="flex items-center gap-1.5">
                <Icon className="w-5 h-5" style={{ color: positive ? G : '#dc2626' }} />
                <p className="font-display text-2xl leading-none" style={{ color: positive ? G : '#dc2626' }}>
                    {positive ? '+' : ''}{pct.toFixed(1)}%
                </p>
            </div>
            <p className="admin-sub">{positive ? 'por encima' : 'por debajo'}</p>
        </div>
    );
}

/* ── Horizontal bar chart ── */
function BarChart({ items }) {
    if (!items?.length) return (
        <p className="text-center py-8 admin-sub">Sin ventas en este período.</p>
    );
    const max = Math.max(...items.map(d => d.revenue), 1);
    return (
        <div className="flex flex-col gap-2.5">
            {items.map((item, i) => (
                <div key={i} className="flex items-center gap-3">
                    <span className="font-body text-xs shrink-0 text-right" style={{ color: 'rgba(0,0,0,0.50)', minWidth: '44px' }}>
                        {item.label}
                    </span>
                    <div className="flex-1 flex items-center gap-2 min-w-0">
                        <div className="flex-1 h-5 rounded-full overflow-hidden" style={{ background: 'rgba(0,0,0,0.08)' }}>
                            <div
                                className="h-full rounded-full"
                                style={{
                                    width: `${(item.revenue / max) * 100}%`,
                                    background: G,
                                    minWidth: item.revenue > 0 ? '6px' : '0',
                                    transition: 'width 0.6s cubic-bezier(0.16,1,0.3,1)',
                                }}
                            />
                        </div>
                        <span className="font-body text-xs font-semibold shrink-0" style={{ color: item.revenue > 0 ? '#111' : 'rgba(0,0,0,0.30)', minWidth: '68px', textAlign: 'right' }}>
                            {item.revenue > 0 ? fmt(item.revenue) : '—'}
                        </span>
                    </div>
                    {item.count > 0 && (
                        <span className="font-body text-[10px] shrink-0" style={{ color: 'rgba(0,0,0,0.38)', minWidth: '24px' }}>
                            ×{item.count}
                        </span>
                    )}
                </div>
            ))}
        </div>
    );
}

/* ── Split row ── */
function SplitRow({ label, count, total, color }) {
    const pct = total > 0 ? Math.round((count / total) * 100) : 0;
    return (
        <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between">
                <span className="font-body text-sm font-medium" style={{ color: '#111' }}>{label}</span>
                <span className="font-body text-sm font-bold" style={{ color }}>{pct}%</span>
            </div>
            <div className="h-2 rounded-full overflow-hidden" style={{ background: 'rgba(0,0,0,0.10)' }}>
                <div className="h-full rounded-full" style={{ width: `${pct}%`, background: color, transition: 'width 0.6s cubic-bezier(0.16,1,0.3,1)' }} />
            </div>
            <span className="admin-sub">{count} pedido{count !== 1 ? 's' : ''}</span>
        </div>
    );
}

/* ════════════════════════════════════════════
   ADMIN VENTAS
════════════════════════════════════════════ */
const PERIODS     = [{ id: 'today', label: 'Hoy' }, { id: 'week', label: 'Semana' }, { id: 'month', label: 'Mes' }, { id: 'date', label: 'Fecha' }];
const CHART_LABEL = { today: 'Ventas por hora', week: 'Ventas por día', month: 'Ventas por día del mes', date: 'Ventas por hora' };

function todayStr() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export default function AdminVentas() {
    const [tab, setTab]         = useState('today');   // 'today' | 'week' | 'month' | 'date'
    const [customDate, setCustomDate] = useState(todayStr);

    const period = tab === 'date' ? customDate : tab;
    const { data, loading, refetch } = useVentas(period);

    return (
        <div className="max-w-3xl mx-auto animate-fade-up pb-10">

            {/* Header */}
            <div className="flex items-center justify-between mb-6 gap-3">
                <div>
                    <h1 className="font-display uppercase leading-none" style={{ fontSize: 'clamp(1.8rem, 5vw, 2.4rem)', color: '#111' }}>
                        Ventas
                    </h1>
                    <p className="admin-sub mt-0.5">Solo pedidos confirmados e impresos</p>
                </div>
                <button
                    onClick={refetch}
                    className="cursor-pointer p-2.5 rounded-xl transition-all active:scale-90 admin-card"
                    title="Actualizar"
                >
                    <RefreshCw className="w-4 h-4" style={{ color: 'rgba(0,0,0,0.50)' }} />
                </button>
            </div>

            {/* Period selector */}
            <div className="flex gap-1 p-1 rounded-xl mb-3" style={{ background: 'rgba(0,0,0,0.08)' }}>
                {PERIODS.map(p => (
                    <button
                        key={p.id}
                        onClick={() => setTab(p.id)}
                        className="cursor-pointer flex-1 py-2 rounded-lg font-body text-sm font-semibold transition-all"
                        style={tab === p.id
                            ? { background: '#fff', color: '#111', boxShadow: '0 1px 4px rgba(0,0,0,0.12)' }
                            : { color: 'rgba(0,0,0,0.50)' }
                        }
                    >
                        {p.label}
                    </button>
                ))}
            </div>

            {/* Date picker — solo visible en tab "Fecha" */}
            {tab === 'date' && (
                <div className="flex items-center gap-3 mb-4">
                    <input
                        type="date"
                        value={customDate}
                        max={todayStr()}
                        onChange={e => setCustomDate(e.target.value)}
                        className="bg-white border border-[rgba(0,0,0,0.12)] rounded-xl px-3 py-2.5 text-[#111] text-sm focus:outline-none focus:border-[#2d6a2d] transition-all"
                    />
                    <p className="font-body text-xs" style={{ color: 'rgba(0,0,0,0.45)' }}>
                        Ventas del día seleccionado
                    </p>
                </div>
            )}

            {tab !== 'date' && <div className="mb-4" />}

            {loading ? (
                <div className="flex flex-col gap-4">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {[...Array(4)].map((_, i) => <div key={i} className="h-24 rounded-2xl animate-pulse" style={{ background: 'rgba(255,255,255,0.6)' }} />)}
                    </div>
                    <div className="h-48 rounded-2xl animate-pulse" style={{ background: 'rgba(255,255,255,0.6)' }} />
                </div>
            ) : (
                <>
                    {/* KPIs */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
                        <KpiCard label="Facturado (productos)" value={fmt(data?.totalRevenue ?? 0)} highlight />
                        <KpiCard label="Total envíos" value={fmt(data?.totalDelivery ?? 0)} />
                        <KpiCard label="Pedidos" value={data?.orderCount ?? 0} />
                    </div>
                    <div className="mb-4">
                        <VsBadge pct={data?.pct ?? null} />
                    </div>

                    {/* Bar chart */}
                    <div className="admin-card p-5 mb-4">
                        <p className="admin-label mb-4">{CHART_LABEL[tab] ?? 'Ventas por hora'}</p>
                        <div style={{ overflowY: period === 'month' ? 'auto' : undefined, maxHeight: period === 'month' ? '320px' : undefined }}>
                            <BarChart items={data?.byTime ?? []} />
                        </div>
                    </div>

                    {/* Ganancia estimada */}
                    <div className="admin-card p-5 mb-4">
                        <p className="admin-label mb-3">Resultado del período</p>
                        <div className="flex flex-col gap-2">
                            <div className="flex items-center justify-between">
                                <span className="font-body text-sm" style={{ color: 'rgba(0,0,0,0.55)' }}>Productos y extras</span>
                                <span className="font-body text-sm font-semibold" style={{ color: '#111' }}>{fmt(data?.totalRevenue ?? 0)}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="font-body text-sm" style={{ color: 'rgba(0,0,0,0.55)' }}>Gastos registrados</span>
                                <span className="font-body text-sm font-semibold" style={{ color: '#dc2626' }}>− {fmt(data?.totalExpenses ?? 0)}</span>
                            </div>
                            <div className="h-px my-1" style={{ background: 'rgba(0,0,0,0.10)' }} />
                            <div className="flex items-center justify-between">
                                <span className="font-body text-sm font-bold" style={{ color: '#111' }}>Ganancia estimada</span>
                                <span className="font-display text-2xl leading-none" style={{ color: (data?.netProfit ?? 0) >= 0 ? G : '#dc2626' }}>
                                    {fmt(data?.netProfit ?? 0)}
                                </span>
                            </div>
                        </div>
                        {(data?.totalExpenses ?? 0) === 0 && (
                            <p className="admin-sub mt-3">Sin gastos registrados para este período. Agregalos en la sección Gastos.</p>
                        )}
                    </div>

                    {/* Bottom row */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

                        {/* Top productos */}
                        <div className="admin-card p-5">
                            <p className="admin-label mb-4">Productos más vendidos</p>
                            {!data?.topProducts?.length ? (
                                <p className="admin-sub text-center py-4">Sin datos</p>
                            ) : (
                                <div className="flex flex-col gap-3">
                                    {data.topProducts.map((p, i) => (
                                        <div key={i} className="flex items-center gap-3">
                                            <span className="font-display text-lg leading-none shrink-0 w-6 text-center"
                                                style={{ color: i === 0 ? '#F59E0B' : i === 1 ? 'rgba(0,0,0,0.40)' : 'rgba(0,0,0,0.25)' }}>
                                                {i + 1}
                                            </span>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-body text-sm font-semibold truncate" style={{ color: '#111' }}>{p.name}</p>
                                                <p className="admin-sub">{fmt(p.revenue)}</p>
                                            </div>
                                            <span className="font-body text-xs font-bold px-2 py-0.5 rounded-full shrink-0"
                                                style={{ background: 'rgba(45,106,45,0.10)', color: G }}>
                                                ×{p.qty}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Split */}
                        <div className="admin-card p-5 flex flex-col gap-5">
                            <div>
                                <p className="admin-label mb-3">Modalidad</p>
                                <div className="flex flex-col gap-3">
                                    <SplitRow label="Retiro local" count={(data?.orderCount ?? 0) - (data?.deliveryCount ?? 0)} total={data?.orderCount ?? 0} color={G} />
                                    <SplitRow label="Delivery" count={data?.deliveryCount ?? 0} total={data?.orderCount ?? 0} color="#2563eb" />
                                </div>
                            </div>
                            <div className="h-px" style={{ background: 'rgba(0,0,0,0.09)' }} />
                            <div>
                                <p className="admin-label mb-3">Forma de pago</p>
                                <div className="flex flex-col gap-3">
                                    <SplitRow label="Efectivo" count={data?.efectivoCount ?? 0} total={data?.orderCount ?? 0} color={G} />
                                    <SplitRow label="Transferencia" count={(data?.orderCount ?? 0) - (data?.efectivoCount ?? 0)} total={data?.orderCount ?? 0} color="#7c3aed" />
                                </div>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
