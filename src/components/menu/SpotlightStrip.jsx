import { useContext, useState, useCallback, memo } from 'react';
import { motion } from 'framer-motion';
import { Plus, Image as ImageIcon } from 'lucide-react';
import { useCartStore } from '../../store/cartStore';
import { BarCtx } from '../../context/barCtx';
import { getEffectivePrice, hasDiscount } from '../../utils/price';
import { VIEWPORT, PREMIUM_EASE, lineStagger, lineSlideUp } from '../../lib/motion';
import toast from 'react-hot-toast';

const FOREST_DARK = '#1a4a1a';
const FOREST      = '#2d6a2d';
const AMBER       = '#F59E0B';

/* ── Badge ─────────────────────────────────────── */
function Badge({ type }) {
    const isNew = type === 'new';
    return (
        <div
            style={{
                position: 'absolute',
                top: '10px',
                left: '10px',
                fontSize: '9px',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.12em',
                padding: '4px 9px',
                borderRadius: '999px',
                lineHeight: 1,
                ...(isNew
                    ? { background: FOREST_DARK, color: '#fff', boxShadow: '0 2px 8px rgba(26,74,26,0.45)' }
                    : { background: AMBER, color: '#0a0a0a', boxShadow: '0 2px 8px rgba(245,158,11,0.45)' }
                ),
            }}
        >
            {isNew ? '✦ NUEVO' : '🔥 OFERTA'}
        </div>
    );
}

/* ── Skeleton card ──────────────────────────────── */
function SkeletonCard() {
    return (
        <div
            style={{
                scrollSnapAlign: 'start',
                flexShrink: 0,
                width: 'clamp(155px, 44vw, 200px)',
                borderRadius: '20px',
                overflow: 'hidden',
                background: '#ffffff',
                boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
            }}
        >
            <div className="card-shimmer" style={{ aspectRatio: '1/1', width: '100%' }} />
            <div style={{ padding: '10px 12px 12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div className="card-shimmer" style={{ height: '1.4rem', borderRadius: '6px', width: '75%' }} />
                <div className="card-shimmer" style={{ height: '1.2rem', borderRadius: '6px', width: '55%' }} />
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div className="card-shimmer" style={{ height: '1.8rem', borderRadius: '999px', width: '48%' }} />
                    <div className="card-shimmer" style={{ width: '36px', height: '36px', borderRadius: '50%' }} />
                </div>
            </div>
        </div>
    );
}

/* ── Product card ───────────────────────────────── */
const SpotlightCard = memo(function SpotlightCard({ product, badgeType, onOpenModal }) {
    const addItem    = useCartStore((s) => s.addItem);
    const { isOpen } = useContext(BarCtx);
    const [imgLoaded, setImgLoaded] = useState(false);

    const variants        = product.product_variants || [];
    const hasVariants     = variants.length > 0;
    const hasComboOptions = (product.combo_options?.length ?? 0) > 0;
    const needsModal      = hasVariants || hasComboOptions;

    const price = hasVariants
        ? Math.min(...variants.map(v => v.price))
        : getEffectivePrice(product);

    const openModal = useCallback(() => {
        if (needsModal && onOpenModal) onOpenModal(product);
    }, [needsModal, onOpenModal, product]);

    const handleAdd = useCallback((e) => {
        e.stopPropagation();
        if (needsModal && onOpenModal) { onOpenModal(product); return; }
        addItem({ ...product, price, originalPrice: product.price });
        toast.success(`${product.name} agregado`);
    }, [needsModal, onOpenModal, product, addItem, price]);

    return (
        <div
            onClick={needsModal && onOpenModal ? openModal : undefined}
            role={needsModal && onOpenModal ? 'button' : undefined}
            tabIndex={needsModal && onOpenModal ? 0 : undefined}
            onKeyDown={needsModal && onOpenModal ? (e) => e.key === 'Enter' && openModal() : undefined}
            aria-label={needsModal && onOpenModal ? `Ver opciones de ${product.name}` : undefined}
            style={{
                scrollSnapAlign: 'start',
                flexShrink: 0,
                width: 'clamp(155px, 44vw, 200px)',
                background: '#ffffff',
                borderRadius: '20px',
                overflow: 'hidden',
                boxShadow: '0 4px 24px rgba(0,0,0,0.08), 0 1px 4px rgba(0,0,0,0.05)',
                cursor: needsModal && onOpenModal ? 'pointer' : 'default',
                transform: 'translateZ(0)',
            }}
        >
            {/* Image */}
            <div style={{ position: 'relative', aspectRatio: '1/1', background: '#f0efed', overflow: 'hidden' }}>
                {product.image_url ? (
                    <>
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
                            draggable="false"
                            onLoad={() => setImgLoaded(true)}
                            style={{
                                width: '100%', height: '100%',
                                objectFit: 'cover', objectPosition: 'center',
                                display: 'block',
                                opacity: imgLoaded ? 1 : 0,
                                transition: 'opacity 0.4s ease',
                            }}
                        />
                    </>
                ) : (
                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(0,0,0,0.15)' }}>
                        <ImageIcon style={{ width: 32, height: 32 }} />
                    </div>
                )}

                <Badge type={badgeType} />
            </div>

            {/* Info */}
            <div style={{ padding: '10px 12px 12px' }}>
                <h3
                    className="font-display uppercase"
                    style={{
                        fontSize: 'clamp(0.95rem, 3.8vw, 1.2rem)',
                        color: '#111111',
                        letterSpacing: '0.02em',
                        lineHeight: 1.15,
                        marginBottom: '8px',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                    }}
                >
                    {product.name}
                </h3>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px' }}>
                    <div style={{ minWidth: 0 }}>
                        {hasVariants && (
                            <span
                                className="font-body"
                                style={{
                                    fontSize: '0.52rem', color: 'rgba(0,0,0,0.38)', fontWeight: 600,
                                    textTransform: 'uppercase', letterSpacing: '0.14em', display: 'block', marginBottom: '2px',
                                }}
                            >
                                Desde
                            </span>
                        )}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', flexWrap: 'wrap' }}>
                            <span
                                className="font-display"
                                style={{
                                    display: 'inline-block',
                                    background: FOREST_DARK,
                                    color: '#fff',
                                    borderRadius: '999px',
                                    padding: '3px 10px',
                                    fontSize: '1.05rem',
                                    letterSpacing: '0.02em',
                                    lineHeight: 1.2,
                                    whiteSpace: 'nowrap',
                                }}
                            >
                                ${price.toLocaleString('es-AR')}
                            </span>
                            {!hasVariants && hasDiscount(product) && (
                                <span
                                    className="font-body"
                                    style={{ fontSize: '0.65rem', color: 'rgba(0,0,0,0.28)', textDecoration: 'line-through' }}
                                >
                                    ${product.price.toLocaleString('es-AR')}
                                </span>
                            )}
                        </div>
                    </div>

                    {isOpen && (
                        <button
                            onClick={handleAdd}
                            className="add-btn cursor-pointer active:scale-90"
                            style={{
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                width: '36px', height: '36px',
                                background: FOREST_DARK,
                                borderRadius: '50%',
                                border: 'none',
                                color: '#fff',
                                flexShrink: 0,
                            }}
                            aria-label={`Agregar ${product.name}`}
                        >
                            <Plus style={{ width: 16, height: 16 }} strokeWidth={2.5} />
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
});

/* ── Section heading ────────────────────────────── */
function SectionHeading({ eyebrow, title, accent }) {
    return (
        <motion.div
            style={{ paddingLeft: '16px', paddingRight: '16px', marginBottom: '14px' }}
            initial="hidden"
            whileInView="visible"
            viewport={VIEWPORT}
            variants={lineStagger}
        >
            <motion.p
                className="font-display uppercase"
                style={{ fontSize: '0.56rem', letterSpacing: '0.40em', color: FOREST, marginBottom: '2px' }}
                variants={lineSlideUp}
            >
                {eyebrow}
            </motion.p>
            <motion.div variants={lineSlideUp} style={{ lineHeight: 0.9 }}>
                <span
                    className="font-display uppercase"
                    style={{
                        fontSize: 'clamp(2rem, 8vw, 3rem)',
                        color: '#0a0a0a',
                        letterSpacing: '-0.01em',
                    }}
                >
                    {title}{' '}
                </span>
                <span
                    className="font-display uppercase"
                    style={{
                        fontSize: 'clamp(2rem, 8vw, 3rem)',
                        color: FOREST,
                        letterSpacing: '-0.01em',
                    }}
                >
                    {accent}
                </span>
            </motion.div>
        </motion.div>
    );
}

/* ── Scrollable strip ───────────────────────────── */
function Strip({ items, badgeType, onOpenModal, loading }) {
    return (
        <div style={{ position: 'relative' }}>
            <div
                className="hide-scrollbar"
                style={{
                    display: 'flex',
                    gap: '12px',
                    overflowX: 'auto',
                    scrollSnapType: 'x mandatory',
                    padding: '4px 16px 12px',
                    WebkitOverflowScrolling: 'touch',
                }}
            >
                {loading
                    ? [...Array(3)].map((_, i) => <SkeletonCard key={i} />)
                    : items.map(product => (
                        <SpotlightCard
                            key={product.id}
                            product={product}
                            badgeType={badgeType}
                            onOpenModal={onOpenModal}
                        />
                    ))
                }
                <div style={{ flexShrink: 0, width: '4px' }} />
            </div>

            {/* Right-side fade — hints at more content */}
            <div
                aria-hidden="true"
                style={{
                    position: 'absolute',
                    top: 0, right: 0, bottom: 0,
                    width: '56px',
                    background: 'linear-gradient(to left, #F5F0E8 0%, transparent 100%)',
                    pointerEvents: 'none',
                }}
            />
        </div>
    );
}

/* ════════════════════════════════════════════════
   MAIN COMPONENT
════════════════════════════════════════════════ */
export default function SpotlightStrip({ products, loading, onOpenModal }) {
    const newProducts      = products.filter(p => p.is_new);
    const featuredProducts = products.filter(p => p.is_featured && !p.is_new);

    const hasNew      = loading || newProducts.length > 0;
    const hasFeatured = loading || featuredProducts.length > 0;

    if (!hasNew && !hasFeatured) return null;

    return (
        <div style={{ background: '#F5F0E8', paddingTop: '52px' }}>

            {/* ── New launches ── */}
            {hasNew && (
                <motion.div
                    initial={{ opacity: 0, y: 18 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={VIEWPORT}
                    transition={{ duration: 0.60, ease: PREMIUM_EASE }}
                    style={{ marginBottom: hasFeatured ? '44px' : '16px' }}
                >
                    <SectionHeading
                        eyebrow="BURGERS BOSS · NOVEDADES"
                        title="NUEVOS"
                        accent="lanzamientos"
                    />
                    <Strip
                        items={newProducts}
                        badgeType="new"
                        onOpenModal={onOpenModal}
                        loading={loading}
                    />
                </motion.div>
            )}

            {/* ── Special offers ── */}
            {hasFeatured && (
                <motion.div
                    initial={{ opacity: 0, y: 18 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={VIEWPORT}
                    transition={{ duration: 0.60, ease: PREMIUM_EASE, delay: hasNew ? 0.08 : 0 }}
                    style={{ marginBottom: '16px' }}
                >
                    <SectionHeading
                        eyebrow="BURGERS BOSS · PROMOCIONES"
                        title="OFERTA"
                        accent="especial"
                    />
                    <Strip
                        items={featuredProducts}
                        badgeType="offer"
                        onOpenModal={onOpenModal}
                        loading={loading}
                    />
                </motion.div>
            )}
        </div>
    );
}
