import { useState } from 'react';
import { useCartStore } from '../../store/cartStore';
import { Minus, Plus, Trash2, ArrowLeft, MessageCircle, User, MapPin, CreditCard, AlignLeft, Wine, Store, Truck, LocateFixed, Image as ImageIcon } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

/* ── Paleta blanco + verde bosque ─────────────────── */
const FOREST       = '#2d6a2d';
const FOREST_DARK  = '#1a4a1a';
const LABEL_COLOR  = '#555555';
const SUBTLE_COLOR = 'rgba(0,0,0,0.32)';
const BORDER_COLOR = 'rgba(0,0,0,0.08)';
const PAGE_BG      = '#fafaf8';
const CARD_BG      = '#ffffff';
const INNER_BG     = '#f5f4f1';

const inputCls = (err) =>
    `w-full min-w-0 border ${err ? 'border-red-400 ring-1 ring-red-400/20' : 'border-[rgba(0,0,0,0.12)]'} rounded-xl px-4 py-3.5 text-base outline-none transition-colors font-body focus:border-[#2d6a2d]`;

const inputStyle = { background: '#ffffff', color: '#0a0a0a' };

export default function Cart() {
    const {
        items, removeItem, updateQuantity, getTotalPrice, clearCart,
        orderType, setOrderType,
        checkoutForm, setCheckoutForm,
    } = useCartStore();
    const totalPrice = getTotalPrice();
    const navigate = useNavigate();

    const hasDrinks = items.some(item => item.category_name?.toLowerCase().includes('bebida'));
    const handleAddDrink = () => navigate('/', { state: { scrollTo: 'bebida' } });

    const [formErrors, setFormErrors] = useState({});
    const [geoLocation, setGeoLocation] = useState(null);
    const [geoStatus, setGeoStatus] = useState('idle');

    const handleGetLocation = () => {
        if (!navigator.geolocation) { setGeoStatus('error'); return; }
        setGeoStatus('loading');
        navigator.geolocation.getCurrentPosition(
            (pos) => { setGeoLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }); setGeoStatus('granted'); },
            () => setGeoStatus('error'),
            { timeout: 8000 }
        );
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setCheckoutForm({ [name]: value });
        if (formErrors[name]) setFormErrors(prev => ({ ...prev, [name]: '' }));
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
        let text = `¡Hola! Soy *${checkoutForm.name.trim()}* y quiero hacer el siguiente pedido:\n\n`;
        items.forEach(item => {
            const displayName = item.variantName ? `${item.name} (${item.variantName})` : item.name;
            text += `• ${item.quantity}x ${displayName} — $${(item.price * item.quantity).toLocaleString('es-AR')}\n`;
        });
        text += orderType === 'delivery'
            ? `\n*TOTAL: $${totalPrice.toLocaleString('es-AR')} + envio*\n\n`
            : `\n*TOTAL: $${totalPrice.toLocaleString('es-AR')}*\n\n`;
        text += orderType === 'pickup'
            ? `🏠 *Modalidad:* Retiro en el local\n`
            : `🚚 *Modalidad:* Envío a domicilio\n`;
        if (orderType === 'delivery') {
            if (checkoutForm.address.trim()) text += `📍 *Dirección:* ${checkoutForm.address.trim()}\n`;
            if (geoLocation) text += `🗺️ *Ubicación exacta:* https://maps.google.com/?q=${geoLocation.lat},${geoLocation.lng}\n`;
        }
        const labels = { efectivo: 'Efectivo', transferencia: 'Transferencia' };
        text += `💳 *Pago:* ${labels[checkoutForm.paymentMethod]}\n`;
        if (checkoutForm.notes.trim()) text += `📝 *Aclaraciones:* ${checkoutForm.notes.trim()}\n`;
        window.open(`https://wa.me/${phone}?text=${encodeURIComponent(text)}`, '_blank');
        clearCart();
    };

    /* ── Header ──────────────────────────────── */
    const PageHeader = ({ showClear }) => (
        <div
            className="relative w-full overflow-hidden"
            style={{ background: CARD_BG, borderBottom: `1px solid ${BORDER_COLOR}` }}
        >
            <Link
                to="/"
                className="absolute top-5 left-5 z-10 flex items-center justify-center w-10 h-10 rounded-full transition-all group"
                style={{ background: 'rgba(45,106,45,0.09)', border: `1.5px solid rgba(45,106,45,0.22)` }}
                aria-label="Volver al menú"
            >
                <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-all" style={{ color: FOREST }} />
            </Link>

            {showClear && (
                <button
                    onClick={clearCart}
                    className="cursor-pointer absolute top-5 right-5 z-10 flex items-center gap-1.5 text-xs uppercase tracking-widest font-semibold transition-colors px-3 py-2.5 rounded-full"
                    style={{ color: '#c0392b', background: 'rgba(192,57,43,0.07)', border: `1px solid rgba(192,57,43,0.18)` }}
                >
                    <Trash2 className="w-3.5 h-3.5" />
                    Vaciar
                </button>
            )}

            <div className="px-5 pt-16 pb-8">
                <div aria-label="Tu Pedido">
                    <span
                        className="block font-display uppercase select-none"
                        style={{ fontSize: 'clamp(3.2rem, 15vw, 7rem)', color: '#0a0a0a', letterSpacing: '-0.02em', lineHeight: 0.86 }}
                    >
                        TU
                    </span>
                    <span
                        className="block font-display uppercase select-none"
                        style={{ fontSize: 'clamp(2.2rem, 10vw, 5rem)', color: FOREST, letterSpacing: '-0.01em', lineHeight: 0.9 }}
                    >
                        PEDIDO
                    </span>
                </div>
                <div className="flex items-center gap-3 mt-5">
                    <div style={{ height: '3px', width: '36px', background: FOREST, borderRadius: '2px', flexShrink: 0 }} />
                    {showClear && (
                        <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: LABEL_COLOR }}>
                            {items.length} {items.length === 1 ? 'producto' : 'productos'}
                        </span>
                    )}
                </div>
            </div>
        </div>
    );

    /* ── Empty ────────────────────────────────── */
    if (items.length === 0) {
        return (
            <div className="min-h-screen animate-fade-in" style={{ background: PAGE_BG }}>
                <PageHeader showClear={false} />
                <div className="flex flex-col items-center justify-center py-20 px-4">
                    <div
                        className="w-20 h-20 rounded-full flex items-center justify-center mb-7"
                        style={{ background: 'rgba(45,106,45,0.09)', border: `1.5px solid rgba(45,106,45,0.18)` }}
                    >
                        <Trash2 className="w-8 h-8" style={{ color: FOREST }} />
                    </div>
                    <h2 className="font-display text-4xl uppercase mb-2" style={{ color: '#0a0a0a' }}>Carrito vacío</h2>
                    <p className="text-sm text-center mb-9 max-w-xs leading-relaxed" style={{ color: LABEL_COLOR }}>
                        Todavía no sumaste nada. Explorá el menú para armar tu pedido.
                    </p>
                    <Link
                        to="/"
                        className="flex items-center gap-2 px-7 py-3.5 rounded-full text-sm font-semibold uppercase tracking-widest transition-all hover:opacity-90 active:scale-95 group"
                        style={{ background: FOREST, color: '#ffffff', boxShadow: '0 4px 20px rgba(45,106,45,0.30)' }}
                    >
                        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
                        Ver el menú
                    </Link>
                </div>
            </div>
        );
    }

    /* ── Con productos ────────────────────────── */
    return (
        <div className="min-h-screen animate-fade-in" style={{ background: PAGE_BG }}>
            <PageHeader showClear={true} />

            <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">

                {/* Items */}
                <div className="space-y-2.5 mb-7">
                    {items.map((item, i) => {
                        const key = item.cartKey || item.id;
                        return (
                            <div
                                key={key}
                                className="animate-fade-up flex items-center gap-3 p-3 rounded-2xl"
                                style={{
                                    animationDelay: `${i * 55}ms`,
                                    background: CARD_BG,
                                    border: `1px solid ${BORDER_COLOR}`,
                                    boxShadow: '0 1px 8px rgba(0,0,0,0.05)',
                                }}
                            >
                                <div
                                    className="w-16 h-16 rounded-xl overflow-hidden shrink-0 flex items-center justify-center"
                                    style={{ background: '#f0efed' }}
                                >
                                    {item.image_url
                                        ? <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                                        : <ImageIcon className="w-5 h-5" style={{ color: 'rgba(0,0,0,0.22)' }} />
                                    }
                                </div>
                                <div className="flex-grow min-w-0">
                                    <p className="font-display text-lg uppercase leading-tight" style={{ color: '#0a0a0a' }}>
                                        {item.name}{item.variantName ? ` — ${item.variantName}` : ''}
                                    </p>
                                    <div className="flex items-center gap-1.5">
                                        <span className="text-sm font-semibold" style={{ color: '#F59E0B' }}>
                                            ${item.price.toLocaleString('es-AR')}
                                        </span>
                                        {item.originalPrice && item.originalPrice !== item.price && (
                                            <span className="text-xs line-through" style={{ color: SUBTLE_COLOR }}>
                                                ${item.originalPrice.toLocaleString('es-AR')}
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <div
                                    className="flex items-center gap-1 rounded-full p-0.5 shrink-0"
                                    style={{ background: INNER_BG, border: `1px solid ${BORDER_COLOR}` }}
                                >
                                    <button
                                        onClick={() => updateQuantity(key, item.quantity - 1)}
                                        aria-label={`Reducir cantidad de ${item.name}`}
                                        className="cursor-pointer w-9 h-9 flex items-center justify-center rounded-full transition-all active:scale-90"
                                        style={{ color: FOREST }}
                                    >
                                        <Minus className="w-3.5 h-3.5" />
                                    </button>
                                    <span className="w-6 text-center font-bold text-sm" style={{ color: '#0a0a0a' }}>{item.quantity}</span>
                                    <button
                                        onClick={() => updateQuantity(key, item.quantity + 1)}
                                        aria-label={`Aumentar cantidad de ${item.name}`}
                                        className="cursor-pointer w-9 h-9 flex items-center justify-center rounded-full transition-all active:scale-90"
                                        style={{ color: FOREST }}
                                    >
                                        <Plus className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                                <button
                                    onClick={() => removeItem(key)}
                                    aria-label={`Eliminar ${item.name}`}
                                    className="cursor-pointer w-9 h-9 flex items-center justify-center rounded-full transition-all shrink-0 hover:bg-red-50"
                                    style={{ color: 'rgba(0,0,0,0.28)' }}
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        );
                    })}
                </div>

                {/* Agregar bebida */}
                {!hasDrinks && (
                    <button
                        onClick={handleAddDrink}
                        className="cursor-pointer w-full flex items-center justify-center gap-2.5 py-3.5 rounded-2xl mb-7 font-semibold text-sm uppercase tracking-widest transition-all active:scale-95 hover:opacity-90"
                        style={{
                            background: INNER_BG,
                            color: LABEL_COLOR,
                            border: `1px solid ${BORDER_COLOR}`,
                        }}
                    >
                        <Wine className="w-4 h-4" style={{ color: '#9c67c7' }} />
                        Agregar Bebida
                    </button>
                )}

                {/* Modalidad de entrega */}
                <div
                    className="rounded-2xl p-5 sm:p-7 mb-4 animate-fade-up"
                    style={{
                        animationDelay: `${items.length * 55 + 70}ms`,
                        background: CARD_BG,
                        border: `1px solid ${BORDER_COLOR}`,
                        boxShadow: '0 1px 8px rgba(0,0,0,0.05)',
                    }}
                >
                    <h3
                        className="font-display text-2xl uppercase mb-5 pb-4"
                        style={{ color: '#0a0a0a', borderBottom: `1px solid ${BORDER_COLOR}` }}
                    >
                        ¿Cómo recibís tu pedido?
                    </h3>
                    <div className="grid grid-cols-2 gap-3">
                        {[
                            { id: 'pickup', label: 'Retirar del local', Icon: Store },
                            { id: 'delivery', label: 'Envío a domicilio', Icon: Truck },
                        ].map(({ id, label, Icon }) => (
                            <button
                                key={id}
                                onClick={() => {
                                    setOrderType(id);
                                    if (id === 'pickup') { setGeoLocation(null); setGeoStatus('idle'); }
                                }}
                                className="cursor-pointer flex flex-col items-center gap-2.5 py-5 rounded-2xl transition-all duration-200 active:scale-95"
                                style={orderType === id
                                    ? { border: `2px solid ${FOREST}`, background: 'rgba(45,106,45,0.07)', color: FOREST }
                                    : { border: `2px solid rgba(0,0,0,0.10)`, background: INNER_BG, color: LABEL_COLOR }
                                }
                            >
                                <Icon className="w-6 h-6" />
                                <span className="text-[11px] font-bold uppercase tracking-widest text-center leading-snug px-2">{label}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Formulario de datos */}
                {orderType && (
                    <div
                        className="rounded-2xl p-5 sm:p-7 mb-4 animate-fade-in"
                        style={{
                            background: CARD_BG,
                            border: `1px solid ${BORDER_COLOR}`,
                            boxShadow: '0 1px 8px rgba(0,0,0,0.05)',
                        }}
                    >
                        <h3
                            className="font-display text-2xl uppercase mb-5 pb-4"
                            style={{ color: '#0a0a0a', borderBottom: `1px solid ${BORDER_COLOR}` }}
                        >
                            Tus datos
                        </h3>

                        <div className="space-y-4 mb-6">
                            {/* Nombre */}
                            <div>
                                <label className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-widest mb-2" style={{ color: LABEL_COLOR }}>
                                    <User className="w-3.5 h-3.5" style={{ color: FOREST }} />
                                    Nombre <span style={{ color: FOREST }}>*</span>
                                </label>
                                <input
                                    type="text" name="name" value={checkoutForm.name} onChange={handleChange}
                                    placeholder="Ej: Juan Pérez"
                                    className={inputCls(formErrors.name)}
                                    style={inputStyle}
                                />
                            </div>

                            {/* Dirección + geolocalización */}
                            {orderType === 'delivery' && (
                                <div className="flex flex-col gap-2.5 animate-fade-in">
                                    <div>
                                        <label className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-widest mb-2" style={{ color: LABEL_COLOR }}>
                                            <MapPin className="w-3.5 h-3.5" style={{ color: FOREST }} />
                                            Dirección <span style={{ color: FOREST }}>*</span>
                                        </label>
                                        <input
                                            type="text" name="address" value={checkoutForm.address} onChange={handleChange}
                                            placeholder="Ej: Calle Paraguay 1234"
                                            className={inputCls(formErrors.address)}
                                            style={inputStyle}
                                        />
                                    </div>
                                    <button
                                        type="button"
                                        onClick={handleGetLocation}
                                        disabled={geoStatus === 'loading'}
                                        className="cursor-pointer flex items-center justify-center gap-2 w-full py-3 rounded-xl text-xs font-semibold uppercase tracking-widest transition-all border"
                                        style={
                                            geoStatus === 'granted'
                                                ? { borderColor: 'rgba(45,106,45,0.35)', background: 'rgba(45,106,45,0.08)', color: FOREST }
                                                : geoStatus === 'error'
                                                ? { borderColor: 'rgba(192,57,43,0.25)', background: 'rgba(192,57,43,0.05)', color: '#c0392b' }
                                                : { borderColor: BORDER_COLOR, background: INNER_BG, color: LABEL_COLOR }
                                        }
                                    >
                                        <LocateFixed className="w-3.5 h-3.5" />
                                        {geoStatus === 'loading' ? 'Obteniendo ubicación…'
                                            : geoStatus === 'granted' ? 'Ubicación obtenida ✓'
                                            : geoStatus === 'error' ? 'No se pudo obtener la ubicación'
                                            : 'Compartir mi ubicación actual'}
                                    </button>
                                </div>
                            )}

                            {/* Medio de pago */}
                            <div>
                                <label className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-widest mb-2" style={{ color: LABEL_COLOR }}>
                                    <CreditCard className="w-3.5 h-3.5" style={{ color: FOREST }} />
                                    Medio de Pago
                                </label>
                                <div className="grid grid-cols-2 gap-2">
                                    {['efectivo', 'transferencia'].map((m) => (
                                        <label
                                            key={m}
                                            className="cursor-pointer rounded-xl py-3 px-2 text-center transition-all text-[11px] font-semibold uppercase tracking-wide"
                                            style={checkoutForm.paymentMethod === m
                                                ? { background: FOREST, color: '#ffffff', boxShadow: `0 3px 12px rgba(45,106,45,0.30)` }
                                                : { background: INNER_BG, color: LABEL_COLOR, border: `1px solid rgba(0,0,0,0.09)` }
                                            }
                                        >
                                            <input type="radio" name="paymentMethod" value={m} checked={checkoutForm.paymentMethod === m} onChange={handleChange} className="hidden" />
                                            {m}
                                        </label>
                                    ))}
                                </div>
                            </div>

                            {/* Aclaraciones */}
                            <div>
                                <label className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-widest mb-2" style={{ color: LABEL_COLOR }}>
                                    <AlignLeft className="w-3.5 h-3.5" style={{ color: FOREST }} />
                                    Aclaraciones
                                    <span className="normal-case tracking-normal font-normal ml-1" style={{ color: SUBTLE_COLOR }}>(opcional)</span>
                                </label>
                                <textarea
                                    name="notes" value={checkoutForm.notes} onChange={handleChange}
                                    placeholder="Sin cebolla, sin mayonesa etc..." rows="2"
                                    className={`${inputCls(false)} resize-none`}
                                    style={inputStyle}
                                />
                            </div>
                        </div>

                        {/* Total + botón — desktop */}
                        <div className="hidden sm:block pt-5" style={{ borderTop: `1px solid ${BORDER_COLOR}` }}>
                            <div className="flex justify-between items-end mb-5">
                                <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: LABEL_COLOR }}>Total</span>
                                <div className="flex items-baseline gap-1">
                                    <span className="text-sm font-semibold" style={{ color: '#F59E0B' }}>$</span>
                                    <span className="font-display font-bold text-4xl leading-none" style={{ color: '#0a0a0a' }}>
                                        {totalPrice.toLocaleString('es-AR')}
                                    </span>
                                </div>
                            </div>
                            {(formErrors.name || formErrors.address) && (
                                <p className="text-red-500 text-xs font-semibold mb-4 text-center">Completá los campos requeridos (*)</p>
                            )}
                            <button
                                onClick={handleCheckout}
                                className="cursor-pointer w-full py-4 rounded-2xl font-semibold text-sm uppercase tracking-widest flex items-center justify-center gap-2.5 transition-all active:scale-[0.98]"
                                style={{ background: '#25D366', color: '#fff', boxShadow: '0 4px 20px rgba(37,211,102,0.28)' }}
                            >
                                <MessageCircle className="w-[18px] h-[18px]" />
                                Pedir por WhatsApp
                            </button>
                            <p className="text-xs text-center mt-4" style={{ color: SUBTLE_COLOR }}>
                                Serás redirigido a WhatsApp para confirmar tu pedido.
                            </p>
                            {orderType === 'delivery' && (
                                <p className="text-[11px] text-center mt-1" style={{ color: SUBTLE_COLOR }}>
                                    * El costo de envío se acuerda aparte.
                                </p>
                            )}
                        </div>

                        {(formErrors.name || formErrors.address) && (
                            <div className="sm:hidden pt-4" style={{ borderTop: `1px solid ${BORDER_COLOR}` }}>
                                <p className="text-red-500 text-xs font-semibold text-center">Completá los campos requeridos (*)</p>
                            </div>
                        )}
                    </div>
                )}

                {/* Sticky bottom bar — mobile */}
                {orderType && (
                    <div
                        className="sm:hidden fixed bottom-0 left-0 right-0 z-[100] px-4 py-3"
                        style={{
                            background: CARD_BG,
                            borderTop: `1px solid ${BORDER_COLOR}`,
                            boxShadow: '0 -4px 24px rgba(0,0,0,0.10)',
                            paddingBottom: 'max(12px, env(safe-area-inset-bottom))',
                        }}
                    >
                        <div className="flex items-center gap-3">
                            <div>
                                <p className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: LABEL_COLOR }}>Total</p>
                                <div className="flex items-baseline gap-0.5">
                                    <span className="text-xs font-semibold" style={{ color: '#F59E0B' }}>$</span>
                                    <span className="font-display font-bold text-2xl leading-none" style={{ color: '#0a0a0a' }}>
                                        {totalPrice.toLocaleString('es-AR')}
                                    </span>
                                </div>
                                {orderType === 'delivery' && (
                                    <p className="text-[10px] mt-0.5" style={{ color: SUBTLE_COLOR }}>* Envío aparte</p>
                                )}
                            </div>
                            <button
                                onClick={handleCheckout}
                                className="cursor-pointer flex-1 py-3.5 rounded-xl font-semibold text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-colors active:scale-[0.97]"
                                style={{ background: '#25D366', color: '#fff', boxShadow: '0 4px 14px rgba(37,211,102,0.28)' }}
                            >
                                <MessageCircle className="w-4 h-4" />
                                Pedir por WhatsApp
                            </button>
                        </div>
                    </div>
                )}

                {orderType && <div className="sm:hidden h-28" />}
            </div>
        </div>
    );
}
