import { useRef, useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ProductCard from './ProductCard';
import ProductModal from './ProductModal';
import SpotlightStrip from './SpotlightStrip';
import { useExtras } from '../../hooks/useExtras';
import { MotionDiv, slideLeft, staggerContainer, VIEWPORT, PREMIUM_EASE } from '../../lib/motion';


function ProductCardSkeleton({ delay = 0 }) {
    return (
        <div style={{
            background: '#ffffff', borderRadius: '20px', overflow: 'hidden',
            boxShadow: '0 4px 24px rgba(0,0,0,0.08), 0 1px 4px rgba(0,0,0,0.05)',
            animationDelay: `${delay}ms`,
        }}>
            <div className="card-shimmer" style={{ aspectRatio: '1/1', width: '100%' }} />
            <div style={{ padding: '14px 16px 16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div className="card-shimmer" style={{ height: '2rem', borderRadius: '6px', width: '60%' }} />
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <div className="card-shimmer" style={{ height: '0.72rem', borderRadius: '4px', width: '100%' }} />
                    <div className="card-shimmer" style={{ height: '0.72rem', borderRadius: '4px', width: '75%' }} />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '2px' }}>
                    <div className="card-shimmer" style={{ height: '2rem', borderRadius: '999px', width: '38%' }} />
                    <div className="card-shimmer" style={{ width: '42px', height: '42px', borderRadius: '50%' }} />
                </div>
            </div>
        </div>
    );
}

export default function Menu({ products, categories, loading, error, refetch }) {
    const { extras } = useExtras();
    const [modalProduct, setModalProduct] = useState(null);
    const [activeSection, setActiveSection] = useState(null);

    const sectionRefs = useRef({});
    const tabsRef     = useRef(null);
    const btnRefs     = useRef({});
    const [pillStyle, setPillStyle] = useState({ left: 0, width: 0, opacity: 0 });

    const isProgrammaticScroll = useRef(false);
    const scrollTimer           = useRef(null);

    /* Agrupar productos por category_id */
    const grouped = useMemo(() => {
        const map = {};
        for (const p of products) {
            const key = p.category_id || '__uncategorized__';
            if (!map[key]) map[key] = [];
            map[key].push(p);
        }
        return map;
    }, [products]);

    /* Secciones visibles = categorías con productos, ordenadas por display_order */
    const visibleSections = useMemo(
        () => categories
            .filter(c => (grouped[c.id]?.length ?? 0) > 0)
            .sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0)),
        [categories, grouped]
    );

    /* Inicializar activeSection al primer item cuando carga */
    useEffect(() => {
        if (visibleSections.length > 0 && !activeSection) {
            setActiveSection(visibleSections[0].id);
        }
    }, [visibleSections, activeSection]);

    /* Scroll tracking — rAF throttled */
    useEffect(() => {
        if (!visibleSections.length) return;
        let ticking = false;

        const computeActive = () => {
            ticking = false;
            if (isProgrammaticScroll.current) return;
            const trigger = (window.visualViewport?.height ?? window.innerHeight) * 0.35;
            let best = null, bestDist = Infinity;
            for (const s of visibleSections) {
                const el = sectionRefs.current[s.id];
                if (!el) continue;
                const rect = el.getBoundingClientRect();
                const vh = window.visualViewport?.height ?? window.innerHeight;
                if (rect.bottom < 0 || rect.top > vh) continue;
                const dist = Math.abs(rect.top - trigger);
                if (dist < bestDist) { bestDist = dist; best = s.id; }
            }
            if (best) setActiveSection(prev => prev === best ? prev : best);
        };

        const onScroll = () => { if (!ticking) { ticking = true; requestAnimationFrame(computeActive); } };
        window.addEventListener('scroll', onScroll, { passive: true });
        computeActive();
        return () => window.removeEventListener('scroll', onScroll);
    }, [visibleSections]);

    /* Sliding pill */
    useEffect(() => {
        const container = tabsRef.current;
        const btn = btnRefs.current[activeSection];
        if (!container || !btn) return;
        setPillStyle({ left: btn.offsetLeft, width: btn.offsetWidth, opacity: 1 });
        const target = btn.offsetLeft - (container.offsetWidth / 2) + (btn.offsetWidth / 2);
        container.scrollTo({ left: target, behavior: 'smooth' });
    }, [activeSection, visibleSections]);

    const scrollToSection = useCallback((sectionId) => {
        const el = sectionRefs.current[sectionId];
        if (!el) return;
        isProgrammaticScroll.current = true;
        if (scrollTimer.current) clearTimeout(scrollTimer.current);
        setActiveSection(sectionId);
        const tabsEl = tabsRef.current?.parentElement;
        const tabsHeight = tabsEl ? tabsEl.offsetHeight : 44;
        const top = el.getBoundingClientRect().top + window.scrollY - tabsHeight - 8;
        window.scrollTo({ top, behavior: 'smooth' });
        scrollTimer.current = setTimeout(() => { isProgrammaticScroll.current = false; }, 900);
    }, []);

    return (
        <div id="menu" className="relative pb-20" style={{ background: '#F5F0E8' }}>

            <SpotlightStrip products={products} loading={loading} onOpenModal={setModalProduct} />

            {/* ── Heading "Nuestro Menú" ── */}
            <motion.div
                className="px-5 sm:px-6"
                style={{ paddingTop: '52px', paddingBottom: '8px', textAlign: 'center' }}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={VIEWPORT}
                transition={{ duration: 0.55, ease: PREMIUM_EASE }}
            >
                <p
                    className="font-display uppercase leading-none"
                    style={{ fontSize: 'clamp(2.8rem, 11vw, 5rem)', letterSpacing: '-0.01em' }}
                >
                    <span style={{ color: '#0a0a0a' }}>Nuestro </span>
                    <span style={{ color: '#2d6a2d' }}>Menú</span>
                </p>
            </motion.div>

            {/* ── Tabs de sección — solo cuando hay más de una ── */}
            {visibleSections.length > 1 && <div
                className="sticky z-40 backdrop-blur-md"
                style={{ top: 0, background: 'rgba(245,240,232,0.92)' }}
            >
                <div
                    ref={tabsRef}
                    className="relative flex gap-1.5 px-3 sm:px-6 py-2 overflow-x-auto hide-scrollbar justify-center"
                >
                    {/* Sliding pill */}
                    <div
                        className="absolute rounded-full"
                        style={{
                            left: pillStyle.left, width: pillStyle.width,
                            top: '50%', height: 'calc(100% - 16px)',
                            transform: 'translateY(-50%)', opacity: pillStyle.opacity,
                            background: '#1a4a1a', boxShadow: '0 0 14px rgba(26,74,26,0.28)',
                            transition: 'left 0.35s cubic-bezier(0.25,1,0.5,1), width 0.3s cubic-bezier(0.25,1,0.5,1), opacity 0.2s ease',
                            pointerEvents: 'none', zIndex: 0,
                        }}
                    />
                    {visibleSections.map(cat => {
                        const active = activeSection === cat.id;
                        return (
                            <button
                                key={cat.id}
                                ref={el => { btnRefs.current[cat.id] = el; }}
                                onClick={() => scrollToSection(cat.id)}
                                className="cursor-pointer relative z-10 shrink-0 px-3 py-2 rounded-full text-[12px] font-semibold uppercase tracking-wider transition-colors duration-300 active:scale-95"
                                style={active
                                    ? { color: '#ffffff' }
                                    : { color: 'rgba(0,0,0,0.50)', boxShadow: '0 0 0 1px rgba(0,0,0,0.10)', background: 'rgba(0,0,0,0.04)' }
                                }
                            >
                                {cat.name}
                            </button>
                        );
                    })}
                </div>
            </div>}

            {/* ── Secciones ── */}
            <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 flex flex-col gap-12 pt-10">
                {loading ? (
                    <div className="flex flex-col gap-5">
                        {[...Array(4)].map((_, i) => (
                            <ProductCardSkeleton key={i} delay={i * 80} />
                        ))}
                    </div>
                ) : error ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-4">
                        <p className="text-sm text-center" style={{ color: '#888' }}>No se pudo cargar el menú. Verificá tu conexión.</p>
                        <button
                            onClick={refetch}
                            className="cursor-pointer text-white text-xs font-semibold uppercase tracking-widest px-6 py-3 rounded-full active:scale-95"
                            style={{ background: '#2d6a2d' }}
                        >
                            Reintentar
                        </button>
                    </div>
                ) : (
                    visibleSections.map(cat => {
                        const items = grouped[cat.id] || [];
                        return (
                            <section
                                key={cat.id}
                                ref={el => { sectionRefs.current[cat.id] = el; }}
                            >
                                {/* Header de sección — solo cuando hay más de una */}
                                {visibleSections.length > 1 && (
                                    <MotionDiv variants={slideLeft}>
                                        <div className="flex items-center gap-3 mb-7">
                                            <div style={{ width: '3px', height: '1.6rem', background: '#2d6a2d', borderRadius: '2px', flexShrink: 0 }} />
                                            <h2
                                                className="font-display uppercase shrink-0"
                                                style={{ fontSize: 'clamp(2.4rem, 9vw, 3.4rem)', color: '#0a0a0a', lineHeight: 1, letterSpacing: '0.03em' }}
                                            >
                                                {cat.name}
                                            </h2>
                                            <div
                                                className="flex-1"
                                                style={{ height: '1px', background: 'linear-gradient(to right, rgba(45,106,45,0.18) 0%, transparent 100%)' }}
                                            />
                                        </div>
                                    </MotionDiv>
                                )}

                                {/* Grid de cards */}
                                <motion.div
                                    className="flex flex-col gap-5"
                                    initial="hidden"
                                    whileInView="visible"
                                    viewport={{ once: true, amount: 0, margin: '0px 0px 80px 0px' }}
                                    variants={staggerContainer}
                                >
                                    {items.map(product => (
                                        <motion.div key={product.id}>
                                            <ProductCard
                                                product={product}
                                                categoryName={cat.name}
                                                onOpenModal={() => setModalProduct(product)}
                                            />
                                        </motion.div>
                                    ))}
                                </motion.div>
                            </section>
                        );
                    })
                )}
            </div>

            {/* Modal de burger */}
            <AnimatePresence>
                {modalProduct && (
                    <ProductModal
                        key={modalProduct.id}
                        product={modalProduct}
                        extras={extras}
                        onClose={() => setModalProduct(null)}
                    />
                )}
            </AnimatePresence>
        </div>
    );
}
