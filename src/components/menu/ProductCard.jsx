import { useContext, useState } from 'react';
import { useCartStore } from '../../store/cartStore';
import { Plus, Image as ImageIcon } from 'lucide-react';
import toast from 'react-hot-toast';
import { BarCtx } from '../../context/barCtx';
import { getEffectivePrice, hasDiscount, getEffectiveVariantPrice, variantHasDiscount } from '../../utils/price';

const FOREST      = '#2d6a2d';
const FOREST_DARK = '#1a4a1a';
const AMBER       = '#F59E0B';

export default function ProductCard({ product, categoryName }) {
    const addItem = useCartStore((state) => state.addItem);
    const { isOpen } = useContext(BarCtx);
    const [imgLoaded, setImgLoaded] = useState(false);

    const variants = product.product_variants || [];
    const hasVariants = variants.length > 0;

    const handleAdd = (e) => {
        e.stopPropagation();
        const effectivePrice = getEffectivePrice(product);
        addItem({ ...product, category_name: categoryName, price: effectivePrice, originalPrice: product.price });
        toast.success(`${product.name} agregado`);
    };

    const handleAddVariant = (e, variant) => {
        e.stopPropagation();
        const effectivePrice = getEffectiveVariantPrice(variant);
        addItem(
            { ...product, category_name: categoryName },
            { ...variant, price: effectivePrice }
        );
        toast.success(`${product.name} (${variant.name}) agregado`);
    };

    return (
        <div
            className="overflow-hidden rounded-2xl"
            style={{
                background: '#ffffff',
                border: '1px solid rgba(45,106,45,0.12)',
                boxShadow: '0 2px 14px rgba(45,106,45,0.08), 0 1px 3px rgba(0,0,0,0.05)',
            }}
        >
            {/* ── Imagen ──────────────────────────────── */}
            <div className="relative w-full aspect-[16/9] overflow-hidden" style={{ background: '#eef3ee' }}>
                {product.image_url ? (
                    <>
                        {!imgLoaded && (
                            <div
                                className="absolute inset-0"
                                style={{
                                    background: 'linear-gradient(110deg, #e8efe8 30%, #f2f6f2 50%, #e8efe8 70%)',
                                    backgroundSize: '200% 100%',
                                    animation: 'shimmer 1.6s ease-in-out infinite',
                                }}
                            />
                        )}
                        <img
                            src={product.image_url}
                            alt={product.name}
                            loading="lazy"
                            onLoad={() => setImgLoaded(true)}
                            className={`w-full h-full object-cover transition-all duration-500 ${imgLoaded ? 'opacity-100' : 'opacity-0'}`}
                        />
                        {/* Gradiente sutil abajo para conectar con el panel */}
                        <div
                            className="absolute inset-x-0 bottom-0 h-12 pointer-events-none"
                            style={{ background: 'linear-gradient(to top, rgba(255,255,255,0.5), transparent)' }}
                        />
                    </>
                ) : (
                    <div className="w-full h-full flex items-center justify-center" style={{ color: 'rgba(45,106,45,0.20)' }}>
                        <ImageIcon className="w-12 h-12" />
                    </div>
                )}

                {/* Badge de descuento — ámbar solo aquí como alerta */}
                {!hasVariants && hasDiscount(product) && (
                    <div
                        className="absolute top-3 left-3 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full"
                        style={{ background: AMBER, color: '#0a0a0a', boxShadow: '0 2px 8px rgba(245,158,11,0.35)' }}
                    >
                        -{product.discount}%
                    </div>
                )}
                {hasVariants && variants.some(v => variantHasDiscount(v)) && (
                    <div
                        className="absolute top-3 left-3 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full"
                        style={{ background: AMBER, color: '#0a0a0a', boxShadow: '0 2px 8px rgba(245,158,11,0.35)' }}
                    >
                        PROMO
                    </div>
                )}
            </div>

            {/* ── Panel info — borde verde bosque ─────── */}
            <div style={{ borderTop: `3px solid ${FOREST}` }}>
                <div className="px-4 pt-3.5 pb-4">

                    {/* Nombre */}
                    <h3
                        className="font-display uppercase leading-tight"
                        style={{ fontSize: 'clamp(1.25rem, 5vw, 1.55rem)', color: '#0a0a0a' }}
                    >
                        {product.name}
                    </h3>

                    {/* Descripción */}
                    {product.description && (
                        <p
                            className="text-[13px] leading-snug mt-1 line-clamp-1"
                            style={{ color: 'rgba(0,0,0,0.45)' }}
                        >
                            {product.description}
                        </p>
                    )}

                    {/* ── Sin variantes: precio + botón ──── */}
                    {!hasVariants && (
                        <div
                            className="flex items-center justify-between mt-3 pt-3"
                            style={{ borderTop: '1px solid rgba(45,106,45,0.10)' }}
                        >
                            <div className="flex items-baseline gap-1.5">
                                <span
                                    className="font-display leading-none"
                                    style={{ fontSize: '1.55rem', color: FOREST_DARK, letterSpacing: '-0.01em' }}
                                >
                                    ${getEffectivePrice(product).toLocaleString('es-AR')}
                                </span>
                                {hasDiscount(product) && (
                                    <span className="text-xs line-through" style={{ color: 'rgba(0,0,0,0.28)' }}>
                                        ${product.price.toLocaleString('es-AR')}
                                    </span>
                                )}
                            </div>
                            {isOpen && (
                                <button
                                    onClick={handleAdd}
                                    className="add-btn cursor-pointer flex items-center justify-center w-11 h-11 rounded-full text-white active:scale-90"
                                    style={{
                                        background: `linear-gradient(135deg, ${FOREST} 0%, ${FOREST_DARK} 100%)`,
                                        boxShadow: `0 3px 12px rgba(45,106,45,0.38)`,
                                    }}
                                    aria-label={`Agregar ${product.name}`}
                                >
                                    <Plus className="w-5 h-5" strokeWidth={2.5} />
                                </button>
                            )}
                        </div>
                    )}

                    {/* ── Con variantes ──────────────────── */}
                    {hasVariants && (
                        <div
                            className="mt-3 pt-3 flex flex-col gap-2.5"
                            style={{ borderTop: '1px solid rgba(45,106,45,0.10)' }}
                        >
                            {variants.map((variant, vIdx) => {
                                const effPrice = getEffectiveVariantPrice(variant);
                                const vHasDiscount = variantHasDiscount(variant);
                                return (
                                    <div
                                        key={variant.id}
                                        className="flex items-center justify-between gap-2 variant-row"
                                        style={{ animationDelay: `${vIdx * 50}ms` }}
                                    >
                                        <div className="flex items-center gap-2 min-w-0">
                                            {/* Dot verde como indicador de variante */}
                                            <span
                                                className="shrink-0 w-1.5 h-1.5 rounded-full"
                                                style={{ background: FOREST, opacity: 0.55 }}
                                            />
                                            <span className="text-sm font-medium truncate" style={{ color: '#333333' }}>
                                                {variant.name}
                                            </span>
                                            {vHasDiscount && (
                                                <span
                                                    className="text-[10px] font-bold px-1.5 py-0.5 rounded-full shrink-0"
                                                    style={{ background: 'rgba(245,158,11,0.13)', color: '#a06500', border: '1px solid rgba(245,158,11,0.28)' }}
                                                >
                                                    -{variant.discount}%
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-2.5 shrink-0">
                                            <div className="flex flex-col items-end">
                                                <span
                                                    className="font-display leading-none"
                                                    style={{ fontSize: '1.1rem', color: FOREST_DARK }}
                                                >
                                                    ${effPrice.toLocaleString('es-AR')}
                                                </span>
                                                {vHasDiscount && (
                                                    <span className="text-[10px] line-through" style={{ color: 'rgba(0,0,0,0.28)' }}>
                                                        ${variant.price.toLocaleString('es-AR')}
                                                    </span>
                                                )}
                                            </div>
                                            {isOpen && (
                                                <button
                                                    onClick={(e) => handleAddVariant(e, variant)}
                                                    className="add-btn cursor-pointer flex items-center justify-center w-8 h-8 rounded-full text-white active:scale-85"
                                                    style={{
                                                        background: `linear-gradient(135deg, ${FOREST} 0%, ${FOREST_DARK} 100%)`,
                                                        boxShadow: `0 2px 8px rgba(45,106,45,0.35)`,
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
        </div>
    );
}
