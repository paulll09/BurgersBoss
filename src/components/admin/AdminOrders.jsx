import { useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
    Plus, Printer, Check, X, Clock, ShoppingBag,
    History, Trash2, User, AlignLeft, Store, Truck,
    CreditCard, ChevronDown, ChevronUp,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { BUSINESS_ID } from '../../lib/config';
import { useOrders } from '../../hooks/useOrders';
import { useProducts } from '../../hooks/useProducts';
import { useExtras } from '../../hooks/useExtras';
import { useConfirm } from '../ui/ConfirmDialog';
import { printTicket } from '../../lib/printTicket';
import { inputCls } from '../../utils/styles';
import toast from 'react-hot-toast';

/* ── Design tokens ── */
const G      = '#2d6a2d';
const G_DARK = '#1a4a1a';

/* ── Relative time ── */
function relativeTime(dateStr) {
    const diff = Math.floor((Date.now() - new Date(dateStr)) / 1000);
    if (diff < 60)  return 'hace un momento';
    if (diff < 3600) return `hace ${Math.floor(diff / 60)} min`;
    return `hace ${Math.floor(diff / 3600)}h`;
}

function padNum(n) { return String(n).padStart(4, '0'); }

function formatCurrency(n) {
    return '$' + Number(n).toLocaleString('es-AR');
}

/* ══════════════════════════════════════════════
   ORDER CARD
══════════════════════════════════════════════ */
function OrderCard({ order, onConfirm, onCancel, onPrint, onFinish }) {
    const [expanded, setExpanded]         = useState(true);
    const [confirmingFee, setConfirmingFee] = useState(false);
    const [deliveryFee, setDeliveryFee]   = useState('');
    const isPending   = order.status === 'pending';
    const isConfirmed = order.status === 'confirmed';
    const isDelivery  = order.order_type === 'delivery';

    const modeLabel = order.order_type === 'delivery' ? 'Delivery' : 'Retiro local';
    const payLabel  = { efectivo: 'Efectivo', transferencia: 'Transferencia' }[order.payment_method] ?? '';
    const items     = Array.isArray(order.items) ? order.items : [];

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.25 }}
            className="rounded-2xl overflow-hidden"
            style={{
                background: isConfirmed ? 'rgba(45,106,45,0.05)' : '#fff',
                border: isConfirmed
                    ? '1.5px solid rgba(45,106,45,0.25)'
                    : '1.5px solid rgba(0,0,0,0.08)',
                boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
            }}
        >
            {/* Card header */}
            <div
                className="flex items-center gap-3 px-4 py-3 cursor-pointer select-none"
                onClick={() => setExpanded(p => !p)}
            >
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-display text-xl leading-none" style={{ color: '#111' }}>
                            #{padNum(order.order_number)}
                        </span>
                        <span
                            className="text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full font-body"
                            style={order.source === 'web'
                                ? { background: 'rgba(59,130,246,0.10)', color: '#2563eb' }
                                : { background: 'rgba(0,0,0,0.06)', color: '#555' }
                            }
                        >
                            {order.source === 'web' ? 'Web' : 'Manual'}
                        </span>
                        <span
                            className="text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full font-body"
                            style={isConfirmed
                                ? { background: 'rgba(45,106,45,0.12)', color: G }
                                : { background: 'rgba(245,158,11,0.12)', color: '#d97706' }
                            }
                        >
                            {isConfirmed ? '✓ Cobrado' : 'Pendiente pago'}
                        </span>
                    </div>
                    <p className="font-body text-xs mt-0.5" style={{ color: '#555' }}>
                        {order.customer_name} · {relativeTime(order.created_at)}
                    </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                    <span className="font-display text-xl leading-none" style={{ color: '#111' }}>
                        {formatCurrency(order.total)}
                    </span>
                    {expanded
                        ? <ChevronUp className="w-4 h-4" style={{ color: '#666' }} />
                        : <ChevronDown className="w-4 h-4" style={{ color: '#666' }} />
                    }
                </div>
            </div>

            {/* Expandable body */}
            <AnimatePresence initial={false}>
                {expanded && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        style={{ overflow: 'hidden' }}
                    >
                        {/* Items */}
                        <div className="px-4 pb-3 flex flex-col gap-1.5">
                            <div className="h-px mb-1" style={{ background: 'rgba(0,0,0,0.07)' }} />
                            {items.map((item, i) => (
                                <div key={i}>
                                    <div className="flex items-start justify-between gap-2">
                                        <span className="font-body text-sm" style={{ color: '#111' }}>
                                            <span className="font-bold">{item.quantity}x</span>{' '}
                                            {item.name}{item.variantName ? ` (${item.variantName})` : ''}
                                        </span>
                                        <span className="font-body text-sm font-semibold shrink-0" style={{ color: '#111' }}>
                                            {formatCurrency(item.price * item.quantity)}
                                        </span>
                                    </div>
                                    {item.comboOptionName && (
                                        <p className="font-body text-xs pl-4" style={{ color: '#2d6a2d', fontWeight: 600 }}>
                                            › {item.comboOptionName}
                                        </p>
                                    )}
                                    {(item.extras ?? []).map((e, j) => (
                                        <p key={j} className="font-body text-xs pl-4" style={{ color: 'rgba(45,106,45,0.75)' }}>
                                            + {e.name}
                                        </p>
                                    ))}
                                </div>
                            ))}

                            {/* Meta */}
                            <div className="h-px mt-1" style={{ background: 'rgba(0,0,0,0.07)' }} />
                            <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-0.5">
                                <p className="font-body text-xs" style={{ color: '#555' }}>
                                    💳 {payLabel}
                                </p>
                                <p className="font-body text-xs" style={{ color: '#555' }}>
                                    {order.order_type === 'delivery' ? '🚚' : '🏠'} {modeLabel}
                                </p>
                                {order.address && (
                                    <p className="font-body text-xs" style={{ color: '#555' }}>
                                        📍 {order.address}
                                    </p>
                                )}
                                {order.notes && (
                                    <p className="font-body text-xs" style={{ color: '#555' }}>
                                        📝 {order.notes}
                                    </p>
                                )}
                            </div>

                            {/* Actions */}
                            <div className="flex gap-2 mt-2">
                                <button
                                    onClick={() => onCancel(order.id)}
                                    className="cursor-pointer flex items-center gap-1.5 px-3 py-2 rounded-xl font-body text-xs font-semibold transition-all active:scale-95"
                                    style={{ color: '#555', border: '1px solid rgba(0,0,0,0.10)' }}
                                >
                                    <X className="w-3.5 h-3.5" />
                                    Cancelar
                                </button>

                                <div className="flex-1" />

                                {isPending && !confirmingFee && (
                                    <button
                                        onClick={() => isDelivery ? setConfirmingFee(true) : onConfirm(order.id, 0)}
                                        className="cursor-pointer flex items-center gap-1.5 px-4 py-2 rounded-xl font-body text-sm font-bold uppercase tracking-wider transition-all active:scale-95 shadow-[0_4px_14px_rgba(45,106,45,0.28)]"
                                        style={{ background: G, color: '#fff' }}
                                    >
                                        <Check className="w-4 h-4" />
                                        Confirmar pago
                                    </button>
                                )}

                                {isPending && confirmingFee && (
                                    <div className="flex items-center gap-2 flex-1">
                                        <div className="relative flex-1">
                                            <span className="absolute left-3 top-1/2 -translate-y-1/2 font-body text-sm" style={{ color: '#888' }}>$</span>
                                            <input
                                                type="number" min="0" step="100"
                                                value={deliveryFee}
                                                onChange={e => setDeliveryFee(e.target.value)}
                                                placeholder="Costo de envío"
                                                autoFocus
                                                className="w-full bg-white border border-[rgba(0,0,0,0.12)] rounded-xl pl-7 pr-3 py-2 text-[#111] text-sm focus:outline-none focus:border-[#2d6a2d] transition-all placeholder:text-[rgba(0,0,0,0.28)]"
                                            />
                                        </div>
                                        <button
                                            onClick={() => { onConfirm(order.id, parseFloat(deliveryFee) || 0); setConfirmingFee(false); setDeliveryFee(''); }}
                                            className="cursor-pointer flex items-center gap-1 px-3 py-2 rounded-xl font-body text-sm font-bold uppercase tracking-wider transition-all active:scale-95 shrink-0 shadow-[0_4px_14px_rgba(45,106,45,0.28)]"
                                            style={{ background: G, color: '#fff' }}
                                        >
                                            <Check className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => { setConfirmingFee(false); setDeliveryFee(''); }}
                                            className="cursor-pointer p-2 rounded-xl transition-all active:scale-90 shrink-0"
                                            style={{ color: '#555', border: '1px solid rgba(0,0,0,0.10)' }}
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>
                                )}

                                {isConfirmed && (
                                    <>
                                        <button
                                            onClick={() => onFinish(order.id)}
                                            className="cursor-pointer flex items-center gap-1.5 px-3 py-2 rounded-xl font-body text-xs font-semibold transition-all active:scale-95"
                                            style={{ color: '#555', border: '1px solid rgba(0,0,0,0.10)' }}
                                        >
                                            <Check className="w-3.5 h-3.5" />
                                            Finalizar
                                        </button>
                                        <button
                                            onClick={() => onPrint(order)}
                                            className="cursor-pointer flex items-center gap-1.5 px-4 py-2 rounded-xl font-body text-sm font-bold uppercase tracking-wider transition-all active:scale-95"
                                            style={{ background: G_DARK, color: '#fff', boxShadow: '0 4px 14px rgba(26,74,26,0.35)' }}
                                        >
                                            <Printer className="w-4 h-4" />
                                            Imprimir comanda
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}

/* ══════════════════════════════════════════════
   HISTORY ROW
══════════════════════════════════════════════ */
function HistoryRow({ order, onReprint, onDelete }) {
    const statusColors = {
        printed:   { bg: 'rgba(45,106,45,0.08)',  text: G },
        cancelled: { bg: 'rgba(239,68,68,0.08)',  text: '#dc2626' },
        expired:   { bg: 'rgba(0,0,0,0.05)',      text: '#555' },
    };
    const sc = statusColors[order.status] ?? statusColors.expired;
    const labels = { printed: 'Impreso', cancelled: 'Cancelado', expired: 'Expirado' };

    return (
        <div
            className="flex items-center gap-3 px-4 py-3 rounded-xl"
            style={{ background: '#fff', border: '1px solid rgba(0,0,0,0.07)' }}
        >
            <span className="font-display text-lg leading-none w-14 shrink-0" style={{ color: '#111' }}>
                #{padNum(order.order_number)}
            </span>
            <div className="flex-1 min-w-0">
                <p className="font-body text-sm font-semibold truncate" style={{ color: '#111' }}>
                    {order.customer_name}
                </p>
                <p className="font-body text-xs" style={{ color: '#555' }}>
                    {new Date(order.created_at).toLocaleString('es-AR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                </p>
            </div>
            <span className="font-body text-sm font-semibold shrink-0" style={{ color: '#111' }}>
                {formatCurrency(order.total)}
            </span>
            <span
                className="font-body text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full shrink-0"
                style={{ background: sc.bg, color: sc.text }}
            >
                {labels[order.status] ?? order.status}
            </span>
            {order.status === 'printed' && (
                <button
                    onClick={() => onReprint(order)}
                    className="cursor-pointer p-2 rounded-lg transition-all active:scale-90"
                    style={{ color: '#555', background: 'rgba(0,0,0,0.04)' }}
                    title="Reimprimir"
                >
                    <Printer className="w-3.5 h-3.5" />
                </button>
            )}
            <button
                onClick={() => onDelete(order)}
                className="cursor-pointer p-2 rounded-lg transition-all active:scale-90"
                style={{ color: '#dc2626', background: 'rgba(239,68,68,0.08)' }}
                title="Eliminar pedido"
            >
                <Trash2 className="w-3.5 h-3.5" />
            </button>
        </div>
    );
}

/* ══════════════════════════════════════════════
   MANUAL ORDER MODAL
══════════════════════════════════════════════ */
const EMPTY_ITEM = { productId: '', variantId: '', name: '', variantName: '', quantity: 1, price: '', basePrice: 0, extras: [] };
const EMPTY_FORM = {
    customer_name: '',
    order_type: 'pickup',
    payment_method: 'efectivo',
    address: '',
    notes: '',
    overrideTotal: '',
    delivery_fee: '',
};

function ManualOrderModal({ onClose, onCreate }) {
    const [form, setForm]         = useState(EMPTY_FORM);
    const [items, setItems]       = useState([{ ...EMPTY_ITEM }]);
    const [saving, setSaving]     = useState(false);
    const [useOverride, setUseOverride] = useState(false);

    const { products, categories } = useProducts(true);
    const { extras: allExtras }    = useExtras(true);

    const itemsSubtotal = items.reduce((s, it) => s + (parseFloat(it.price) || 0) * (parseInt(it.quantity) || 0), 0);
    const parsedDeliveryFee = form.order_type === 'delivery' ? (parseFloat(form.delivery_fee) || 0) : 0;
    const autoTotal  = itemsSubtotal + parsedDeliveryFee;
    const finalTotal = useOverride && form.overrideTotal ? parseFloat(form.overrideTotal) || 0 : autoTotal;

    const updateItem = (i, updates) =>
        setItems(prev => prev.map((it, idx) => idx === i ? { ...it, ...updates } : it));

    const handleProductChange = (i, productId) => {
        const product = products.find(p => p.id === productId);
        if (!product) { updateItem(i, { ...EMPTY_ITEM }); return; }
        const firstVariant = product.product_variants?.[0];
        const basePrice = Number(firstVariant?.price ?? product.price ?? 0);
        updateItem(i, {
            productId:   product.id,
            name:        product.name,
            variantId:   firstVariant?.id   ?? '',
            variantName: firstVariant?.name ?? '',
            basePrice,
            extras:      [],
            price:       String(basePrice),
        });
    };

    const handleVariantChange = (i, variantId) => {
        const product   = products.find(p => p.id === items[i].productId);
        const variant   = product?.product_variants?.find(v => v.id === variantId);
        const basePrice = Number(variant?.price ?? 0);
        const extrasSum = items[i].extras.reduce((s, e) => s + Number(e.price), 0);
        updateItem(i, {
            variantId:   variantId,
            variantName: variant?.name ?? '',
            basePrice,
            price:       String(basePrice + extrasSum),
        });
    };

    const handleExtraToggle = (i, extra) => {
        const item     = items[i];
        const already  = item.extras.find(e => e.id === extra.id);
        const newExtras = already
            ? item.extras.filter(e => e.id !== extra.id)
            : [...item.extras, { id: extra.id, name: extra.name, price: Number(extra.price) }];
        const extrasSum = newExtras.reduce((s, e) => s + Number(e.price), 0);
        updateItem(i, { extras: newExtras, price: String(item.basePrice + extrasSum) });
    };

    const addItem = () => setItems(prev => [...prev, { ...EMPTY_ITEM }]);
    const removeItem = (i) => setItems(prev => prev.filter((_, idx) => idx !== i));

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.customer_name.trim()) { toast.error('El nombre es obligatorio'); return; }
        if (items.every(it => !it.name)) { toast.error('Agregá al menos un producto'); return; }

        setSaving(true);
        const payload = {
            customer_name: form.customer_name.trim(),
            order_type: form.order_type,
            payment_method: form.payment_method,
            address: form.order_type === 'delivery' ? form.address.trim() || null : null,
            notes: form.notes.trim() || null,
            items: items
                .filter(it => it.name)
                .map(it => ({
                    name:        it.name,
                    variantName: it.variantName || null,
                    quantity:    parseInt(it.quantity) || 1,
                    price:       parseFloat(it.price) || 0,
                    extras:      [],
                })),
            total: finalTotal,
            ...(parsedDeliveryFee > 0 ? { delivery_fee: parsedDeliveryFee } : {}),
        };

        const { data, error } = await onCreate(payload);
        setSaving(false);
        if (error) { toast.error(error.message); return; }
        toast.success(`Pedido #${padNum(data.order_number)} creado`);
        onClose();
    };

    return createPortal(
        <div
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
            style={{ background: 'rgba(0,0,0,0.55)', height: '100dvh' }}
            onClick={e => { if (e.target === e.currentTarget) onClose(); }}
        >
            <motion.div
                className="bg-white w-full sm:max-w-lg sm:rounded-2xl rounded-t-3xl overflow-hidden"
                style={{ maxHeight: '92dvh', display: 'flex', flexDirection: 'column', paddingBottom: 'env(safe-area-inset-bottom)' }}
                initial={{ y: 60, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 60, opacity: 0 }}
                transition={{ type: 'spring', damping: 28, stiffness: 320 }}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: 'rgba(0,0,0,0.08)', flexShrink: 0 }}>
                    <h2 className="font-display uppercase text-2xl leading-none" style={{ color: '#111' }}>
                        Pedido Manual
                    </h2>
                    <button onClick={onClose}
                        className="cursor-pointer p-2 rounded-xl transition-all active:scale-90"
                        style={{ color: '#555', background: 'rgba(0,0,0,0.05)' }}>
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} style={{ overflowY: 'auto', flex: 1 }}>
                    <div className="flex flex-col gap-5 px-5 py-5">

                        {/* Customer name */}
                        <div>
                            <label className="flex items-center gap-1.5 font-body text-[10px] font-bold uppercase tracking-[0.22em] mb-2" style={{ color: G }}>
                                <User className="w-3 h-3" /> Nombre del cliente *
                            </label>
                            <input
                                type="text" value={form.customer_name} autoFocus
                                onChange={e => setForm(p => ({ ...p, customer_name: e.target.value }))}
                                placeholder="Ej: Juan Pérez"
                                className={inputCls}
                            />
                        </div>

                        {/* Items */}
                        <div>
                            <label className="font-body text-[10px] font-bold uppercase tracking-[0.22em] mb-2 block" style={{ color: G }}>
                                Productos *
                            </label>
                            <div className="flex flex-col gap-3">
                                {items.map((item, i) => {
                                    const selectedProduct = products.find(p => p.id === item.productId);
                                    const hasVariants = (selectedProduct?.product_variants?.length ?? 0) > 0;
                                    return (
                                        <div key={i} className="flex flex-col gap-1.5 p-3 rounded-xl" style={{ background: 'rgba(0,0,0,0.03)', border: '1px solid rgba(0,0,0,0.07)' }}>
                                            {/* Row 1: selector + qty + price + delete */}
                                            <div className="flex gap-2 items-center">
                                                <select
                                                    value={item.productId}
                                                    onChange={e => handleProductChange(i, e.target.value)}
                                                    className="flex-1 min-w-0 bg-white border border-[rgba(0,0,0,0.12)] rounded-xl px-3 py-2.5 text-[#111] text-sm focus:outline-none focus:border-[#2d6a2d] transition-all"
                                                >
                                                    <option value="">— Seleccioná un producto —</option>
                                                    {categories.map(cat => {
                                                        const catProducts = products.filter(p => p.category_id === cat.id);
                                                        if (!catProducts.length) return null;
                                                        return (
                                                            <optgroup key={cat.id} label={cat.name}>
                                                                {catProducts.map(p => (
                                                                    <option key={p.id} value={p.id}>{p.name}</option>
                                                                ))}
                                                            </optgroup>
                                                        );
                                                    })}
                                                </select>
                                                <input
                                                    type="number" value={item.quantity} min="1"
                                                    onChange={e => updateItem(i, { quantity: e.target.value })}
                                                    className="w-14 bg-white border border-[rgba(0,0,0,0.12)] rounded-xl px-2 py-2.5 text-[#111] text-sm text-center focus:outline-none focus:border-[#2d6a2d] transition-all"
                                                />
                                                <div className="relative w-24">
                                                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-sm" style={{ color: '#888' }}>$</span>
                                                    <input
                                                        type="number" value={item.price} min="0" step="100"
                                                        onChange={e => updateItem(i, { price: e.target.value })}
                                                        className="w-full bg-white border border-[rgba(0,0,0,0.12)] rounded-xl pl-6 pr-2 py-2.5 text-[#111] text-sm focus:outline-none focus:border-[#2d6a2d] transition-all"
                                                    />
                                                </div>
                                                {items.length > 1 && (
                                                    <button type="button" onClick={() => removeItem(i)}
                                                        className="cursor-pointer p-2 rounded-lg transition-all active:scale-90 shrink-0"
                                                        style={{ color: '#dc2626', background: 'rgba(239,68,68,0.08)' }}>
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                    </button>
                                                )}
                                            </div>
                                            {/* Row 2: variant selector */}
                                            {hasVariants && (
                                                <select
                                                    value={item.variantId}
                                                    onChange={e => handleVariantChange(i, e.target.value)}
                                                    className="w-full bg-white border border-[rgba(0,0,0,0.12)] rounded-xl px-3 py-2 text-[#111] text-sm focus:outline-none focus:border-[#2d6a2d] transition-all"
                                                >
                                                    {selectedProduct.product_variants.map(v => (
                                                        <option key={v.id} value={v.id}>
                                                            {v.name} — ${Number(v.price).toLocaleString('es-AR')}
                                                        </option>
                                                    ))}
                                                </select>
                                            )}
                                            {/* Row 3: extras disponibles para este producto */}
                                            {selectedProduct && (() => {
                                                const availableExtras = allExtras.filter(e =>
                                                    !e.allowed_categories?.length ||
                                                    e.allowed_categories.includes(selectedProduct.category_id)
                                                );
                                                if (!availableExtras.length) return null;
                                                return (
                                                    <div>
                                                        <p className="font-body text-[10px] font-bold uppercase tracking-[0.18em] mb-1.5" style={{ color: 'rgba(0,0,0,0.38)' }}>
                                                            Extras
                                                        </p>
                                                        <div className="flex flex-wrap gap-1.5">
                                                            {availableExtras.map(extra => {
                                                                const selected = item.extras.find(e => e.id === extra.id);
                                                                return (
                                                                    <button
                                                                        key={extra.id}
                                                                        type="button"
                                                                        onClick={() => handleExtraToggle(i, extra)}
                                                                        className="cursor-pointer px-2.5 py-1 rounded-full font-body text-xs font-semibold transition-all active:scale-95"
                                                                        style={selected
                                                                            ? { background: G, color: '#fff' }
                                                                            : { background: 'rgba(0,0,0,0.06)', color: '#555' }
                                                                        }
                                                                    >
                                                                        + {extra.name}
                                                                        {Number(extra.price) > 0 && ` $${Number(extra.price).toLocaleString('es-AR')}`}
                                                                    </button>
                                                                );
                                                            })}
                                                        </div>
                                                    </div>
                                                );
                                            })()}
                                        </div>
                                    );
                                })}
                                <button type="button" onClick={addItem}
                                    className="cursor-pointer flex items-center gap-1.5 font-body text-xs font-semibold px-3 py-2 rounded-xl transition-all active:scale-95 self-start"
                                    style={{ color: G, background: 'rgba(45,106,45,0.08)' }}>
                                    <Plus className="w-3.5 h-3.5" /> Agregar producto
                                </button>
                            </div>
                        </div>

                        {/* Total */}
                        <div className="flex flex-col gap-1 px-4 py-3 rounded-xl" style={{ background: 'rgba(0,0,0,0.03)', border: '1px solid rgba(0,0,0,0.07)' }}>
                            {parsedDeliveryFee > 0 && (
                                <>
                                    <div className="flex items-center justify-between">
                                        <span className="font-body text-xs" style={{ color: '#888' }}>Subtotal productos</span>
                                        <span className="font-body text-sm" style={{ color: '#888' }}>{formatCurrency(itemsSubtotal)}</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="font-body text-xs" style={{ color: '#888' }}>Costo de envío</span>
                                        <span className="font-body text-sm" style={{ color: '#888' }}>{formatCurrency(parsedDeliveryFee)}</span>
                                    </div>
                                    <div className="h-px my-0.5" style={{ background: 'rgba(0,0,0,0.08)' }} />
                                </>
                            )}
                            <div className="flex items-center justify-between">
                                <span className="font-body text-sm font-semibold" style={{ color: '#444' }}>Total calculado</span>
                                <span className="font-display text-2xl leading-none" style={{ color: '#111' }}>{formatCurrency(autoTotal)}</span>
                            </div>
                        </div>

                        {/* Override total */}
                        <div>
                            <label className="flex items-center gap-2 cursor-pointer mb-2">
                                <input type="checkbox" checked={useOverride} onChange={e => setUseOverride(e.target.checked)} className="w-4 h-4 accent-[#2d6a2d]" />
                                <span className="font-body text-xs font-semibold" style={{ color: '#444' }}>
                                    Ajustar total manualmente
                                </span>
                            </label>
                            {useOverride && (
                                <input
                                    type="number" min="0" value={form.overrideTotal}
                                    onChange={e => setForm(p => ({ ...p, overrideTotal: e.target.value }))}
                                    placeholder="Ingresá el total final"
                                    className={inputCls}
                                />
                            )}
                        </div>

                        {/* Modality */}
                        <div>
                            <label className="flex items-center gap-1.5 font-body text-[10px] font-bold uppercase tracking-[0.22em] mb-2" style={{ color: G }}>
                                <Store className="w-3 h-3" /> Modalidad
                            </label>
                            <div className="grid grid-cols-2 gap-2">
                                {[{ id: 'pickup', label: 'Retiro local', icon: Store }, { id: 'delivery', label: 'Delivery', icon: Truck }].map(({ id, label, icon: Icon }) => (
                                    <button key={id} type="button"
                                        onClick={() => setForm(p => ({ ...p, order_type: id }))}
                                        className="cursor-pointer flex items-center justify-center gap-2 py-2.5 rounded-xl font-body text-xs font-bold uppercase tracking-wider transition-all active:scale-95"
                                        style={form.order_type === id
                                            ? { background: G, color: '#fff', border: `1.5px solid ${G}` }
                                            : { background: '#fff', color: '#555', border: '1.5px solid rgba(0,0,0,0.10)' }
                                        }
                                    >
                                        <Icon className="w-3.5 h-3.5" />{label}
                                    </button>
                                ))}
                            </div>
                            {form.order_type === 'delivery' && (
                                <>
                                    <input type="text" value={form.address} placeholder="Dirección de envío"
                                        onChange={e => setForm(p => ({ ...p, address: e.target.value }))}
                                        className={`${inputCls} mt-2`} />
                                    <div className="relative mt-2">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 font-body text-sm" style={{ color: '#888' }}>$</span>
                                        <input
                                            type="number" min="0" step="100"
                                            value={form.delivery_fee}
                                            onChange={e => setForm(p => ({ ...p, delivery_fee: e.target.value }))}
                                            placeholder="Costo de envío"
                                            className={`${inputCls} pl-7`}
                                        />
                                    </div>
                                </>
                            )}
                        </div>

                        {/* Payment */}
                        <div>
                            <label className="flex items-center gap-1.5 font-body text-[10px] font-bold uppercase tracking-[0.22em] mb-2" style={{ color: G }}>
                                <CreditCard className="w-3 h-3" /> Pago
                            </label>
                            <div className="grid grid-cols-2 gap-2">
                                {[{ id: 'efectivo', label: 'Efectivo' }, { id: 'transferencia', label: 'Transferencia' }].map(({ id, label }) => (
                                    <button key={id} type="button"
                                        onClick={() => setForm(p => ({ ...p, payment_method: id }))}
                                        className="cursor-pointer py-2.5 rounded-xl font-body text-xs font-bold uppercase tracking-wider transition-all active:scale-95"
                                        style={form.payment_method === id
                                            ? { background: G, color: '#fff', border: `1.5px solid ${G}` }
                                            : { background: '#fff', color: '#555', border: '1.5px solid rgba(0,0,0,0.10)' }
                                        }
                                    >
                                        {label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Notes */}
                        <div>
                            <label className="flex items-center gap-1.5 font-body text-[10px] font-bold uppercase tracking-[0.22em] mb-2" style={{ color: '#555' }}>
                                <AlignLeft className="w-3 h-3" /> Aclaraciones
                            </label>
                            <input type="text" value={form.notes} placeholder="Sin cebolla, bien cocido…"
                                onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
                                className={inputCls} />
                        </div>

                        {/* Submit */}
                        <div className="flex gap-3 pb-2">
                            <button type="button" onClick={onClose}
                                className="cursor-pointer flex-1 py-3 rounded-xl border font-body font-semibold text-sm transition-all active:scale-95"
                                style={{ borderColor: 'rgba(0,0,0,0.10)', color: '#444' }}>
                                Cancelar
                            </button>
                            <button type="submit" disabled={saving}
                                className="cursor-pointer flex-1 py-3 rounded-xl font-body font-bold text-sm uppercase tracking-widest transition-all active:scale-[0.98] disabled:opacity-60 shadow-[0_4px_14px_rgba(45,106,45,0.28)]"
                                style={{ background: G, color: '#fff' }}>
                                {saving ? 'Creando…' : 'Crear y cobrado'}
                            </button>
                        </div>
                    </div>
                </form>
            </motion.div>
        </div>,
        document.body
    );
}

/* ══════════════════════════════════════════════
   ADMIN ORDERS — MAIN
══════════════════════════════════════════════ */
export default function AdminOrders() {
    const confirm = useConfirm();
    const {
        orders, loading,
        pendingCount, confirmedCount,
        confirmOrder, cancelOrder, markPrinted, createManualOrder, deleteOrder,
    } = useOrders();

    const [tab, setTab]           = useState('pending');  // 'pending' | 'confirmed' | 'history'
    const [manualOpen, setManualOpen] = useState(false);
    const [history, setHistory]   = useState([]);
    const [historyLoading, setHistoryLoading] = useState(false);
    const [historyDate, setHistoryDate] = useState(() => {
        const d = new Date();
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    });

    /* ── Load history ── */
    const loadHistory = useCallback(async (date) => {
        setHistoryLoading(true);
        // Usar hora local → ISO UTC para que coincida con el timezone del negocio
        const from = new Date(date + 'T00:00:00').toISOString();
        const to   = new Date(date + 'T23:59:59.999').toISOString();
        const { data, error } = await supabase
            .from('orders')
            .select('*')
            .eq('business_id', BUSINESS_ID)
            .in('status', ['printed', 'cancelled', 'expired'])
            .gte('created_at', from)
            .lte('created_at', to)
            .order('created_at', { ascending: false });
        if (error) toast.error('Error al cargar historial');
        setHistory(data ?? []);
        setHistoryLoading(false);
    }, []);

    const handleTabChange = (id) => {
        setTab(id);
        if (id === 'history') loadHistory(historyDate);
    };

    /* ── Handlers ── */
    const handleConfirm = async (id, deliveryFee = 0) => {
        const ok = await confirmOrder(id, deliveryFee);
        if (ok) toast.success('Pago confirmado — venta registrada');
        else toast.error('Error al confirmar');
    };

    const handleCancel = async (id) => {
        const ok2 = await confirm({
            title: '¿Cancelar pedido?',
            message: 'El pedido se marcará como cancelado.',
            confirmText: 'Cancelar pedido',
        });
        if (!ok2) return;
        const ok = await cancelOrder(id);
        if (ok) toast.success('Pedido cancelado');
        else toast.error('Error al cancelar');
    };

    const handlePrint = async (order) => {
        printTicket(order);
        await markPrinted(order.id);
    };

    const handleFinish = async (id) => {
        await markPrinted(id);
    };

    const handleDeleteHistory = async (order) => {
        const ok2 = await confirm({
            title: '¿Eliminar pedido?',
            message: `El pedido #${padNum(order.order_number)} de ${order.customer_name} se eliminará permanentemente y no aparecerá en ventas ni reportes.`,
            confirmText: 'Eliminar',
        });
        if (!ok2) return;
        const ok = await deleteOrder(order.id);
        if (ok) {
            setHistory(prev => prev.filter(o => o.id !== order.id));
            toast.success(`Pedido #${padNum(order.order_number)} eliminado`);
        } else {
            toast.error('Sin permiso para eliminar. Agregá una política DELETE en Supabase para la tabla orders.');
        }
    };

    const handleManualCreate = async (payload) => {
        return createManualOrder(payload);
    };

    const pendingOrders   = orders.filter(o => o.status === 'pending');
    const confirmedOrders = orders.filter(o => o.status === 'confirmed');

    return (
        <div className="max-w-2xl mx-auto animate-fade-up pb-10">

            {/* Header */}
            <div className="flex items-center justify-between mb-6 gap-3">
                <div>
                    <h1 className="font-display uppercase leading-none" style={{ fontSize: 'clamp(1.8rem, 5vw, 2.4rem)', color: '#111' }}>
                        Pedidos
                    </h1>
                    <p className="font-body text-xs mt-0.5" style={{ color: '#555' }}>
                        {pendingCount > 0
                            ? `${pendingCount} pendiente${pendingCount > 1 ? 's' : ''} de pago`
                            : confirmedCount > 0
                            ? `${confirmedCount} cobrado${confirmedCount > 1 ? 's' : ''}`
                            : 'Sin pedidos activos'
                        }
                    </p>
                </div>
                <button
                    onClick={() => setManualOpen(true)}
                    className="cursor-pointer flex items-center gap-2 px-4 py-2.5 rounded-xl font-body font-bold text-sm uppercase tracking-widest transition-all active:scale-95 shadow-[0_4px_14px_rgba(45,106,45,0.28)] shrink-0"
                    style={{ background: G, color: '#fff' }}
                >
                    <Plus className="w-4 h-4" />
                    <span className="hidden sm:inline">Pedido Manual</span>
                    <span className="sm:hidden">Manual</span>
                </button>
            </div>

            {/* Tabs */}
            <div
                className="flex gap-1 p-1 rounded-xl mb-5"
                style={{ background: 'rgba(0,0,0,0.05)' }}
            >
                {[
                    { id: 'pending',   label: `Pendientes${pendingCount > 0 ? ` (${pendingCount})` : ''}`,     icon: Clock },
                    { id: 'confirmed', label: `Cobrados${confirmedCount > 0 ? ` (${confirmedCount})` : ''}`,   icon: Check },
                    { id: 'history',   label: 'Historial', icon: History },
                ].map(({ id, label, icon: Icon }) => (
                    <button key={id}
                        onClick={() => handleTabChange(id)}
                        className="cursor-pointer flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg font-body text-xs font-semibold transition-all"
                        style={tab === id
                            ? { background: '#fff', color: '#111', boxShadow: '0 1px 4px rgba(0,0,0,0.10)' }
                            : { color: '#555' }
                        }
                    >
                        <Icon className="w-3.5 h-3.5" />{label}
                    </button>
                ))}
            </div>

            {/* ── PENDIENTES TAB ── */}
            {tab === 'pending' && (
                <>
                    {loading ? (
                        <div className="flex flex-col gap-3">
                            {[...Array(2)].map((_, i) => (
                                <div key={i} className="h-28 rounded-2xl bg-white animate-pulse" style={{ border: '1px solid rgba(0,0,0,0.07)' }} />
                            ))}
                        </div>
                    ) : pendingOrders.length === 0 ? (
                        <div className="py-20 flex flex-col items-center gap-3 text-center">
                            <div className="w-14 h-14 rounded-full flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.05)' }}>
                                <Clock className="w-6 h-6" style={{ color: '#666' }} />
                            </div>
                            <p className="font-display uppercase text-2xl leading-none" style={{ color: '#666' }}>Sin pendientes</p>
                            <p className="font-body text-sm" style={{ color: '#555' }}>Los pedidos web aparecen aquí en tiempo real.</p>
                        </div>
                    ) : (
                        <AnimatePresence>
                            <div className="flex flex-col gap-3">
                                {pendingOrders.map(order => (
                                    <OrderCard key={order.id} order={order}
                                        onConfirm={handleConfirm} onCancel={handleCancel}
                                        onPrint={handlePrint} onFinish={handleFinish}
                                    />
                                ))}
                            </div>
                        </AnimatePresence>
                    )}
                </>
            )}

            {/* ── COBRADOS TAB ── */}
            {tab === 'confirmed' && (
                <>
                    {loading ? (
                        <div className="flex flex-col gap-3">
                            {[...Array(2)].map((_, i) => (
                                <div key={i} className="h-28 rounded-2xl bg-white animate-pulse" style={{ border: '1px solid rgba(0,0,0,0.07)' }} />
                            ))}
                        </div>
                    ) : confirmedOrders.length === 0 ? (
                        <div className="py-20 flex flex-col items-center gap-3 text-center">
                            <div className="w-14 h-14 rounded-full flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.05)' }}>
                                <Check className="w-6 h-6" style={{ color: '#666' }} />
                            </div>
                            <p className="font-display uppercase text-2xl leading-none" style={{ color: '#666' }}>Sin cobrados</p>
                            <p className="font-body text-sm" style={{ color: '#555' }}>Los pedidos confirmados aparecen aquí.</p>
                        </div>
                    ) : (
                        <AnimatePresence>
                            <div className="flex flex-col gap-3">
                                {confirmedOrders.map(order => (
                                    <OrderCard key={order.id} order={order}
                                        onConfirm={handleConfirm} onCancel={handleCancel}
                                        onPrint={handlePrint} onFinish={handleFinish}
                                    />
                                ))}
                            </div>
                        </AnimatePresence>
                    )}
                </>
            )}

            {/* ── HISTORY TAB ── */}
            {tab === 'history' && (
                <div className="flex flex-col gap-3">
                    {/* Date filter */}
                    <div className="flex items-center gap-3">
                        <input
                            type="date"
                            value={historyDate}
                            max={(() => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; })()}
                            onChange={e => { setHistoryDate(e.target.value); loadHistory(e.target.value); }}
                            className="bg-white border border-[rgba(0,0,0,0.12)] rounded-xl px-3 py-2.5 text-[#111] text-sm focus:outline-none focus:border-[#2d6a2d] transition-all"
                        />
                        <p className="font-body text-xs" style={{ color: '#555' }}>
                            {history.length} pedidos ese día
                        </p>
                    </div>

                    {historyLoading ? (
                        [...Array(3)].map((_, i) => (
                            <div key={i} className="h-14 rounded-xl bg-white animate-pulse" style={{ border: '1px solid rgba(0,0,0,0.07)' }} />
                        ))
                    ) : history.length === 0 ? (
                        <p className="py-12 text-center font-body text-sm" style={{ color: '#555' }}>
                            Sin pedidos ese día.
                        </p>
                    ) : (
                        history.map(order => (
                            <HistoryRow key={order.id} order={order} onReprint={printTicket} onDelete={handleDeleteHistory} />
                        ))
                    )}
                </div>
            )}

            {/* Manual modal */}
            <AnimatePresence>
                {manualOpen && (
                    <ManualOrderModal
                        onClose={() => setManualOpen(false)}
                        onCreate={handleManualCreate}
                    />
                )}
            </AnimatePresence>
        </div>
    );
}
