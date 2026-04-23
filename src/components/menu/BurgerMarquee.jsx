import { useRef, useState, useCallback } from 'react';

const IMAGES = [
    'WhatsApp Image 2026-04-20 at 2.15.34 PM.webp',
    'WhatsApp Image 2026-04-20 at 2.15.35 PM.webp',
    'WhatsApp Image 2026-04-20 at 2.15.35 PM (1).webp',
    'WhatsApp Image 2026-04-20 at 2.15.35 PM (2).webp',
    'WhatsApp Image 2026-04-20 at 2.15.35 PM (3).webp',
    'WhatsApp Image 2026-04-20 at 2.15.36 PM.webp',
    'WhatsApp Image 2026-04-20 at 2.15.36 PM (1).webp',
    'WhatsApp Image 2026-04-20 at 2.15.36 PM (2).webp',
    'WhatsApp Image 2026-04-20 at 2.19.26 PM.webp',
    'WhatsApp Image 2026-04-20 at 2.19.26 PM (1).webp',
    'WhatsApp Image 2026-04-20 at 2.19.27 PM.webp',
];

const toUrl = (n) => `/images/${encodeURIComponent(n)}`;
const DOUBLED = [...IMAGES, ...IMAGES];

/* Umbral en px para distinguir tap de scroll vertical */
const SCROLL_THRESHOLD = 10;

export default function BurgerMarquee() {
    const [paused, setPaused] = useState(false);
    const resumeTimer = useRef(null);
    const touchOrigin  = useRef(null); // { x, y } al inicio del toque
    const isScrolling  = useRef(false);

    /* ── Desktop ───────────────────────────────────── */
    const onMouseEnter = useCallback(() => {
        clearTimeout(resumeTimer.current);
        setPaused(true);
    }, []);

    const onMouseLeave = useCallback(() => {
        resumeTimer.current = setTimeout(() => setPaused(false), 120);
    }, []);

    /* ── Mobile — distingue tap de scroll ─────────── */
    const onTouchStart = useCallback((e) => {
        touchOrigin.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
        isScrolling.current = false;
        clearTimeout(resumeTimer.current);
        setPaused(true);
    }, []);

    const onTouchMove = useCallback((e) => {
        if (!touchOrigin.current) return;
        const dx = Math.abs(e.touches[0].clientX - touchOrigin.current.x);
        const dy = Math.abs(e.touches[0].clientY - touchOrigin.current.y);
        // Scroll vertical detectado → reanudar inmediatamente
        if (dy > SCROLL_THRESHOLD && dy > dx) {
            isScrolling.current = true;
            setPaused(false);
        }
    }, []);

    const onTouchEnd = useCallback(() => {
        touchOrigin.current = null;
        // Si fue scroll el carrusel ya se reanudó; si fue tap, reanudar con delay
        if (!isScrolling.current) {
            resumeTimer.current = setTimeout(() => setPaused(false), 600);
        }
        isScrolling.current = false;
    }, []);

    return (
        <div
            aria-label="Galería de hamburguesas"
            style={{
                margin: '2.2rem 0 2.8rem',
                /* Evita que el contenedor cree un stacking context innecesario */
                contain: 'layout style',
            }}
            onMouseEnter={onMouseEnter}
            onMouseLeave={onMouseLeave}
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
            onTouchCancel={onTouchEnd}
        >
            {/* Eyebrow */}
            <div className="flex items-center gap-4 pb-5">
                <div style={{ width: '28px', height: '2px', background: '#2d6a2d', flexShrink: 0 }} />
                <span
                    className="font-display uppercase select-none shrink-0"
                    style={{ fontSize: '0.58rem', letterSpacing: '0.44em', color: '#2d6a2d' }}
                >
                    NUESTRAS CREACIONES
                </span>
                <div style={{ flex: 1, height: '1px', background: 'rgba(0,0,0,0.08)' }} />
            </div>

            {/* Strip */}
            <div style={{ overflow: 'hidden', marginLeft: '-20px', marginRight: '-20px' }}>
                <div
                    className="burger-marquee-track"
                    style={{
                        display: 'flex',
                        gap: '12px',
                        width: 'max-content',
                        paddingLeft: '12px',
                        animationPlayState: paused ? 'paused' : 'running',
                        /* Scroll vertical nativo — no interfiere con el carrusel */
                        touchAction: 'pan-y',
                    }}
                >
                    {DOUBLED.map((file, i) => (
                        <div
                            key={i}
                            className="burger-tile"
                            style={{
                                width: '220px',
                                height: '220px',
                                borderRadius: '20px',
                                overflow: 'hidden',
                                flexShrink: 0,
                                border: '1px solid rgba(0,0,0,0.06)',
                                boxShadow: '0 6px 20px rgba(0,0,0,0.09), 0 2px 6px rgba(0,0,0,0.05)',
                                /* Cada tile en su propia capa GPU */
                                transform: 'translateZ(0)',
                            }}
                        >
                            <img
                                src={toUrl(file)}
                                alt=""
                                loading={i < 5 ? 'eager' : 'lazy'}
                                decoding="async"
                                draggable="false"
                                style={{
                                    width: '100%',
                                    height: '100%',
                                    objectFit: 'cover',
                                    objectPosition: 'center',
                                    display: 'block',
                                    userSelect: 'none',
                                    pointerEvents: 'none', // el tile maneja los eventos, no la imagen
                                }}
                            />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
