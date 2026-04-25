import { useContext, useState, useRef, useEffect, useCallback } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { useCartStore } from '../../store/cartStore';
import { Plus, Image as ImageIcon } from 'lucide-react';
import toast from 'react-hot-toast';
import { BarCtx } from '../../context/barCtx';
import { getEffectivePrice, hasDiscount, getEffectiveVariantPrice, variantHasDiscount } from '../../utils/price';
import { PREMIUM_EASE } from '../../lib/motion';

const FOREST      = '#2d6a2d';
const FOREST_DARK = '#1a4a1a';
const AMBER       = '#F59E0B';

const cardVariants = {
    hidden:  { opacity: 0, y: 32 },
    visible: {
        opacity: 1, y: 0,
        transition: { type: 'tween', duration: 0.55, ease: PREMIUM_EASE },
    },
};

export default function ProductCard({ product, categoryName, onOpenModal }) {
    const addItem    = useCartStore((s) => s.addItem);
    const { isOpen } = useContext(BarCtx);
    const [imgLoaded, setImgLoaded] = useState(false);
    const reduced    = useReducedMotion();

    const variants        = product.product_variants || [];
    const hasVariants     = variants.length > 0;
    const hasComboOptions = (product.combo_options?.length ?? 0) > 0;
    const isBurger        = hasVariants && (product.type === 'burger' || !product.type);
    const [expanded, setExpanded] = useState(false);
    const [showVariants, setShowVariants] = useState(false);
    const descRef = useRef(null);
    const [isClamped, setIsClamped] = useState(false);

    useEffect(() => {
        const el = descRef.current;
        if (!el) return;
        // Defer layout read al siguiente frame — evita forced sync layout
        // en el mount inicial (clave cuando hay muchos cards en la grid).
        const raf = requestAnimationFrame(() => {
            setIsClamped(el.scrollHeight > el.clientHeight + 2);
        });
        return () => cancelAnimationFrame(raf);
    }, [product.description]);

    const handleAdd = useCallback((e) => {
        e.stopPropagation();
        if ((isBurger || hasComboOptions) && onOpenModal) { onOpenModal(); return; }
        const price = getEffectivePrice(product);
        addItem({ ...product, category_name: categoryName, price, originalPrice: product.price });
        toast.success(`${product.name} agregado`);
    }, [isBurger, hasComboOptions, onOpenModal, product, categoryName, addItem]);

    const handleAddVariant = useCallback((e, variant) => {
        e.stopPropagation();
        const price = getEffectiveVariantPrice(variant);
        addItem({ ...product, category_name: categoryName }, { ...variant, price, originalPrice: variant.price });
        toast.success(`${product.name} (${variant.name}) agregado`);
    }, [product, categoryName, addItem]);

    return (
        <motion.div
            style={{
                background: '#ffffff',
                borderRadius: '20px',
                overflow: 'hidden',
                boxShadow: '0 4px 24px rgba(0,0,0,0.08), 0 1px 4px rgba(0,0,0,0.05)',
                transform: 'translateZ(0)',
            }}
            variants={reduced ? undefined : cardVariants}
        >
            {/* ── Imagen cuadrada 1:1 ─────────────────── */}
            <div style={{ position: 'relative', aspectRatio: '1/1', width: '100%', background: '#ffffff', overflow: 'hidden' }}>
                {product.image_url ? (
                    <>
                        {/* Skeleton */}
                        {!imgLoaded && (
                            <div
                                className="absolute inset-0"
                                style={{
                                    background: 'linear-gradient(110deg, #ece9e4 30%, #f5f3ef 50%, #ece9e4 70%)',
                                    backgroundSize: '200% 100%',
                                    animation: 'shimmer 1.6s ease-in-out infinite',
                                }}
                            />
                        )}
                        <img
                            src={product.image_url}
                            alt={product.name}
                            loading="lazy"
                            decoding="async"
                            onLoad={() => setImgLoaded(true)}
                            draggable="false"
                            style={{
                                width: '100%',
                                height: '100%',
                                objectFit: 'cover',
                                objectPosition: 'center',
                                display: 'block',
                                opacity: imgLoaded ? 1 : 0,
                                transition: 'opacity 0.4s ease',
                            }}
                        />
                    </>
                ) : (
                    <div className="w-full h-full flex items-center justify-center" style={{ color: 'rgba(0,0,0,0.15)' }}>
                        <ImageIcon className="w-14 h-14" />
                    </div>
                )}

                {/* Badge descuento */}
                {!hasVariants && hasDiscount(product) && (
                    <div
                        className="absolute top-3 left-3 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full"
                        style={{ background: AMBER, color: '#0a0a0a', boxShadow: '0 2px 8px rgba(245,158,11,0.40)' }}
                    >
                        -{product.discount}%
                    </div>
                )}
                {hasVariants && variants.some(v => variantHasDiscount(v)) && (
                    <div
                        className="absolute top-3 left-3 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full"
                        style={{ background: AMBER, color: '#0a0a0a', boxShadow: '0 2px 8px rgba(245,158,11,0.40)' }}
                    >
                        PROMO
                    </div>
                )}
            </div>

            {/* ── Info — nombre + precio ───────────────── */}
            <div style={{ padding: '14px 16px 16px' }}>

                <h3
                    className="font-display uppercase leading-tight"
                    style={{
                        fontSize: 'clamp(1.6rem, 6vw, 2rem)',
                        color: '#111111',
                        letterSpacing: '0.02em',
                        marginBottom: product.description ? '4px' : '10px',
                    }}
                >
                    {product.name}
                </h3>

                {/* ── Descripción con truncado ── */}
                {product.description && (
                    <div style={{ marginBottom: '10px' }}>
                        <p
                            ref={descRef}
                            className="font-body"
                            style={{
                                fontSize: '0.82rem',
                                color: 'rgba(0,0,0,0.52)',
                                lineHeight: 1.70,
                                display: '-webkit-box',
                                WebkitLineClamp: expanded ? 'unset' : 2,
                                WebkitBoxOrient: 'vertical',
                                overflow: expanded ? 'visible' : 'hidden',
                            }}
                        >
                            {product.description}
                        </p>
                        {isClamped && !expanded && (
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    if ((isBurger || hasComboOptions) && onOpenModal) { onOpenModal(); }
                                    else { setExpanded(true); }
                                }}
                                style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', marginTop: '2px' }}
                            >
                                <span className="font-body font-semibold" style={{ fontSize: '0.76rem', color: '#2d6a2d', textDecoration: 'underline', textUnderlineOffset: '2px' }}>
                                    Ver más
                                </span>
                            </button>
                        )}
                        {expanded && !isBurger && (
                            <button
                                onClick={(e) => { e.stopPropagation(); setExpanded(false); }}
                                style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', marginTop: '2px' }}
                            >
                                <span className="font-body font-semibold" style={{ fontSize: '0.76rem', color: '#2d6a2d', textDecoration: 'underline', textUnderlineOffset: '2px' }}>
                                    Ver menos
                                </span>
                            </button>
                        )}
                    </div>
                )}

                {/* ── Burger con variantes → modal maneja todo ── */}
                {isBurger && hasVariants && (
                    <div className="flex items-center justify-between">
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                            <span className="font-body" style={{ fontSize: '0.62rem', color: 'rgba(0,0,0,0.38)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.14em' }}>Desde</span>
                            <span
                                className="font-display"
                                style={{
                                    display: 'inline-block',
                                    background: FOREST_DARK,
                                    color: '#ffffff',
                                    borderRadius: '999px',
                                    padding: '4px 14px',
                                    fontSize: '1.3rem',
                                    letterSpacing: '0.02em',
                                    lineHeight: 1.2,
                                }}
                            >
                                ${Math.min(...variants.map(v => getEffectiveVariantPrice(v))).toLocaleString('es-AR')}
                            </span>
                        </div>
                        {isOpen && (
                            <button
                                onClick={handleAdd}
                                className="add-btn cursor-pointer flex items-center justify-center rounded-full text-white active:scale-90"
                                style={{ width: '42px', height: '42px', background: FOREST_DARK, boxShadow: '0 4px 14px rgba(26,74,26,0.35)', border: 'none', flexShrink: 0 }}
                                aria-label={`Agregar ${product.name}`}
                            >
                                <Plus className="w-5 h-5" strokeWidth={2.5} />
                            </button>
                        )}
                    </div>
                )}

                {/* ── Sin variantes (cualquier tipo sin variantes) ── */}
                {!hasVariants && (
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <span
                                className="font-display"
                                style={{
                                    display: 'inline-block',
                                    background: FOREST_DARK,
                                    color: '#ffffff',
                                    borderRadius: '999px',
                                    padding: '4px 14px',
                                    fontSize: '1.3rem',
                                    letterSpacing: '0.02em',
                                    lineHeight: 1.2,
                                }}
                            >
                                ${getEffectivePrice(product).toLocaleString('es-AR')}
                            </span>
                            {hasDiscount(product) && (
                                <span className="font-body text-xs line-through" style={{ color: 'rgba(0,0,0,0.28)' }}>
                                    ${product.price.toLocaleString('es-AR')}
                                </span>
                            )}
                        </div>
                        {isOpen && (
                            <button
                                onClick={handleAdd}
                                className="add-btn cursor-pointer flex items-center justify-center rounded-full text-white active:scale-90"
                                style={{
                                    width: '42px', height: '42px',
                                    background: FOREST_DARK,
                                    boxShadow: '0 4px 14px rgba(26,74,26,0.35)',
                                    border: 'none',
                                    flexShrink: 0,
                                }}
                                aria-label={`Agregar ${product.name}`}
                            >
                                <Plus className="w-5 h-5" strokeWidth={2.5} />
                            </button>
                        )}
                    </div>
                )}

                {/* ── Con variantes (solo para no-burgers) — colapsable ── */}
                {hasVariants && !isBurger && !showVariants && (
                    <div className="flex items-center justify-between">
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                            <span className="font-body" style={{ fontSize: '0.62rem', color: 'rgba(0,0,0,0.38)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.14em' }}>Desde</span>
                            <span
                                className="font-display"
                                style={{
                                    display: 'inline-block',
                                    background: FOREST_DARK,
                                    color: '#ffffff',
                                    borderRadius: '999px',
                                    padding: '4px 14px',
                                    fontSize: '1.3rem',
                                    letterSpacing: '0.02em',
                                    lineHeight: 1.2,
                                }}
                            >
                                ${Math.min(...variants.map(v => getEffectiveVariantPrice(v))).toLocaleString('es-AR')}
                            </span>
                        </div>
                        {isOpen && (
                            <button
                                onClick={(e) => { e.stopPropagation(); setShowVariants(true); }}
                                className="add-btn cursor-pointer flex items-center justify-center rounded-full text-white active:scale-90"
                                style={{ width: '42px', height: '42px', background: FOREST_DARK, boxShadow: '0 4px 14px rgba(26,74,26,0.35)', border: 'none', flexShrink: 0 }}
                                aria-label={`Ver opciones de ${product.name}`}
                            >
                                <Plus className="w-5 h-5" strokeWidth={2.5} />
                            </button>
                        )}
                    </div>
                )}

                {hasVariants && !isBurger && showVariants && (
                    <div className="flex flex-col gap-2">
                        <div className="flex items-center justify-between" style={{ marginBottom: '4px' }}>
                            <span className="font-body font-semibold" style={{ fontSize: '0.72rem', color: 'rgba(0,0,0,0.45)', textTransform: 'uppercase', letterSpacing: '0.12em' }}>
                                Elegí tu opción
                            </span>
                            <button
                                onClick={(e) => { e.stopPropagation(); setShowVariants(false); }}
                                style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}
                            >
                                <span className="font-body font-semibold" style={{ fontSize: '0.72rem', color: FOREST, textDecoration: 'underline', textUnderlineOffset: '2px' }}>
                                    Cerrar
                                </span>
                            </button>
                        </div>
                        {variants.map((variant, vIdx) => {
                            const effPrice     = getEffectiveVariantPrice(variant);
                            const vHasDiscount = variantHasDiscount(variant);
                            return (
                                <div
                                    key={variant.id}
                                    className="flex items-center justify-between gap-2"
                                    style={{
                                        paddingTop: vIdx === 0 ? 0 : '8px',
                                        borderTop: vIdx === 0 ? 'none' : '1px solid rgba(0,0,0,0.06)',
                                    }}
                                >
                                    <div className="flex items-center gap-2 min-w-0">
                                        <span style={{ width: 5, height: 5, borderRadius: '50%', background: FOREST, opacity: 0.45, flexShrink: 0 }} />
                                        <span className="font-body text-sm font-medium truncate" style={{ color: '#444444' }}>
                                            {variant.name}
                                        </span>
                                        {vHasDiscount && (
                                            <span
                                                className="text-[10px] font-bold px-1.5 py-0.5 rounded-full shrink-0"
                                                style={{ background: 'rgba(245,158,11,0.12)', color: AMBER, border: '1px solid rgba(245,158,11,0.25)' }}
                                            >
                                                -{variant.discount}%
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-2.5 shrink-0">
                                        <div className="flex flex-col items-end">
                                            <span className="font-display" style={{ fontSize: '1.1rem', color: '#111111', lineHeight: 1 }}>
                                                ${effPrice.toLocaleString('es-AR')}
                                            </span>
                                            {vHasDiscount && (
                                                <span className="font-body text-[10px] line-through" style={{ color: 'rgba(0,0,0,0.28)' }}>
                                                    ${variant.price.toLocaleString('es-AR')}
                                                </span>
                                            )}
                                        </div>
                                        {isOpen && (
                                            <button
                                                onClick={(e) => handleAddVariant(e, variant)}
                                                className="add-btn cursor-pointer flex items-center justify-center rounded-full text-white active:scale-90"
                                                style={{
                                                    width: '38px', height: '38px',
                                                    background: FOREST_DARK,
                                                    boxShadow: '0 3px 10px rgba(26,74,26,0.30)',
                                                    border: 'none',
                                                    flexShrink: 0,
                                                }}
                                                aria-label={`Agregar ${product.name} ${variant.name}`}
                                            >
                                                <Plus className="w-4 h-4" strokeWidth={2.5} />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </motion.div>
    );
}
