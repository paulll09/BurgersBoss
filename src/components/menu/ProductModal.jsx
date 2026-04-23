import { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
import { X, Plus, Check } from 'lucide-react';
import toast from 'react-hot-toast';
import { useCartStore } from '../../store/cartStore';
import { getEffectivePrice, getEffectiveVariantPrice } from '../../utils/price';

const FOREST = '#1a4a1a';

export default function ProductModal({ product, extras, onClose }) {
    const addBurger = useCartStore(s => s.addBurger);

    const variants    = product.product_variants || [];
    const hasVariants = variants.length > 0;

    const [selectedVariant, setSelectedVariant] = useState(hasVariants ? variants[0] : null);
    const [selectedExtras,  setSelectedExtras]  = useState([]);

    /* Scroll lock */
    useEffect(() => {
        const prev = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        return () => { document.body.style.overflow = prev; };
    }, []);

    const basePrice   = hasVariants
        ? (selectedVariant ? getEffectiveVariantPrice(selectedVariant) : 0)
        : getEffectivePrice(product);
    const extrasTotal = selectedExtras.reduce((s, e) => s + Number(e.price), 0);
    const totalPrice  = basePrice + extrasTotal;

    const toggleExtra = useCallback((extra) => {
        setSelectedExtras(prev =>
            prev.some(e => e.id === extra.id)
                ? prev.filter(e => e.id !== extra.id)
                : [...prev, extra]
        );
    }, []);

    const handleAdd = () => {
        if (hasVariants && !selectedVariant) { toast.error('Elegí una variante'); return; }
        addBurger(product, selectedVariant, selectedExtras);
        toast.success(`${product.name} agregado al pedido`);
        onClose();
    };

    return createPortal(
        <div
            style={{ position: 'fixed', inset: 0, zIndex: 60, display: 'flex', alignItems: 'flex-end' }}
            role="dialog"
            aria-modal="true"
            aria-label={`Agregar ${product.name}`}
        >
            {/* Backdrop */}
            <motion.div
                onClick={onClose}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0, transition: { duration: 0.2 } }}
                transition={{ duration: 0.25 }}
                style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.60)', backdropFilter: 'blur(3px)', WebkitBackdropFilter: 'blur(3px)' }}
            />

            {/* Bottom sheet */}
            <motion.div
                initial={{ y: '100%' }}
                animate={{ y: 0, transition: { type: 'spring', damping: 32, stiffness: 300 } }}
                exit={{ y: '100%', transition: { duration: 0.24, ease: [0.32, 0, 0.67, 0] } }}
                style={{
                    position: 'relative', zIndex: 1,
                    width: '100%', maxHeight: '90dvh',
                    background: '#fff',
                    borderRadius: '24px 24px 0 0',
                    overflowY: 'auto',
                    WebkitOverflowScrolling: 'touch',
                    paddingBottom: 'env(safe-area-inset-bottom)',
                }}
            >
                {/* Imagen */}
                <div style={{ position: 'relative', width: '100%', aspectRatio: '4/3', overflow: 'hidden', background: '#f0efed', flexShrink: 0 }}>
                    {product.image_url
                        ? <img src={product.image_url} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center', display: 'block' }} />
                        : <div style={{ width: '100%', height: '100%', background: '#ece9e4' }} />
                    }
                    {/* Botón cerrar */}
                    <button
                        onClick={onClose}
                        aria-label="Cerrar"
                        style={{
                            position: 'absolute', top: 12, right: 12,
                            width: 36, height: 36, borderRadius: '50%',
                            background: 'rgba(0,0,0,0.52)', border: 'none',
                            color: '#fff', cursor: 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}
                    >
                        <X style={{ width: 18, height: 18 }} />
                    </button>
                </div>

                {/* Contenido */}
                <div style={{ padding: '20px 20px 100px' }}>

                    {/* Nombre + badge papas */}
                    <h2
                        className="font-display uppercase"
                        style={{ fontSize: 'clamp(2rem, 8vw, 2.8rem)', color: '#111', lineHeight: 1.1, letterSpacing: '0.02em', marginBottom: 8 }}
                    >
                        {product.name}
                    </h2>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: 'rgba(45,106,45,0.10)', borderRadius: 999, padding: '4px 10px', marginBottom: 22 }}>
                        <Check style={{ width: 11, height: 11, color: '#2d6a2d' }} strokeWidth={3} />
                        <span className="font-body" style={{ fontSize: '0.72rem', color: '#2d6a2d', fontWeight: 600 }}>Incluye papas</span>
                    </div>

                    {/* Descripción completa */}
                    {product.description && (
                        <p
                            className="font-body"
                            style={{
                                fontSize: '0.85rem',
                                color: 'rgba(0,0,0,0.52)',
                                lineHeight: 1.75,
                                marginBottom: 22,
                            }}
                        >
                            {product.description}
                        </p>
                    )}

                    {/* Selector de variantes */}
                    {hasVariants && (
                        <div style={{ marginBottom: 24 }}>
                            <p className="font-body" style={{ fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.20em', color: 'rgba(0,0,0,0.40)', textTransform: 'uppercase', marginBottom: 10 }}>
                                Elegí el tamaño
                            </p>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                {variants.map(v => {
                                    const price    = getEffectiveVariantPrice(v);
                                    const selected = selectedVariant?.id === v.id;
                                    return (
                                        <button
                                            key={v.id}
                                            onClick={() => setSelectedVariant(v)}
                                            style={{
                                                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                                padding: '12px 14px', borderRadius: 14,
                                                border: `2px solid ${selected ? FOREST : 'rgba(0,0,0,0.10)'}`,
                                                background: selected ? 'rgba(26,74,26,0.05)' : '#fff',
                                                cursor: 'pointer', transition: 'all 0.15s ease',
                                            }}
                                        >
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                                <div style={{
                                                    width: 18, height: 18, borderRadius: '50%',
                                                    border: `2px solid ${selected ? FOREST : 'rgba(0,0,0,0.22)'}`,
                                                    background: selected ? FOREST : 'transparent',
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                                                    transition: 'all 0.15s ease',
                                                }}>
                                                    {selected && <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#fff' }} />}
                                                </div>
                                                <span className="font-body" style={{ fontWeight: 600, color: '#111', fontSize: '0.95rem' }}>{v.name}</span>
                                            </div>
                                            <span className="font-display" style={{ fontSize: '1.15rem', color: selected ? FOREST : '#333' }}>
                                                ${price.toLocaleString('es-AR')}
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Extras */}
                    {extras.length > 0 && (
                        <div>
                            <p className="font-body" style={{ fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.20em', color: 'rgba(0,0,0,0.40)', textTransform: 'uppercase', marginBottom: 10 }}>
                                Extras{' '}
                                <span style={{ color: 'rgba(0,0,0,0.28)', fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>(opcional)</span>
                            </p>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                {extras.map(extra => {
                                    const selected = selectedExtras.some(e => e.id === extra.id);
                                    return (
                                        <button
                                            key={extra.id}
                                            onClick={() => toggleExtra(extra)}
                                            style={{
                                                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                                padding: '12px 14px', borderRadius: 14, textAlign: 'left',
                                                border: `2px solid ${selected ? FOREST : 'rgba(0,0,0,0.10)'}`,
                                                background: selected ? 'rgba(26,74,26,0.05)' : '#fff',
                                                cursor: 'pointer', transition: 'all 0.15s ease',
                                            }}
                                        >
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 0 }}>
                                                <div style={{
                                                    width: 20, height: 20, borderRadius: 6, flexShrink: 0,
                                                    border: `2px solid ${selected ? FOREST : 'rgba(0,0,0,0.20)'}`,
                                                    background: selected ? FOREST : 'transparent',
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    transition: 'all 0.15s ease',
                                                }}>
                                                    {selected && <Check style={{ width: 11, height: 11, color: '#fff' }} strokeWidth={3} />}
                                                </div>
                                                <div style={{ minWidth: 0 }}>
                                                    <p className="font-body" style={{ fontWeight: 600, color: '#111', fontSize: '0.90rem', lineHeight: 1.2 }}>
                                                        {extra.name}
                                                    </p>
                                                    {extra.description && (
                                                        <p style={{ fontSize: '0.74rem', color: 'rgba(0,0,0,0.42)', marginTop: 2 }}>{extra.description}</p>
                                                    )}
                                                </div>
                                            </div>
                                            <span className="font-display shrink-0" style={{ fontSize: '1rem', color: selected ? FOREST : '#444', marginLeft: 12 }}>
                                                +${Number(extra.price).toLocaleString('es-AR')}
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>

                {/* CTA fijo en la parte inferior */}
                <div style={{
                    position: 'sticky', bottom: 0,
                    padding: '12px 20px 16px',
                    background: '#fff',
                    borderTop: '1px solid rgba(0,0,0,0.07)',
                }}>
                    <button
                        onClick={handleAdd}
                        style={{
                            width: '100%',
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                            background: FOREST, color: '#fff',
                            border: 'none', borderRadius: 16,
                            padding: '15px 20px',
                            cursor: 'pointer',
                            boxShadow: '0 4px 20px rgba(26,74,26,0.30)',
                        }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <Plus style={{ width: 18, height: 18 }} strokeWidth={2.5} />
                            <span className="font-display uppercase" style={{ fontSize: '1rem', letterSpacing: '0.06em' }}>
                                Agregar al pedido
                            </span>
                        </div>
                        <span className="font-display" style={{ fontSize: '1.2rem' }}>
                            ${totalPrice.toLocaleString('es-AR')}
                        </span>
                    </button>
                </div>
            </motion.div>
        </div>,
        document.body
    );
}
