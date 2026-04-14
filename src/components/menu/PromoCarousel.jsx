import { useState, useRef, useEffect, useCallback, memo } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import { usePromotions } from '../../hooks/usePromotions';
import { lineStagger, lineSlideUp, VIEWPORT } from '../../lib/motion';

/* ── Heading (shared between single & multi) ── */
function Heading() {
    return (
        <motion.div
            className="text-center mb-8 px-4 sm:px-6"
            initial="hidden"
            whileInView="visible"
            viewport={VIEWPORT}
            variants={lineStagger}
        >
            <motion.span
                className="block font-display font-bold uppercase text-4xl sm:text-5xl md:text-6xl leading-[1.05]"
                style={{ color: '#0a0a0a' }}
                variants={lineSlideUp}
            >
                Conocé nuestras
            </motion.span>
            <motion.span
                className="block font-display font-bold uppercase text-primary text-4xl sm:text-5xl md:text-6xl leading-[1.05] mt-1"
                variants={lineSlideUp}
            >
                promos
            </motion.span>
        </motion.div>
    );
}

/* ── Promo image card ── */
const PromoCard = memo(function PromoCard({ promo, onClick, single }) {
    const [loaded, setLoaded] = useState(false);
    return (
        <button
            onClick={onClick}
            className={`cursor-pointer rounded-2xl overflow-hidden border-none p-0 transition-shadow duration-300 hover:shadow-[0_8px_24px_rgba(255,255,255,0.08)] active:scale-[0.97] ${single ? 'w-full max-w-md' : 'shrink-0'}`}
            aria-label={`Ver promo: ${promo.title}`}
        >
            <div className={`rounded-2xl overflow-hidden ${!loaded ? 'bg-white/5 animate-pulse' : ''}`}
                 style={{ height: single ? 'min(calc(var(--stable-vh) * 0.55), 420px)' : 'min(calc(var(--stable-vh) * 0.5), 360px)' }}>
                <img
                    src={promo.image_url}
                    alt={promo.title}
                    className={`block h-full rounded-2xl object-cover transition-opacity duration-300 ${loaded ? 'opacity-100' : 'opacity-0'} ${single ? 'w-full' : 'w-auto'}`}
                    loading="lazy"
                    decoding="async"
                    onLoad={() => setLoaded(true)}
                />
            </div>
        </button>
    );
});

export default function PromoCarousel() {
    const { promotions, loading } = usePromotions(false);
    const trackRef = useRef(null);
    const [lightbox, setLightbox] = useState(null);
    const [trackWidth, setTrackWidth] = useState(0);
    const [paused, setPaused] = useState(false);

    const count = promotions.length;
    const GAP = 12;

    /* ── Measure one full set width (ResizeObserver fires after images load) ── */
    useEffect(() => {
        if (count <= 1) return;
        const track = trackRef.current;
        if (!track) return;

        const measure = () => {
            let w = 0;
            for (let i = 0; i < count; i++) {
                const child = track.children[i];
                if (child) w += child.offsetWidth + GAP;
            }
            if (w > 0) setTrackWidth(w);
        };

        // ResizeObserver: fires immediately and re-fires whenever a card resizes
        // (e.g. after lazy images load and change the card's intrinsic width)
        const ro = new ResizeObserver(measure);
        for (let i = 0; i < count; i++) {
            if (track.children[i]) ro.observe(track.children[i]);
        }
        measure(); // initial synchronous pass

        return () => ro.disconnect();
    }, [count, promotions]);

    /* ── Lightbox ── */
    const openLightbox = useCallback((index) => {
        setPaused(true);
        setLightbox(index % count);
        document.body.style.overflow = 'hidden';
    }, [count]);

    const closeLightbox = useCallback(() => {
        setLightbox(null);
        document.body.style.overflow = '';
        setTimeout(() => { setPaused(false); }, 500);
    }, []);

    const lightboxPrev = useCallback(() => {
        setLightbox(prev => (prev - 1 + count) % count);
    }, [count]);

    const lightboxNext = useCallback(() => {
        setLightbox(prev => (prev + 1) % count);
    }, [count]);

    useEffect(() => {
        if (lightbox === null) return;
        const handleKey = (e) => {
            if (e.key === 'Escape') closeLightbox();
            if (e.key === 'ArrowLeft') lightboxPrev();
            if (e.key === 'ArrowRight') lightboxNext();
        };
        document.addEventListener('keydown', handleKey);
        return () => document.removeEventListener('keydown', handleKey);
    }, [lightbox, closeLightbox, lightboxPrev, lightboxNext]);

    if (loading || count === 0) return null;

    /* ── Single promo — static, no marquee ── */
    if (count === 1) {
        return (
            <div style={{ background: '#F5F0E8' }} className="py-8">
                <div className="max-w-6xl mx-auto">
                    <Heading />
                    <div className="px-4 sm:px-6 flex justify-center">
                        <PromoCard
                            promo={promotions[0]}
                            onClick={() => openLightbox(0)}
                            single
                        />
                    </div>
                </div>
                {lightbox !== null && createPortal(
                    <Lightbox
                        promotions={promotions}
                        index={lightbox}
                        count={count}
                        onClose={closeLightbox}
                        onPrev={lightboxPrev}
                        onNext={lightboxNext}
                    />,
                    document.body
                )}
            </div>
        );
    }

    /* ── Multiple promos — infinite marquee ── */
    const items = [...promotions, ...promotions, ...promotions];

    /* CSS animation: duration = distance / speed. SPEED ~0.4px/frame@60fps = 24px/s */
    const duration = trackWidth > 0 ? trackWidth / 24 : 0;

    return (
        <div style={{ background: '#F5F0E8' }} className="py-8">
            <div className="max-w-6xl mx-auto">
                <Heading />

                {/* Marquee container */}
                <div
                    className="relative overflow-hidden"
                    role="region"
                    aria-label="Carrusel de promociones"
                >
                    {/* Track — moves via CSS animation (runs on compositor thread) */}
                    <div
                        ref={trackRef}
                        className="flex gap-3 promo-track"
                        style={trackWidth > 0 ? {
                            '--marquee-dist': `-${trackWidth}px`,
                            animation: `promo-marquee ${duration}s linear infinite`,
                            animationPlayState: paused ? 'paused' : 'running',
                        } : undefined}
                    >
                        {items.map((promo, i) => (
                            <PromoCard
                                key={`${promo.id}-${i}`}
                                promo={promo}
                                onClick={() => openLightbox(i)}
                            />
                        ))}
                    </div>

                    {/* Edge fade gradients — blancas */}
                    <div
                        className="absolute inset-y-0 left-0 w-10 pointer-events-none z-[1]"
                        style={{ background: 'linear-gradient(to right, #F5F0E8 0%, transparent 100%)' }}
                    />
                    <div
                        className="absolute inset-y-0 right-0 w-10 pointer-events-none z-[1]"
                        style={{ background: 'linear-gradient(to left, #F5F0E8 0%, transparent 100%)' }}
                    />
                </div>
            </div>

            {/* Lightbox */}
            {lightbox !== null && createPortal(
                <Lightbox
                    promotions={promotions}
                    index={lightbox}
                    count={count}
                    onClose={closeLightbox}
                    onPrev={lightboxPrev}
                    onNext={lightboxNext}
                />,
                document.body
            )}
        </div>
    );
}

/* ── Lightbox Component ── */
const Lightbox = memo(function Lightbox({ promotions, index, count, onClose, onPrev, onNext }) {
    const [closing, setClosing] = useState(false);
    const backdropRef = useRef(null);
    const startX = useRef(null);

    const handleClose = () => {
        setClosing(true);
        setTimeout(() => onClose(), 200);
    };

    const handleTouchStart = (e) => { startX.current = e.touches[0].clientX; };
    const handleTouchEnd = (e) => {
        if (startX.current === null) return;
        const diff = e.changedTouches[0].clientX - startX.current;
        if (Math.abs(diff) > 60) {
            diff > 0 ? onPrev() : onNext();
        }
        startX.current = null;
    };

    const promo = promotions[index];

    return (
        <div
            ref={backdropRef}
            onClick={(e) => e.target === backdropRef.current && handleClose()}
            className={`fixed inset-0 z-[70] flex items-center justify-center ${closing ? 'animate-fade-out' : 'animate-fade-in'}`}
            style={{ background: 'rgba(0,0,0,0.92)', WebkitBackdropFilter: 'blur(8px)', backdropFilter: 'blur(8px)' }}
            role="dialog"
            aria-modal="true"
            aria-label={`Promo: ${promo.title}`}
        >
            {/* Close */}
            <button
                onClick={handleClose}
                className="cursor-pointer absolute top-4 right-4 z-10 p-2.5 rounded-full bg-white/10 text-white hover:bg-white/20 transition-all active:scale-90"
                aria-label="Cerrar"
            >
                <X className="w-5 h-5" />
            </button>

            {/* Counter */}
            {count > 1 && (
                <div className="absolute top-5 left-1/2 -translate-x-1/2 z-10 text-white/50 text-xs font-semibold tracking-widest select-none">
                    {index + 1} / {count}
                </div>
            )}

            {/* Arrows — desktop */}
            {count > 1 && (
                <>
                    <button
                        onClick={onPrev}
                        className="cursor-pointer hidden sm:flex absolute left-4 top-1/2 -translate-y-1/2 z-10 p-2.5 rounded-full bg-white/10 text-white hover:bg-white/20 transition-all active:scale-90"
                        aria-label="Anterior"
                    >
                        <ChevronLeft className="w-5 h-5" />
                    </button>
                    <button
                        onClick={onNext}
                        className="cursor-pointer hidden sm:flex absolute right-4 top-1/2 -translate-y-1/2 z-10 p-2.5 rounded-full bg-white/10 text-white hover:bg-white/20 transition-all active:scale-90"
                        aria-label="Siguiente"
                    >
                        <ChevronRight className="w-5 h-5" />
                    </button>
                </>
            )}

            {/* Image */}
            <div
                className={`w-full max-w-lg mx-4 ${closing ? 'animate-slide-down' : 'animate-slide-up'}`}
                onTouchStart={handleTouchStart}
                onTouchEnd={handleTouchEnd}
            >
                <img
                    src={promo.image_url}
                    alt={promo.title}
                    className="w-full h-auto rounded-2xl shadow-2xl select-none"
                    style={{ maxHeight: 'calc(var(--stable-vh) * 0.85)', objectFit: 'contain' }}
                    draggable={false}
                />
            </div>
        </div>
    );
});
