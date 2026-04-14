import { useContext, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { useCartStore } from '../../store/cartStore';
import { Plus, Image as ImageIcon } from 'lucide-react';
import toast from 'react-hot-toast';
import { BarCtx } from '../../context/barCtx';
import { getEffectivePrice, hasDiscount, getEffectiveVariantPrice, variantHasDiscount } from '../../utils/price';
import { PREMIUM_EASE, VIEWPORT } from '../../lib/motion';

/* ── Paleta limpia ──────────────────────────── */
const FOREST       = '#2d6a2d';
const FOREST_DARK  = '#1a4a1a';
const AMBER        = '#F59E0B';   /* solo badges descuento */
const CARD_BG      = '#ffffff';
const CARD_SURFACE = '#f0efed';

/* ── Variantes — solo transform + opacity (GPU) ── */
const cardVariants = {
    hidden:  { opacity: 0, y: 44, scale: 0.97 },
    visible: {
        opacity: 1, y: 0, scale: 1,
        transition: { type: 'tween', duration: 0.60, ease: PREMIUM_EASE },
    },
};

const imgZoomVariants = {
    hidden:  { scale: 1.10 },
    visible: {
        scale: 1,
        transition: { type: 'tween', duration: 0.70, ease: PREMIUM_EASE, delay: 0.05 },
    },
};

export default function ProductCard({ product, categoryName }) {
    const addItem   = useCartStore((s) => s.addItem);
    const { isOpen } = useContext(BarCtx);
    const [imgLoaded, setImgLoaded] = useState(false);
    const reduced = useReducedMotion();

    const variants    = product.product_variants || [];
    const hasVariants = variants.length > 0;

    const handleAdd = (e) => {
        e.stopPropagation();
        const price = getEffectivePrice(product);
        addItem({ ...product, category_name: categoryName, price, originalPrice: product.price });
        toast.success(`${product.name} agregado`);
    };

    const handleAddVariant = (e, variant) => {
        e.stopPropagation();
        const price = getEffectiveVariantPrice(variant);
        addItem({ ...product, category_name: categoryName }, { ...variant, price });
        toast.success(`${product.name} (${variant.name}) agregado`);
    };

    return (
        <motion.div
            className="overflow-hidden rounded-3xl"
            style={{
                background: CARD_BG,
                border: '1px solid rgba(45,106,45,0.12)',
                boxShadow: '0 10px 40px rgba(0,0,0,0.14), 0 2px 8px rgba(0,0,0,0.08)',
                transform: 'translateZ(0)',
                backfaceVisibility: 'hidden',
                WebkitBackfaceVisibility: 'hidden',
            }}
            variants={cardVariants}
            initial={reduced ? 'visible' : 'hidden'}
            whileInView="visible"
            viewport={VIEWPORT}
        >
            {/* ── Imagen — limpia, sin overlays ────── */}
            <div
                className="relative w-full overflow-hidden"
                style={{ aspectRatio: '16/9', background: CARD_SURFACE }}
            >
                {product.image_url ? (
                    <>
                        {/* Skeleton mientras carga */}
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
                        {/* Zoom-out de entrada — efecto pop */}
                        <motion.div
                            className="w-full h-full"
                            style={{
                                backfaceVisibility: 'hidden',
                                WebkitBackfaceVisibility: 'hidden',
                            }}
                            variants={reduced ? {} : imgZoomVariants}
                            initial={reduced ? undefined : 'hidden'}
                            whileInView={reduced ? undefined : 'visible'}
                            viewport={VIEWPORT}
                        >
                            <img
                                src={product.image_url}
                                alt={product.name}
                                loading="lazy"
                                decoding="async"
                                onLoad={() => setImgLoaded(true)}
                                draggable="false"
                                className="w-full h-full object-cover"
                                style={{
                                    opacity: imgLoaded ? 1 : 0,
                                    transition: 'opacity 0.45s ease',
                                    display: 'block',
                                }}
                            />
                        </motion.div>
                    </>
                ) : (
                    <div
                        className="w-full h-full flex items-center justify-center"
                        style={{ color: 'rgba(0,0,0,0.18)' }}
                    >
                        <ImageIcon className="w-12 h-12" />
                    </div>
                )}

                {/* Badge — ámbar, único acento cálido */}
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

            {/* ── Panel info — borde verde bosque ─── */}
            <div style={{ borderTop: `3px solid ${FOREST}` }}>
                <div className="px-4 pt-3.5 pb-4">

                    {/* Nombre — Bebas Neue, blanco */}
                    <h3
                        className="font-display uppercase leading-tight"
                        style={{
                            fontSize: 'clamp(1.35rem, 5vw, 1.65rem)',
                            color: '#111111',
                            letterSpacing: '0.01em',
                        }}
                    >
                        {product.name}
                    </h3>

                    {/* Descripción — DM Sans, tenue */}
                    {product.description && (
                        <p
                            className="font-body text-[13px] leading-snug mt-1 line-clamp-1"
                            style={{ color: '#666666' }}
                        >
                            {product.description}
                        </p>
                    )}

                    {/* ── Sin variantes ──────────────── */}
                    {!hasVariants && (
                        <div
                            className="flex items-center justify-between mt-3 pt-3"
                            style={{ borderTop: '1px solid rgba(0,0,0,0.08)' }}
                        >
                            <div className="flex items-baseline gap-2">
                                <span
                                    className="font-display leading-none"
                                    style={{ fontSize: '1.6rem', color: '#111111', letterSpacing: '-0.01em' }}
                                >
                                    ${getEffectivePrice(product).toLocaleString('es-AR')}
                                </span>
                                {hasDiscount(product) && (
                                    <span
                                        className="font-body text-xs line-through"
                                        style={{ color: 'rgba(0,0,0,0.28)' }}
                                    >
                                        ${product.price.toLocaleString('es-AR')}
                                    </span>
                                )}
                            </div>
                            {isOpen && (
                                <button
                                    onClick={handleAdd}
                                    className="add-btn cursor-pointer flex items-center justify-center w-11 h-11 rounded-full text-white active:scale-90 shrink-0"
                                    style={{
                                        background: FOREST,
                                        boxShadow: `0 4px 14px rgba(45,106,45,0.35)`,
                                        color: '#ffffff',
                                    }}
                                    aria-label={`Agregar ${product.name}`}
                                >
                                    <Plus className="w-5 h-5" strokeWidth={2.5} />
                                </button>
                            )}
                        </div>
                    )}

                    {/* ── Con variantes ──────────────── */}
                    {hasVariants && (
                        <div
                            className="mt-3 pt-3 flex flex-col gap-2.5"
                            style={{ borderTop: '1px solid rgba(0,0,0,0.08)' }}
                        >
                            {variants.map((variant, vIdx) => {
                                const effPrice    = getEffectiveVariantPrice(variant);
                                const vHasDiscount = variantHasDiscount(variant);
                                return (
                                    <div
                                        key={variant.id}
                                        className="flex items-center justify-between gap-2 variant-row"
                                        style={{ animationDelay: `${vIdx * 50}ms` }}
                                    >
                                        <div className="flex items-center gap-2 min-w-0">
                                            <span
                                                className="shrink-0 rounded-full"
                                                style={{ width: 6, height: 6, background: FOREST, opacity: 0.5, flexShrink: 0 }}
                                            />
                                            <span
                                                className="font-body text-sm font-medium truncate"
                                                style={{ color: '#333333' }}
                                            >
                                                {variant.name}
                                            </span>
                                            {vHasDiscount && (
                                                <span
                                                    className="text-[10px] font-bold px-1.5 py-0.5 rounded-full shrink-0"
                                                    style={{
                                                        background: 'rgba(245,158,11,0.14)',
                                                        color: AMBER,
                                                        border: '1px solid rgba(245,158,11,0.28)',
                                                    }}
                                                >
                                                    -{variant.discount}%
                                                </span>
                                            )}
                                        </div>

                                        <div className="flex items-center gap-2.5 shrink-0">
                                            <div className="flex flex-col items-end">
                                                <span
                                                    className="font-display leading-none"
                                                    style={{ fontSize: '1.1rem', color: '#111111' }}
                                                >
                                                    ${effPrice.toLocaleString('es-AR')}
                                                </span>
                                                {vHasDiscount && (
                                                    <span
                                                        className="font-body text-[10px] line-through"
                                                        style={{ color: 'rgba(0,0,0,0.28)' }}
                                                    >
                                                        ${variant.price.toLocaleString('es-AR')}
                                                    </span>
                                                )}
                                            </div>
                                            {isOpen && (
                                                <button
                                                    onClick={(e) => handleAddVariant(e, variant)}
                                                    className="add-btn cursor-pointer flex items-center justify-center w-8 h-8 rounded-full text-white active:scale-85 shrink-0"
                                                    style={{
                                                        background: FOREST,
                                                        boxShadow: `0 3px 10px rgba(45,106,45,0.35)`,
                                                        color: '#ffffff',
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
            </div>
        </motion.div>
    );
}
