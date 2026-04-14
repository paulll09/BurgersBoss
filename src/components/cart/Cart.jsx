import { useState } from 'react';
import { useCartStore } from '../../store/cartStore';
import { Minus, Plus, Trash2, ArrowLeft, MessageCircle, User, MapPin, CreditCard, AlignLeft, Wine, Store, Truck, LocateFixed, Image as ImageIcon } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

/* Contraste mejorado sobre fondo negro */
const LABEL_COLOR  = 'rgba(255,255,255,0.70)';
const SUBTLE_COLOR = 'rgba(255,255,255,0.45)';
const BORDER_COLOR = 'rgba(255,255,255,0.09)';

const inputCls = (err) =>
    `w-full min-w-0 border ${err ? 'border-primary ring-1 ring-primary/20' : 'border-border focus:border-border2'} rounded-xl px-4 py-3.5 text-text text-base outline-none transition-colors font-body`;

const inputStyle = { background: '#0f0f0f', color: '#f0f0f0' };

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

    /* ── Header ─────────────────────────────── */
    const PageHeader = ({ showClear }) => (
        <div className="relative w-full overflow-hidden" style={{ background: '#0a0a0a', borderBottom: `1px solid ${BORDER_COLOR}` }}>
            <Link
                to="/"
                className="absolute top-5 left-5 z-10 flex items-center justify-center w-10 h-10 rounded-full transition-all group"
                style={{ background: 'rgba(255,255,255,0.07)', border: `1px solid ${BORDER_COLOR}` }}
                aria-label="Volver al menú"
            >
                <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-all" style={{ color: LABEL_COLOR }} />
            </Link>

            {showClear && (
                <button
                    onClick={clearCart}
                    className="cursor-pointer absolute top-5 right-5 z-10 flex items-center gap-1.5 text-xs uppercase tracking-widest font-semibold transition-colors px-3 py-2.5 rounded-full"
                    style={{ color: SUBTLE_COLOR, background: 'rgba(255,255,255,0.05)', border: `1px solid ${BORDER_COLOR}` }}
                >
                    <Trash2 className="w-3.5 h-3.5" />
                    Vaciar
                </button>
            )}

            <div className="px-5 pt-16 pb-8">
                <div aria-label="Tu Pedido">
                    <span
                        className="block font-display uppercase select-none"
                        style={{ fontSize: 'clamp(3.2rem, 15vw, 7rem)', color: '#f0f0f0', letterSpacing: '-0.02em', lineHeight: 0.86 }}
                    >
                        TU
                    </span>
                    <span
                        className="block font-display uppercase select-none"
                        style={{ fontSize: 'clamp(2.2rem, 10vw, 5rem)', color: '#F59E0B', letterSpacing: '-0.01em', lineHeight: 0.9 }}
                    >
                        PEDIDO
                    </span>
                </div>
                <div className="flex items-center gap-3 mt-5">
                    <div style={{ height: '3px', width: '36px', background: '#F59E0B', borderRadius: '2px', flexShrink: 0 }} />
                    {showClear && (
                        <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: LABEL_COLOR }}>
                            {items.length} {items.length === 1 ? 'producto' : 'productos'}
                        </span>
                    )}
                </div>
            </div>
        </div>
    );

    /* ── Empty ───────────────────────────────── */
    if (items.length === 0) {
        return (
            <div className="min-h-screen animate-fade-in" style={{ background: '#0a0a0a' }}>
                <PageHeader showClear={false} />
                <div className="flex flex-col items-center justify-center py-20 px-4">
                    <div
                        className="w-20 h-20 rounded-full flex items-center justify-center mb-7"
                        style={{ background: 'rgba(255,255,255,0.06)', border: `1px solid ${BORDER_COLOR}` }}
                    >
                        <Trash2 className="w-8 h-8" style={{ color: SUBTLE_COLOR }} />
                    </div>
                    <h2 className="font-display text-4xl text-text uppercase mb-2">Carrito vacío</h2>
                    <p className="text-sm text-center mb-9 max-w-xs leading-relaxed" style={{ color: LABEL_COLOR }}>
                        Todavía no sumaste nada. Explorá el menú para armar tu pedido.
                    </p>
                    <Link
                        to="/"
                        className="flex items-center gap-2 px-7 py-3.5 rounded-full text-sm font-semibold uppercase tracking-widest transition-all hover:opacity-90 active:scale-95 group"
                        style={{ background: '#F59E0B', color: '#0a0a0a' }}
                    >
                        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
                        Ver el menú
                    </Link>
                </div>
            </div>
        );
    }

    /* ── Con productos ───────────────────────── */
    return (
        <div className="min-h-screen animate-fade-in" style={{ background: '#0a0a0a' }}>
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
                                style={{ animationDelay: `${i * 55}ms`, background: '#141414', border: `1px solid ${BORDER_COLOR}` }}
                            >
                                <div className="w-16 h-16 rounded-xl overflow-hidden shrink-0 flex items-center justify-center" style={{ background: '#1a1a1a' }}>
                                    {item.image_url
                                        ? <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                                        : <ImageIcon className="w-5 h-5" style={{ color: SUBTLE_COLOR }} />
                                    }
                                </div>
                                <div className="flex-grow min-w-0">
                                    <p className="font-display text-text text-lg uppercase leading-tight">
                                        {item.name}{item.variantName ? ` — ${item.variantName}` : ''}
                                    </p>
                                    <div className="flex items-center gap-1.5">
                                        <span className="text-amber text-sm font-semibold">${item.price.toLocaleString('es-AR')}</span>
                                        {item.originalPrice && item.originalPrice !== item.price && (
                                            <span className="text-xs line-through" style={{ color: SUBTLE_COLOR }}>${item.originalPrice.toLocaleString('es-AR')}</span>
                                        )}
                                    </div>
                                </div>
                                <div
                                    className="flex items-center gap-1 rounded-full p-0.5 shrink-0"
                                    style={{ background: '#1a1a1a', border: `1px solid ${BORDER_COLOR}` }}
                                >
                                    <button
                                        onClick={() => updateQuantity(key, item.quantity - 1)}
                                        aria-label={`Reducir cantidad de ${item.name}`}
                                        className="cursor-pointer w-9 h-9 flex items-center justify-center rounded-full hover:bg-surface2 hover:text-text transition-all active:scale-90"
                                        style={{ color: LABEL_COLOR }}
                                    >
                                        <Minus className="w-3.5 h-3.5" />
                                    </button>
                                    <span className="w-6 text-center text-text font-bold text-sm">{item.quantity}</span>
                                    <button
                                        onClick={() => updateQuantity(key, item.quantity + 1)}
                                        aria-label={`Aumentar cantidad de ${item.name}`}
                                        className="cursor-pointer w-9 h-9 flex items-center justify-center rounded-full hover:bg-surface2 hover:text-text transition-all active:scale-90"
                                        style={{ color: LABEL_COLOR }}
                                    >
                                        <Plus className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                                <button
                                    onClick={() => removeItem(key)}
                                    aria-label={`Eliminar ${item.name}`}
                                    className="cursor-pointer w-9 h-9 flex items-center justify-center rounded-full hover:text-primary hover:bg-primary/5 transition-all shrink-0"
                                    style={{ color: SUBTLE_COLOR }}
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
                            background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
                            color: 'rgba(255,255,255,0.90)',
                            border: `1px solid rgba(255,255,255,0.10)`,
                            boxShadow: '0 4px 16px rgba(0,0,0,0.25)',
                        }}
                    >
                        <Wine className="w-4 h-4" style={{ color: '#c084fc' }} />
                        Agregar Bebida
                    </button>
                )}

                {/* Modalidad de entrega */}
                <div
                    className="rounded-2xl p-5 sm:p-7 mb-4 animate-fade-up"
                    style={{ animationDelay: `${items.length * 55 + 70}ms`, background: '#141414', border: `1px solid ${BORDER_COLOR}` }}
                >
                    <h3
                        className="font-display text-text text-2xl uppercase mb-5 pb-4"
                        style={{ borderBottom: `1px solid ${BORDER_COLOR}` }}
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
                                    ? { border: '2px solid #F59E0B', background: 'rgba(245,158,11,0.08)', color: '#F59E0B' }
                                    : { border: `2px solid rgba(255,255,255,0.12)`, background: 'transparent', color: LABEL_COLOR }
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
                        style={{ background: '#141414', border: `1px solid ${BORDER_COLOR}` }}
                    >
                        <h3
                            className="font-display text-text text-2xl uppercase mb-5 pb-4"
                            style={{ borderBottom: `1px solid ${BORDER_COLOR}` }}
                        >
                            Tus datos
                        </h3>

                        <div className="space-y-4 mb-6">
                            {/* Nombre */}
                            <div>
                                <label className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-widest mb-2" style={{ color: LABEL_COLOR }}>
                                    <User className="w-3.5 h-3.5 text-primary" />
                                    Nombre <span className="text-primary">*</span>
                                </label>
                                <input
                                    type="text" name="name" value={checkoutForm.name} onChange={handleChange}
                                    placeholder="Ej: Juan Pérez"
                                    className={inputCls(formErrors.name)}
                                    style={{ ...inputStyle, '--tw-placeholder-color': SUBTLE_COLOR }}
                                />
                            </div>

                            {/* Dirección + geolocalización */}
                            {orderType === 'delivery' && (
                                <div className="flex flex-col gap-2.5 animate-fade-in">
                                    <div>
                                        <label className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-widest mb-2" style={{ color: LABEL_COLOR }}>
                                            <MapPin className="w-3.5 h-3.5 text-primary" />
                                            Dirección <span className="text-primary">*</span>
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
                                        className={`cursor-pointer flex items-center justify-center gap-2 w-full py-3 rounded-xl text-xs font-semibold uppercase tracking-widest transition-all border ${
                                            geoStatus === 'granted'
                                                ? 'border-green-500/40 bg-green-500/10 text-green-400'
                                                : geoStatus === 'error'
                                                ? 'border-primary/30 bg-primary/5 text-primary'
                                                : 'border-border bg-surface'
                                        }`}
                                        style={geoStatus === 'idle' || geoStatus === 'loading' ? { color: LABEL_COLOR } : undefined}
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
                                    <CreditCard className="w-3.5 h-3.5 text-primary" />
                                    Medio de Pago
                                </label>
                                <div className="grid grid-cols-2 gap-2">
                                    {['efectivo', 'transferencia'].map((m) => (
                                        <label
                                            key={m}
                                            className="cursor-pointer rounded-xl py-3 px-2 text-center transition-all text-[11px] font-semibold uppercase tracking-wide"
                                            style={checkoutForm.paymentMethod === m
                                                ? { background: '#F59E0B', color: '#0a0a0a' }
                                                : { background: '#1a1a1a', color: LABEL_COLOR, border: `1px solid rgba(255,255,255,0.10)` }
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
                                    <AlignLeft className="w-3.5 h-3.5 text-primary" />
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
                                    <span className="text-amber text-sm font-semibold">$</span>
                                    <span className="font-display font-bold text-text text-4xl leading-none">{totalPrice.toLocaleString('es-AR')}</span>
                                </div>
                            </div>
                            {(formErrors.name || formErrors.address) && (
                                <p className="text-primary text-xs font-semibold mb-4 text-center">Completá los campos requeridos (*)</p>
                            )}
                            <button
                                onClick={handleCheckout}
                                className="cursor-pointer w-full py-4 rounded-2xl font-semibold text-sm uppercase tracking-widest flex items-center justify-center gap-2.5 transition-all active:scale-[0.98]"
                                style={{ background: '#25D366', color: '#fff', boxShadow: '0 4px 20px rgba(37,211,102,0.28)' }}
                            >
                                <MessageCircle className="w-[18px] h-[18px]" />
                                Pedir por WhatsApp
                            </button>
                            <p className="text-xs text-center mt-4" style={{ color: SUBTLE_COLOR }}>Serás redirigido a WhatsApp para confirmar tu pedido.</p>
                            {orderType === 'delivery' && (
                                <p className="text-[11px] text-center mt-1" style={{ color: SUBTLE_COLOR }}>* El costo de envío se acuerda aparte.</p>
                            )}
                        </div>

                        {(formErrors.name || formErrors.address) && (
                            <div className="sm:hidden pt-4" style={{ borderTop: `1px solid ${BORDER_COLOR}` }}>
                                <p className="text-primary text-xs font-semibold text-center">Completá los campos requeridos (*)</p>
                            </div>
                        )}
                    </div>
                )}

                {/* Sticky bottom bar — mobile */}
                {orderType && (
                    <div
                        className="sm:hidden fixed bottom-0 left-0 right-0 z-[100] px-4 py-3"
                        style={{
                            background: '#111111',
                            borderTop: `1px solid rgba(255,255,255,0.10)`,
                            boxShadow: '0 -4px 24px rgba(0,0,0,0.55)',
                            paddingBottom: 'max(12px, env(safe-area-inset-bottom))',
                        }}
                    >
                        <div className="flex items-center gap-3">
                            <div>
                                <p className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: LABEL_COLOR }}>Total</p>
                                <div className="flex items-baseline gap-0.5">
                                    <span className="text-amber text-xs font-semibold">$</span>
                                    <span className="font-display font-bold text-text text-2xl leading-none">{totalPrice.toLocaleString('es-AR')}</span>
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
