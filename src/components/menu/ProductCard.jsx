import { useContext, useState } from 'react';
import { useCartStore } from '../../store/cartStore';
import { Plus, Image as ImageIcon } from 'lucide-react';
import toast from 'react-hot-toast';
import { BarCtx } from '../../context/barCtx';
import { getEffectivePrice, hasDiscount, getEffectiveVariantPrice, variantHasDiscount } from '../../utils/price';

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
            className="product-card overflow-hidden rounded-[20px]"
            style={{ background: '#111111' }}
        >
            {/* ── Imagen — sin texto encima ────────────── */}
            <div className="relative w-full aspect-[16/9] overflow-hidden" style={{ background: '#1a1a1a' }}>
                {product.image_url ? (
                    <>
                        {!imgLoaded && (
                            <div
                                className="absolute inset-0"
                                style={{
                                    background: 'linear-gradient(110deg, #1a1a1a 30%, #222 50%, #1a1a1a 70%)',
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
                            className={`w-full h-full object-cover transition-all duration-500 group-hover:scale-[1.02] ${imgLoaded ? 'opacity-100' : 'opacity-0'}`}
                        />
                    </>
                ) : (
                    <div className="w-full h-full flex items-center justify-center" style={{ color: 'rgba(255,255,255,0.15)' }}>
                        <ImageIcon className="w-12 h-12" />
                    </div>
                )}

                {/* Badge de descuento */}
                {!hasVariants && hasDiscount(product) && (
                    <div
                        className="absolute top-3 left-3 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full"
                        style={{ background: '#F59E0B', color: '#0a0a0a', boxShadow: '0 2px 10px rgba(245,158,11,0.40)' }}
                    >
                        -{product.discount}%
                    </div>
                )}
                {hasVariants && variants.some(v => variantHasDiscount(v)) && (
                    <div
                        className="absolute top-3 left-3 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full"
                        style={{ background: '#F59E0B', color: '#0a0a0a', boxShadow: '0 2px 10px rgba(245,158,11,0.40)' }}
                    >
                        PROMO
                    </div>
                )}
            </div>

            {/* ── Panel de info — línea ámbar + tipografía bold ── */}
            <div style={{ borderTop: '3px solid #F59E0B' }}>
                <div className="px-4 pt-3.5 pb-4">

                    {/* Nombre + descripción */}
                    <h3
                        className="font-display uppercase text-white leading-tight"
                        style={{ fontSize: 'clamp(1.3rem, 5vw, 1.6rem)' }}
                    >
                        {product.name}
                    </h3>
                    {product.description && (
                        <p
                            className="text-[13px] leading-snug mt-1 line-clamp-1"
                            style={{ color: 'rgba(255,255,255,0.55)' }}
                        >
                            {product.description}
                        </p>
                    )}

                    {/* Precio + botón — producto sin variantes */}
                    {!hasVariants && (
                        <div className="flex items-center justify-between mt-3 pt-3" style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}>
                            <div className="flex items-baseline gap-1.5">
                                <div className="flex items-baseline gap-0.5">
                                    <span className="text-xs font-bold" style={{ color: '#F59E0B' }}>$</span>
                                    <span className="font-display leading-none" style={{ fontSize: '1.5rem', color: '#F59E0B' }}>
                                        {getEffectivePrice(product).toLocaleString('es-AR')}
                                    </span>
                                </div>
                                {hasDiscount(product) && (
                                    <span className="text-xs line-through" style={{ color: 'rgba(255,255,255,0.35)' }}>
                                        ${product.price.toLocaleString('es-AR')}
                                    </span>
                                )}
                            </div>
                            {isOpen && (
                                <button
                                    onClick={handleAdd}
                                    className="add-btn cursor-pointer flex items-center justify-center w-11 h-11 bg-primary text-white rounded-full active:scale-90"
                                    aria-label={`Agregar ${product.name}`}
                                >
                                    <Plus className="w-5 h-5" strokeWidth={2.5} />
                                </button>
                            )}
                        </div>
                    )}

                    {/* Variantes */}
                    {hasVariants && (
                        <div className="mt-3 pt-3 flex flex-col gap-2.5" style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}>
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
                                            <span className="text-sm font-medium truncate" style={{ color: 'rgba(255,255,255,0.75)' }}>
                                                {variant.name}
                                            </span>
                                            {vHasDiscount && (
                                                <span
                                                    className="text-[10px] font-bold px-1.5 py-0.5 rounded-full shrink-0"
                                                    style={{ background: 'rgba(245,158,11,0.15)', color: '#F59E0B', border: '1px solid rgba(245,158,11,0.30)' }}
                                                >
                                                    -{variant.discount}%
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-2.5 shrink-0">
                                            <div className="flex flex-col items-end">
                                                <div className="flex items-baseline gap-0.5">
                                                    <span className="text-[11px] font-bold" style={{ color: '#F59E0B' }}>$</span>
                                                    <span className="font-display leading-none" style={{ fontSize: '1.1rem', color: '#F59E0B' }}>
                                                        {effPrice.toLocaleString('es-AR')}
                                                    </span>
                                                </div>
                                                {vHasDiscount && (
                                                    <span className="text-[10px] line-through" style={{ color: 'rgba(255,255,255,0.30)' }}>
                                                        ${variant.price.toLocaleString('es-AR')}
                                                    </span>
                                                )}
                                            </div>
                                            {isOpen && (
                                                <button
                                                    onClick={(e) => handleAddVariant(e, variant)}
                                                    className="add-btn cursor-pointer flex items-center justify-center w-8 h-8 bg-primary text-white rounded-full active:scale-85"
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
