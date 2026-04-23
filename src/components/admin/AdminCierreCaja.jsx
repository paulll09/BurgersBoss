import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
    Wallet, Banknote, CreditCard, TrendingDown,
    ShoppingBag, CheckCircle2, ChevronDown, ChevronUp, ClipboardList,
} from 'lucide-react';
import { useCierreCaja, todayStr } from '../../hooks/useCierreCaja';
import { useConfirm } from '../ui/ConfirmDialog';
import toast from 'react-hot-toast';

const G      = '#2d6a2d';
const G_DARK = '#1a4a1a';

function fmt(n) {
    return '$' + Number(n).toLocaleString('es-AR');
}

function fmtDate(dateStr) {
    const d = new Date(dateStr + 'T12:00:00');
    return d.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' });
}

function fmtTime(iso) {
    return new Date(iso).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
}

/* ── Tarjeta de métrica ──────────────────────── */
function MetricCard({ label, icon: Icon, value, valueText, accent, highlight }) {
    const bg      = highlight ? G_DARK : 'rgba(0,0,0,0.03)';
    const border  = highlight ? 'none' : '1px solid rgba(0,0,0,0.08)';
    const lblClr  = highlight ? 'rgba(255,255,255,0.60)' : '#666';
    const valClr  = highlight ? '#fff' : (accent ?? '#111');
    const iconClr = highlight ? 'rgba(255,255,255,0.55)' : (accent ?? '#555');

    return (
        <div
            className="rounded-2xl px-4 py-4 flex flex-col gap-2"
            style={{ background: bg, border, boxShadow: highlight ? '0 6px 24px rgba(26,74,26,0.28)' : '0 1px 4px rgba(0,0,0,0.04)' }}
        >
            <div className="flex items-center gap-2">
                <Icon className="w-3.5 h-3.5 shrink-0" style={{ color: iconClr }} />
                <span className="font-body text-[10px] font-bold uppercase tracking-[0.18em]" style={{ color: lblClr }}>
                    {label}
                </span>
            </div>
            <span
                className="font-display leading-none"
                style={{ fontSize: 'clamp(1.4rem, 5vw, 2rem)', color: valClr }}
            >
                {valueText ?? fmt(value)}
            </span>
        </div>
    );
}

/* ── Fila de historial ───────────────────────── */
function HistoryRow({ cierre }) {
    const [open, setOpen] = useState(false);
    const isToday = cierre.fecha === todayStr();

    return (
        <div className="rounded-xl overflow-hidden" style={{ background: '#fff', border: '1px solid rgba(0,0,0,0.08)' }}>
            <button
                onClick={() => setOpen(p => !p)}
                className="cursor-pointer w-full flex items-center gap-3 px-4 py-3 text-left"
            >
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-body text-sm font-semibold capitalize" style={{ color: '#111' }}>
                            {fmtDate(cierre.fecha)}
                        </span>
                        {isToday && (
                            <span
                                className="font-body text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full"
                                style={{ background: 'rgba(45,106,45,0.10)', color: G }}
                            >
                                Hoy
                            </span>
                        )}
                    </div>
                    <p className="font-body text-xs mt-0.5" style={{ color: '#555' }}>
                        {cierre.pedidos_count} pedidos · cerrada a las {fmtTime(cierre.closed_at)}
                    </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                    <div className="text-right">
                        <p className="font-display text-xl leading-none" style={{ color: '#111' }}>{fmt(cierre.saldo_efectivo)}</p>
                        <p className="font-body text-[10px]" style={{ color: '#666' }}>saldo caja</p>
                    </div>
                    {open
                        ? <ChevronUp  className="w-4 h-4" style={{ color: '#666' }} />
                        : <ChevronDown className="w-4 h-4" style={{ color: '#666' }} />
                    }
                </div>
            </button>

            <AnimatePresence initial={false}>
                {open && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        style={{ overflow: 'hidden' }}
                    >
                        <div className="px-4 pb-4">
                            <div className="h-px mb-3" style={{ background: 'rgba(0,0,0,0.07)' }} />
                            <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                                {[
                                    { label: 'Efectivo',      value: cierre.ventas_efectivo },
                                    { label: 'Transferencia', value: cierre.ventas_transferencia },
                                    { label: 'Total ventas',  value: cierre.total_ventas },
                                    { label: 'Gastos',        value: cierre.total_gastos },
                                ].map(({ label, value }) => (
                                    <div key={label}>
                                        <p className="font-body text-[10px] font-bold uppercase tracking-wider" style={{ color: '#888' }}>{label}</p>
                                        <p className="font-body text-sm font-semibold" style={{ color: '#111' }}>{fmt(value)}</p>
                                    </div>
                                ))}
                            </div>
                            {cierre.notas && (
                                <p
                                    className="font-body text-xs mt-3 px-3 py-2 rounded-xl"
                                    style={{ background: 'rgba(0,0,0,0.04)', color: '#444', border: '1px solid rgba(0,0,0,0.07)' }}
                                >
                                    📝 {cierre.notas}
                                </p>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

/* ── Grid de métricas reutilizable ───────────── */
function SummaryGrid({ data, pedidos }) {
    return (
        <div className="grid grid-cols-2 gap-3">
            <MetricCard label="Efectivo"      icon={Banknote}    value={data.ventas_efectivo} />
            <MetricCard label="Transferencia" icon={CreditCard}  value={data.ventas_transferencia} />
            <MetricCard label="Gastos"        icon={TrendingDown} value={data.total_gastos} accent="#dc2626" />
            <MetricCard label="Pedidos"       icon={ShoppingBag} valueText={String(pedidos ?? data.pedidos_count)} />
            <div className="col-span-2">
                <MetricCard
                    label="Saldo en caja"
                    icon={Wallet}
                    value={data.saldo_efectivo}
                    highlight
                />
            </div>
        </div>
    );
}

/* ══════════════════════════════════════════════
   ADMIN CIERRE DE CAJA
══════════════════════════════════════════════ */
export default function AdminCierreCaja() {
    const confirm = useConfirm();
    const { summary, cierreHoy, history, loading, createCierre } = useCierreCaja();
    const [notas,  setNotas]  = useState('');
    const [saving, setSaving] = useState(false);

    const todayLabel = new Date().toLocaleDateString('es-AR', {
        weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
    });

    const handleCerrar = async () => {
        const ok = await confirm({
            title:       '¿Cerrar caja?',
            message:     'Se guardará el registro del cierre de hoy. No podés volver a cerrar el mismo día.',
            confirmText: 'Cerrar caja',
        });
        if (!ok) return;
        setSaving(true);
        const { error } = await createCierre(notas);
        setSaving(false);
        if (error) toast.error('Error al guardar el cierre');
        else toast.success('Caja cerrada correctamente');
    };

    const historyPrev = history.filter(c => c.fecha !== todayStr());

    return (
        <div className="max-w-2xl mx-auto animate-fade-up pb-10">

            {/* Header */}
            <div className="mb-6">
                <h1 className="font-display uppercase leading-none" style={{ fontSize: 'clamp(1.8rem, 5vw, 2.4rem)', color: '#111' }}>
                    Cierre de Caja
                </h1>
                <p className="font-body text-xs mt-0.5 capitalize" style={{ color: '#555' }}>
                    {todayLabel}
                </p>
            </div>

            {/* Loading */}
            {loading ? (
                <div className="flex flex-col gap-3">
                    {[...Array(3)].map((_, i) => (
                        <div key={i} className="h-20 rounded-2xl animate-pulse" style={{ background: 'rgba(0,0,0,0.07)' }} />
                    ))}
                </div>
            ) : (
                <>
                    {/* ── Caja ya cerrada ── */}
                    {cierreHoy ? (
                        <div className="mb-8 flex flex-col gap-4">
                            <div
                                className="flex items-center gap-3 px-4 py-3 rounded-2xl"
                                style={{ background: 'rgba(45,106,45,0.08)', border: '1.5px solid rgba(45,106,45,0.22)' }}
                            >
                                <CheckCircle2 className="w-5 h-5 shrink-0" style={{ color: G }} />
                                <div>
                                    <p className="font-body text-sm font-bold" style={{ color: G }}>Caja cerrada</p>
                                    <p className="font-body text-xs" style={{ color: '#555' }}>
                                        Registrada a las {fmtTime(cierreHoy.closed_at)}
                                    </p>
                                </div>
                            </div>

                            <SummaryGrid data={cierreHoy} pedidos={cierreHoy.pedidos_count} />

                            {cierreHoy.notas && (
                                <p
                                    className="font-body text-sm px-4 py-3 rounded-xl"
                                    style={{ background: 'rgba(0,0,0,0.04)', color: '#444', border: '1px solid rgba(0,0,0,0.08)' }}
                                >
                                    📝 {cierreHoy.notas}
                                </p>
                            )}
                        </div>
                    ) : (
                    /* ── Caja abierta ── */
                        <div className="mb-8 flex flex-col gap-4">
                            {summary && (
                                <>
                                    <SummaryGrid data={summary} />

                                    <textarea
                                        value={notas}
                                        onChange={e => setNotas(e.target.value)}
                                        placeholder="Notas del cierre (opcional)…"
                                        rows={2}
                                        className="w-full bg-white border border-[rgba(0,0,0,0.12)] rounded-xl px-4 py-3 font-body text-sm text-[#111] focus:outline-none focus:border-[#2d6a2d] transition-all resize-none placeholder:text-[rgba(0,0,0,0.35)]"
                                    />

                                    <button
                                        onClick={handleCerrar}
                                        disabled={saving}
                                        className="cursor-pointer w-full py-4 rounded-2xl font-body font-bold text-sm uppercase tracking-widest transition-all active:scale-[0.98] disabled:opacity-60"
                                        style={{ background: G_DARK, color: '#fff', boxShadow: '0 6px 24px rgba(26,74,26,0.30)' }}
                                    >
                                        {saving ? 'Guardando…' : '🔒 Cerrar caja'}
                                    </button>
                                </>
                            )}
                        </div>
                    )}

                    {/* ── Historial ── */}
                    {historyPrev.length > 0 && (
                        <div>
                            <div className="flex items-center gap-2 mb-3">
                                <ClipboardList className="w-4 h-4" style={{ color: '#555' }} />
                                <h2 className="font-body text-sm font-bold uppercase tracking-wider" style={{ color: '#555' }}>
                                    Cierres anteriores
                                </h2>
                            </div>
                            <div className="flex flex-col gap-2">
                                {historyPrev.map(c => <HistoryRow key={c.id} cierre={c} />)}
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
