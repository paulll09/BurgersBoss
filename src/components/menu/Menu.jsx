import { useRef, useState, useEffect, useCallback, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import ProductCard from './ProductCard';
import { hasDiscount, variantHasDiscount } from '../../utils/price';
import { MotionDiv, slideLeft, scaleIn, staggerContainer, VIEWPORT } from '../../lib/motion';

const OFERTAS_ID = 'ofertas';

export default function Menu({ products, categories: rawCategories, loading, error, refetch }) {
    // Filter discounted products for virtual "Ofertas" category
    const discountedProducts = useMemo(
        () => products.filter(p => hasDiscount(p) || (p.product_variants || []).some(v => variantHasDiscount(v))),
        [products],
    );

    // Prepend virtual "Ofertas" tab only when there are discounted products
    const categories = useMemo(() => {
        if (discountedProducts.length === 0) return rawCategories;
        return [{ id: OFERTAS_ID, name: 'Promos' }, ...rawCategories];
    }, [rawCategories, discountedProducts.length]);

    const [activeCategory, setActiveCategory] = useState(null);
    const sectionRefs = useRef({});
    const tabsRef = useRef(null);
    const btnRefs = useRef({});
    const location = useLocation();

    // Sliding pill indicator state
    const [pillStyle, setPillStyle] = useState({ left: 0, width: 0, opacity: 0 });

    // Guard: blocks observer during programmatic scroll to prevent feedback loops
    const isProgrammaticScroll = useRef(false);
    const scrollTimer = useRef(null);

    useEffect(() => {
        if (categories.length > 0 && !activeCategory) {
            setActiveCategory(categories[0]?.id);
        }
    }, [categories]);

    // Track active category via scroll — rAF-throttled (once per frame).
    useEffect(() => {
        if (!categories.length) return;

        let ticking = false;

        const computeActive = () => {
            ticking = false;
            if (isProgrammaticScroll.current) return;

            const trigger = (window.visualViewport?.height ?? window.innerHeight) * 0.35;
            let best = null;
            let bestDist = Infinity;

            for (const cat of categories) {
                const el = sectionRefs.current[cat.id];
                if (!el) continue;
                const rect = el.getBoundingClientRect();
                const vh = window.visualViewport?.height ?? window.innerHeight;
                if (rect.bottom < 0 || rect.top > vh) continue;
                const dist = Math.abs(rect.top - trigger);
                if (dist < bestDist) {
                    bestDist = dist;
                    best = cat.id;
                }
            }

            if (best !== null) {
                setActiveCategory(prev => {
                    if (prev === best) return prev;
                    const currentEl = sectionRefs.current[prev];
                    if (currentEl) {
                        const currentDist = Math.abs(currentEl.getBoundingClientRect().top - trigger);
                        if (bestDist > currentDist - 60) return prev;
                    }
                    return best;
                });
            }
        };

        const handleScroll = () => {
            if (!ticking) {
                ticking = true;
                requestAnimationFrame(computeActive);
            }
        };

        window.addEventListener('scroll', handleScroll, { passive: true });
        computeActive();

        return () => window.removeEventListener('scroll', handleScroll);
    }, [categories]);

    useEffect(() => {
        const scrollTo = location.state?.scrollTo;
        if (!scrollTo || !categories.length) return;
        const cat = categories.find(c => c.name.toLowerCase().includes(scrollTo));
        if (cat) {
            setTimeout(() => scrollToCategory(cat.id), 500);
            window.history.replaceState({}, '');
        }
    }, [categories, location.state?.scrollTo]);

    const scrollToCategory = useCallback((id) => {
        const el = sectionRefs.current[id];
        if (!el) return;

        isProgrammaticScroll.current = true;
        if (scrollTimer.current) clearTimeout(scrollTimer.current);

        setActiveCategory(id);

        const tabsEl = tabsRef.current?.parentElement;
        const tabsHeight = tabsEl ? tabsEl.offsetHeight : 44;
        const top = el.getBoundingClientRect().top + window.scrollY - tabsHeight;
        window.scrollTo({ top, behavior: 'smooth' });

        scrollTimer.current = setTimeout(() => {
            isProgrammaticScroll.current = false;
        }, 1000);
    }, []);

    // Update the sliding pill position + horizontally scroll tabs
    useEffect(() => {
        const container = tabsRef.current;
        const btn = btnRefs.current[activeCategory];
        if (!container || !btn) return;

        setPillStyle({
            left: btn.offsetLeft,
            width: btn.offsetWidth,
            opacity: 1,
        });

        const scrollTarget = btn.offsetLeft - (container.offsetWidth / 2) + (btn.offsetWidth / 2);
        container.scrollTo({ left: scrollTarget, behavior: 'smooth' });
    }, [activeCategory]);

    return (
        <div id="menu" className="relative pb-20" style={{ background: '#ffffff' }}>

            {/* ── Category Tabs ──────────────────────── */}
            <div
                className="sticky z-40 border-b"
                style={{
                    top: 0,
                    background: '#ffffff',
                    borderColor: 'rgba(0,0,0,0.08)',
                    boxShadow: '0 1px 0 rgba(0,0,0,0.06)',
                }}
            >
                <div
                    ref={tabsRef}
                    className="relative flex gap-1.5 px-3 sm:px-6 py-2 overflow-x-auto hide-scrollbar"
                >
                    {/* Sliding pill indicator */}
                    <div
                        className="absolute rounded-full"
                        style={{
                            left: pillStyle.left,
                            width: pillStyle.width,
                            top: '50%',
                            height: 'calc(100% - 16px)',
                            transform: 'translateY(-50%)',
                            opacity: pillStyle.opacity,
                            background: '#1a4a1a',
                            boxShadow: '0 0 14px rgba(26,74,26,0.30)',
                            transition: 'left 0.35s cubic-bezier(0.25, 1, 0.5, 1), width 0.3s cubic-bezier(0.25, 1, 0.5, 1), opacity 0.2s ease',
                            pointerEvents: 'none',
                            zIndex: 0,
                        }}
                    />

                    {categories.map((cat) => {
                        const active = activeCategory === cat.id;
                        return (
                            <button
                                key={cat.id}
                                ref={(el) => { btnRefs.current[cat.id] = el; }}
                                data-active={active}
                                onClick={() => scrollToCategory(cat.id)}
                                className="cursor-pointer relative z-10 shrink-0 px-3 py-1.5 rounded-full text-[10px] font-semibold uppercase tracking-wider transition-colors duration-300 active:scale-95"
                                style={active
                                    ? { color: '#ffffff' }
                                    : { color: 'rgba(0,0,0,0.50)', boxShadow: '0 0 0 1px rgba(0,0,0,0.10)', background: 'rgba(0,0,0,0.03)' }
                                }
                            >
                                {cat.name}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* ── Sections ──────────────────────────── */}
            <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 flex flex-col gap-12 pt-10">
                {loading ? (
                    <div className="flex flex-col gap-4">
                        {[...Array(4)].map((_, i) => (
                            <div key={i} className="rounded-2xl animate-pulse h-28"
                                style={{ background: '#f0efed' }} />
                        ))}
                    </div>
                ) : error ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-4">
                        <p className="text-sm text-center" style={{ color: '#888888' }}>No se pudo cargar el menú. Verificá tu conexión e intentá de nuevo.</p>
                        <button
                            onClick={refetch}
                            className="cursor-pointer bg-primary hover:bg-primary-dark text-white text-xs font-semibold uppercase tracking-widest px-6 py-3 rounded-full transition-all active:scale-95"
                        >
                            Reintentar
                        </button>
                    </div>
                ) : (
                    categories.map((cat) => {
                        const catProducts = cat.id === OFERTAS_ID
                            ? discountedProducts
                            : products.filter(p => p.category_id === cat.id);
                        if (catProducts.length === 0) return null;

                        return (
                            <section
                                key={cat.id}
                                ref={(el) => { sectionRefs.current[cat.id] = el; }}
                            >
                                <MotionDiv variants={slideLeft}>
                                    <div className="flex items-center gap-3 mb-7">
                                        <div style={{ width: '3px', height: '1.6rem', background: '#2d6a2d', borderRadius: '2px', flexShrink: 0 }} />
                                        <h2
                                            className="font-display uppercase shrink-0"
                                            style={{ fontSize: 'clamp(1.6rem, 6vw, 2.2rem)', color: '#0a0a0a', letterSpacing: '0.01em', lineHeight: 1 }}
                                        >
                                            {cat.name}
                                        </h2>
                                        <div
                                            className="flex-1"
                                            style={{ height: '1px', background: 'linear-gradient(to right, rgba(45,106,45,0.18) 0%, transparent 100%)' }}
                                        />
                                    </div>
                                </MotionDiv>

                                <motion.div
                                    className="flex flex-col gap-5"
                                    initial="hidden"
                                    whileInView="visible"
                                    viewport={VIEWPORT}
                                    variants={staggerContainer}
                                >
                                    {catProducts.map((product) => (
                                        <MotionDiv key={product.id} variants={scaleIn}>
                                            <ProductCard product={product} categoryName={cat.name} />
                                        </MotionDiv>
                                    ))}
                                </motion.div>
                            </section>
                        );
                    })
                )}
            </div>
        </div>
    );
}
