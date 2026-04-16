import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCartStore } from '../../store/cartStore';
import {
    Minus, Plus, Trash2, ArrowLeft, MessageCircle,
    User, MapPin, CreditCard, AlignLeft,
    Wine, Store, Truck, LocateFixed, Image as ImageIcon,
    ShoppingBag,
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { PREMIUM_EASE } from '../../lib/motion';

/* ── Design tokens ──────────────────── */
const G      = '#2d6a2d';
const G_DARK = '#1a4a1a';
const BONE   = '#F0EBE0';
const BLACK  = '#0f0f0f';
const MUTED  = '#555555';
const DIM    = '#777777';
const PAGE   = '#ffffff';
const CARD   = '#F5F1EA';
const BORDER = 'rgba(0,0,0,0.07)';

const field = (err) =>
    `w-full border ${err ? 'border-red-400' : 'border-[rgba(0,0,0,0.12)]'} rounded-2xl bg-white px-4 py-3.5 text-[15px] text-[#0f0f0f] outline-none font-body transition-all focus:border-[#2d6a2d] focus:ring-2 focus:ring-[rgba(45,106,45,0.10)] placeholder:text-[#ccc]`;

const sanitize = (str) => str.trim().slice(0, 300).replace(/[\u0000-\u001F\u007F]/g, '');

const stagger = {
    visible: { transition: { staggerChildren: 0.07 } },
};
const itemAnim = {
    hidden:  { opacity: 0, y: 16 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: PREMIUM_EASE } },
    exit:    { opacity: 0, x: -20, transition: { duration: 0.2 } },
};

export default function Cart() {
    const {
        items, removeItem, updateQuantity, getTotalPrice, clearCart,
        orderType, setOrderType, checkoutForm, setCheckoutForm,
    } = useCartStore();
    const totalPrice = getTotalPrice();
    const navigate   = useNavigate();

    const hasDrinks = items.some(i => i.category_name?.toLowerCase().includes('bebida'));
    const [formErrors, setFormErrors]   = useState({});
    const [geoLocation, setGeoLocation] = useState(null);
    const [geoStatus, setGeoStatus]     = useState('idle');

    const handleAddDrink = () => navigate('/', { state: { scrollTo: 'bebida' } });

    const handleGetLocation = () => {
        if (!navigator.geolocation) { setGeoStatus('error'); return; }
        setGeoStatus('loading');
        navigator.geolocation.getCurrentPosition(
            (p) => { setGeoLocation({ lat: p.coords.latitude, lng: p.coords.longitude }); setGeoStatus('granted'); },
            () => setGeoStatus('error'),
            { timeout: 8000 }
        );
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setCheckoutForm({ [name]: value });
        if (formErrors[name]) setFormErrors(p => ({ ...p, [name]: '' }));
    };

    const validate = () => {
        const errors = {};
        if (!checkoutForm.name.trim()) errors.name = true;
        if (orderType === 'delivery' && !checkoutForm.address.trim()) errors.address = true;
        setFormErrors(errors);
        return !Object.keys(errors).length;
    };

    const handleCheckout = () => {
        if (!orderType || !validate()) return;
        const phone = import.meta.env.VITE_WHATSAPP_PHONE ?? '5493716400743';
        const name    = sanitize(checkoutForm.name);
        const address = sanitize(checkoutForm.address);
        const notes   = sanitize(checkoutForm.notes);
        let text = `¡Hola! Soy *${name}* y quiero hacer el siguiente pedido:\n\n`;
        items.forEach(item => {
            const n = item.variantName ? `${item.name} (${item.variantName})` : item.name;
            text += `• ${item.quantity}x ${n} — $${(item.price * item.quantity).toLocaleString('es-AR')}\n`;
        });
        text += orderType === 'delivery'
            ? `\n*TOTAL: $${totalPrice.toLocaleString('es-AR')} + envio*\n\n`
            : `\n*TOTAL: $${totalPrice.toLocaleString('es-AR')}*\n\n`;
        text += orderType === 'pickup' ? `🏠 *Modalidad:* Retiro en el local\n` : `🚚 *Modalidad:* Envío a domicilio\n`;
        if (orderType === 'delivery') {
            if (address) text += `📍 *Dirección:* ${address}\n`;
            if (geoLocation) text += `🗺️ *Ubicación:* https://maps.google.com/?q=${geoLocation.lat},${geoLocation.lng}\n`;
        }
        text += `💳 *Pago:* ${{ efectivo: 'Efectivo', transferencia: 'Transferencia' }[checkoutForm.paymentMethod]}\n`;
        if (notes) text += `📝 *Aclaraciones:* ${notes}\n`;
        window.open(`https://wa.me/${phone}?text=${encodeURIComponent(text)}`, '_blank');
        clearCart();
    };

    /* ══ VACÍO ══════════════════════ */
    if (items.length === 0) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center px-6" style={{ background: PAGE }}>
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, ease: PREMIUM_EASE }}
                    className="w-full max-w-xs text-center"
                >
                    <div
                        className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6"
                        style={{ background: CARD }}
                    >
                        <ShoppingBag className="w-7 h-7" style={{ color: G }} />
                    </div>
                    <h2 className="font-display uppercase leading-none mb-3" style={{ fontSize: '3.5rem', color: BLACK }}>
                        Carrito<br />vacío
                    </h2>
                    <p className="font-body text-sm leading-relaxed mb-8" style={{ color: MUTED }}>
                        Todavía no sumaste nada. Explorá el menú.
                    </p>
                    <Link
                        to="/"
                        className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full font-body font-semibold text-xs uppercase tracking-widest transition-all hover:opacity-80 active:scale-95"
                        style={{ background: G, color: '#fff' }}
                    >
                        <ArrowLeft className="w-3.5 h-3.5" />
                        Ver el menú
                    </Link>
                </motion.div>
            </div>
        );
    }

    /* ══ CON PRODUCTOS ══════════════ */
    return (
        <div className="min-h-screen" style={{ background: PAGE }}>

            {/* ── Top nav ──────────────────────── */}
            <div className="flex items-center px-5 sm:px-8 pt-6 pb-4 max-w-2xl mx-auto">
                <Link
                    to="/"
                    className="flex items-center gap-1.5 font-body text-xs uppercase tracking-widest font-semibold transition-opacity hover:opacity-50"
                    style={{ color: BLACK }}
                >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    Menú
                </Link>
            </div>

            <div className="max-w-2xl mx-auto px-5 sm:px-8 pb-36 sm:pb-12">

                {/* ── Header ───────────────────── */}
                <div className="mb-8">
                    <h1
                        className="font-display uppercase leading-none"
                        style={{ fontSize: 'clamp(2.8rem, 13vw, 5rem)', color: BLACK, letterSpacing: '-0.01em' }}
                    >
                        Tu <span style={{ color: G }}>Pedido</span>
                    </h1>
                    <div className="flex items-center gap-2 mt-2">
                        <div style={{ width: '28px', height: '2px', background: G, borderRadius: '2px' }} />
                        <p className="font-body text-[10px] uppercase tracking-[0.28em]" style={{ color: DIM }}>
                            {items.length} {items.length === 1 ? 'producto' : 'productos'} · Burgers Boss
                        </p>
                    </div>
                </div>

                {/* ── Productos ────────────────── */}
                <div className="mb-2 flex items-center justify-between">
                    <p className="font-display uppercase text-xl" style={{ color: G }}>Productos</p>
                    <button
                        onClick={clearCart}
                        className="cursor-pointer font-body text-xs uppercase tracking-widest font-semibold transition-opacity hover:opacity-50 active:scale-95 flex items-center gap-1"
                        style={{ color: DIM }}
                    >
                        <Trash2 className="w-3 h-3" />
                        Vaciar
                    </button>
                </div>

                <motion.div
                    initial="hidden"
                    animate="visible"
                    variants={stagger}
                    className="flex flex-col gap-3 mb-8"
                >
                    <AnimatePresence>
                        {items.map((item) => {
                            const key = item.cartKey || item.id;
                            return (
                                <motion.div
                                    key={key}
                                    variants={itemAnim}
                                    exit={itemAnim.exit}
                                    layout
                                    className="flex items-center gap-4 p-4 rounded-2xl"
                                    style={{ background: CARD, border: '1.5px solid rgba(45,106,45,0.30)' }}
                                >
                                    {/* Thumb */}
                                    <div
                                        className="w-16 h-16 rounded-xl overflow-hidden shrink-0 flex items-center justify-center"
                                        style={{ background: BONE, minWidth: '64px' }}
                                    >
                                        {item.image_url
                                            ? <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" loading="lazy" decoding="async" />
                                            : <ImageIcon className="w-5 h-5" style={{ color: DIM }} />
                                        }
                                    </div>

                                    {/* Info */}
                                    <div className="flex-1 min-w-0">
                                        <p className="font-display uppercase text-lg leading-tight truncate" style={{ color: BLACK }}>
                                            {item.name}{item.variantName ? ` (${item.variantName})` : ''}
                                        </p>
                                        <p className="font-body text-sm font-semibold mt-0.5" style={{ color: G }}>
                                            ${item.price.toLocaleString('es-AR')}
                                        </p>
                                    </div>

                                    {/* Qty pill */}
                                    <div
                                        className="flex items-center shrink-0"
                                        style={{ background: '#fff', borderRadius: '999px', gap: '0px', padding: '3px', boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}
                                    >
                                        <button
                                            onClick={() => updateQuantity(key, item.quantity - 1)}
                                            className="cursor-pointer w-11 h-11 flex items-center justify-center rounded-full transition-all active:scale-90 hover:bg-gray-50"
                                            style={{ color: BLACK, minWidth: '44px' }}
                                            aria-label={`Reducir ${item.name}`}
                                        >
                                            <Minus className="w-3 h-3" />
                                        </button>
                                        <span className="w-6 text-center font-bold text-sm select-none" style={{ color: BLACK }}>
                                            {item.quantity}
                                        </span>
                                        <button
                                            onClick={() => updateQuantity(key, item.quantity + 1)}
                                            className="cursor-pointer w-11 h-11 flex items-center justify-center rounded-full transition-all active:scale-90 hover:bg-gray-50"
                                            style={{ color: G, minWidth: '44px' }}
                                            aria-label={`Aumentar ${item.name}`}
                                        >
                                            <Plus className="w-3 h-3" />
                                        </button>
                                    </div>

                                    {/* Delete */}
                                    <button
                                        onClick={() => removeItem(key)}
                                        className="cursor-pointer w-8 h-8 flex items-center justify-center rounded-full transition-all active:scale-90 shrink-0"
                                        style={{ color: DIM }}
                                        aria-label={`Eliminar ${item.name}`}
                                    >
                                        <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                </motion.div>
                            );
                        })}
                    </AnimatePresence>

                    {/* Bebida */}
                    {!hasDrinks && (
                        <button
                            onClick={handleAddDrink}
                            className="cart-add-drink cursor-pointer w-full flex items-center justify-center gap-2 py-4 rounded-2xl font-body font-semibold text-xs uppercase tracking-widest transition-all active:scale-95"
                            style={{
                                background: 'transparent',
                                border: `1.5px dashed ${DIM}`,
                                color: MUTED,
                            }}
                        >
                            <Wine className="w-4 h-4 cart-drink-icon" style={{ color: G }} />
                            Agregar bebida
                        </button>
                    )}
                </motion.div>

                {/* ── Modalidad ────────────────── */}
                <div
                    className="rounded-2xl p-5 mb-4"
                    style={{ background: CARD, border: '1.5px solid rgba(45,106,45,0.30)' }}
                >
                    <p className="font-display uppercase text-xl mb-4" style={{ color: BLACK }}>
                        ¿Cómo lo recibís?
                    </p>
                    <div className="grid grid-cols-2 gap-3">
                        {[
                            { id: 'pickup',   label: 'Retiro en local',   Icon: Store },
                            { id: 'delivery', label: 'Envío a domicilio', Icon: Truck },
                        ].map(({ id, label, Icon }) => (
                            <button
                                key={id}
                                onClick={() => { setOrderType(id); if (id === 'pickup') { setGeoLocation(null); setGeoStatus('idle'); } }}
                                className="cursor-pointer flex flex-col items-center gap-2.5 py-5 rounded-2xl transition-all duration-200 active:scale-95"
                                style={orderType === id
                                    ? { background: G, color: '#fff', border: `1.5px solid ${G}` }
                                    : { background: '#fff', color: MUTED, border: '1.5px solid rgba(45,106,45,0.25)' }
                                }
                            >
                                <Icon className="w-5 h-5" />
                                <span className="font-body text-[11px] font-bold uppercase tracking-widest text-center leading-snug px-1">
                                    {label}
                                </span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* ── Formulario ───────────────── */}
                {orderType && (
                    <motion.div
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, ease: PREMIUM_EASE }}
                        className="rounded-2xl p-5 mb-8"
                        style={{ background: CARD, border: '1.5px solid rgba(45,106,45,0.30)' }}
                    >
                        <p className="font-display uppercase text-xl mb-5" style={{ color: BLACK }}>
                            Tus datos
                        </p>

                        <div className="flex flex-col gap-6">
                            {/* Nombre */}
                            <div>
                                <label className="flex items-center gap-1.5 font-body text-[10px] font-bold uppercase tracking-[0.22em] mb-1" style={{ color: G }}>
                                    <User className="w-3 h-3" style={{ color: G }} />
                                    Nombre *
                                </label>
                                <input
                                    type="text" name="name" value={checkoutForm.name} onChange={handleChange}
                                    placeholder="Ej: Juan Pérez"
                                    className={field(formErrors.name)}
                                />
                            </div>

                            {/* Dirección */}
                            {orderType === 'delivery' && (
                                <div className="flex flex-col gap-3 animate-fade-in">
                                    <div>
                                        <label className="flex items-center gap-1.5 font-body text-[10px] font-bold uppercase tracking-[0.22em] mb-1" style={{ color: G }}>
                                            <MapPin className="w-3 h-3" style={{ color: G }} />
                                            Dirección *
                                        </label>
                                        <input
                                            type="text" name="address" value={checkoutForm.address} onChange={handleChange}
                                            placeholder="Ej: Calle Paraguay 1234"
                                            className={field(formErrors.address)}
                                        />
                                    </div>
                                    <button
                                        type="button" onClick={handleGetLocation} disabled={geoStatus === 'loading'}
                                        className="cursor-pointer flex items-center justify-center gap-2 w-full py-3 rounded-xl font-body text-xs font-semibold uppercase tracking-widest transition-all"
                                        style={
                                            geoStatus === 'granted' ? { background: 'rgba(45,106,45,0.08)', color: G, border: `1px solid rgba(45,106,45,0.25)` }
                                            : geoStatus === 'error'  ? { background: 'rgba(239,68,68,0.05)', color: '#dc2626', border: '1px solid rgba(239,68,68,0.25)' }
                                            : { background: CARD, color: MUTED, border: '1.5px solid rgba(45,106,45,0.30)' }
                                        }
                                    >
                                        <LocateFixed className="w-3.5 h-3.5" />
                                        {geoStatus === 'loading' ? 'Obteniendo…'
                                         : geoStatus === 'granted' ? 'Ubicación obtenida ✓'
                                         : geoStatus === 'error'   ? 'No se pudo obtener'
                                         : 'Usar mi ubicación'}
                                    </button>
                                </div>
                            )}

                            {/* Pago */}
                            <div>
                                <label className="flex items-center gap-1.5 font-body text-[10px] font-bold uppercase tracking-[0.22em] mb-3" style={{ color: G }}>
                                    <CreditCard className="w-3 h-3" style={{ color: G }} />
                                    Medio de pago
                                </label>
                                <div className="grid grid-cols-2 gap-2">
                                    {['efectivo', 'transferencia'].map((m) => (
                                        <label
                                            key={m}
                                            className="cursor-pointer rounded-xl py-3 text-center transition-all font-body text-xs font-bold uppercase tracking-widest"
                                            style={checkoutForm.paymentMethod === m
                                                ? { background: G, color: '#fff', border: `1.5px solid ${G}` }
                                                : { background: '#fff', color: MUTED, border: '1.5px solid rgba(45,106,45,0.25)' }
                                            }
                                        >
                                            <input type="radio" name="paymentMethod" value={m} checked={checkoutForm.paymentMethod === m} onChange={handleChange} className="hidden" />
                                            {m}
                                        </label>
                                    ))}
                                </div>
                            </div>

                            {/* Notas */}
                            <div>
                                <label className="flex items-center gap-1.5 font-body text-[10px] font-bold uppercase tracking-[0.22em] mb-1" style={{ color: G }}>
                                    <AlignLeft className="w-3 h-3" style={{ color: G }} />
                                    Aclaraciones <span className="normal-case tracking-normal font-normal ml-1" style={{ color: DIM }}>(opcional)</span>
                                </label>
                                <textarea
                                    name="notes" value={checkoutForm.notes} onChange={handleChange}
                                    placeholder="Sin cebolla, sin mayonesa…" rows="2"
                                    className={`${field(false)} resize-none`}
                                />
                            </div>
                        </div>

                        {(formErrors.name || formErrors.address) && (
                            <p className="font-body text-red-500 text-xs font-semibold mt-4">
                                * Completá los campos requeridos
                            </p>
                        )}
                    </motion.div>
                )}

                {/* ── Total + CTA — solo desktop ── */}
                {orderType && (
                    <motion.div
                        className="hidden sm:block"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.2, duration: 0.4 }}
                    >
                        <div style={{ height: '1px', background: 'rgba(0,0,0,0.08)', margin: '8px 0 24px' }} />
                        <div className="flex items-baseline justify-between mb-6">
                            <span className="font-body text-sm uppercase tracking-widest font-semibold" style={{ color: MUTED }}>
                                Total
                            </span>
                            <span className="font-display leading-none" style={{ fontSize: 'clamp(2.8rem, 10vw, 4rem)', color: BLACK }}>
                                ${totalPrice.toLocaleString('es-AR')}
                            </span>
                        </div>
                        <button
                            onClick={handleCheckout}
                            className="cursor-pointer w-full py-4 rounded-full font-body font-bold text-sm uppercase tracking-widest flex items-center justify-center gap-2.5 transition-all active:scale-[0.98] hover:opacity-90"
                            style={{ background: '#25D366', color: '#fff' }}
                        >
                            <MessageCircle className="w-5 h-5" />
                            Pedir por WhatsApp
                        </button>
                        {orderType === 'delivery' && (
                            <p className="font-body text-[11px] text-center mt-3" style={{ color: DIM }}>
                                * El costo de envío se acuerda aparte.
                            </p>
                        )}
                    </motion.div>
                )}
            </div>

            {/* ── Sticky bar mobile ─────────────── */}
            {orderType && (
                <div
                    className="sm:hidden fixed bottom-0 left-0 right-0 z-[100] bg-white"
                    style={{
                        borderTop: '1px solid rgba(0,0,0,0.08)',
                        paddingBottom: 'max(12px, env(safe-area-inset-bottom))',
                    }}
                >
                    <div className="flex items-center gap-4 px-5 pt-3 max-w-2xl mx-auto">
                        <div className="shrink-0">
                            <p className="font-body text-[9px] uppercase tracking-widest font-bold" style={{ color: DIM }}>Total</p>
                            <p className="font-display text-2xl leading-none" style={{ color: BLACK }}>
                                ${totalPrice.toLocaleString('es-AR')}
                            </p>
                        </div>
                        <button
                            onClick={handleCheckout}
                            className="cursor-pointer flex-1 py-3.5 rounded-full font-body font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all active:scale-[0.97]"
                            style={{ background: '#25D366', color: '#fff' }}
                        >
                            <MessageCircle className="w-4 h-4" />
                            Pedir por WhatsApp
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
