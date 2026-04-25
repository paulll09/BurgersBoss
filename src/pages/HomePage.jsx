import { useContext } from 'react';
import { motion } from 'framer-motion';
import { Motorbike, ChevronRight } from 'lucide-react';
import HeroSection from '../components/layout/HeroSection';
import BurgerMarquee from '../components/menu/BurgerMarquee';
import Menu from '../components/menu/Menu';
import ClosedOverlay from '../components/layout/ClosedOverlay';
import { BarCtx } from '../context/barCtx';
import { useProducts } from '../hooks/useProducts';
import { VIEWPORT } from '../lib/motion';

/* ── Ease compartida ─────────────────────────────────────────── */
const EASE = [0.22, 1, 0.36, 1];

/* ── Watermark BOSS — tile con rotación en el SVG (sin CSS transform) ── */
const BOSS_TILE = encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="280" height="120">' +
    '<text x="14" y="82" font-family="Arial Black,Arial" font-size="62" font-weight="900" ' +
    'fill="rgba(0,0,0,0.028)" letter-spacing="6" transform="rotate(-16,140,60)">BOSS</text></svg>'
);

/* ── SVG Icons ───────────────────────────────────────────────── */
const IconPickup = () => (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
        <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>
    </svg>
);
const IconMoto = () => <Motorbike className="w-6 h-6" />;
const IconClock = () => (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
        <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zm4.2 14.2L11 13V7h1.5v5.2l4.5 2.7-.8 1.3z"/>
    </svg>
);

/* ════════════════════════════════════════════════════════════════
   DATOS
════════════════════════════════════════════════════════════════ */
const STATS = [
    { icon: <IconPickup />, label: 'Dónde retirar',    value: 'Pitágoras 4311',      sub: 'Corrientes Capital',   href: 'https://www.google.com/maps/search/Pit%C3%A1goras+4311+Corrientes+Argentina' },
    { icon: <IconMoto />,   label: 'Envío a domicilio', value: 'Delivery disponible', sub: 'En toda la capital',   href: null },
    { icon: <IconClock />,  label: 'Horarios',          value: '20:30 — 01:00',       sub: 'Lunes a Domingo',      href: null },
];

/* ════════════════════════════════════════════════════════════════
   COMPONENTE
════════════════════════════════════════════════════════════════ */
export default function HomePage() {
    const { isOpen, schedule } = useContext(BarCtx);
    const showOverlay = !isOpen && schedule !== null;
    const { products, categories, loading, error, refetch } = useProducts(false);

    const scrollToMenu = () =>
        document.getElementById('menu')?.scrollIntoView({ behavior: 'smooth', block: 'start' });

    /* Temas de color para los 3 bloques de stats */
    const STAT_THEMES = [
        {
            bg: '#1a4a1a',
            labelColor: 'rgba(255,255,255,0.52)',
            valueColor: '#ffffff',
            subColor: 'rgba(255,255,255,0.65)',
            iconBg: 'rgba(255,255,255,0.10)',
            iconColor: '#ffffff',
        },
        {
            bg: '#1a4a1a',
            labelColor: 'rgba(255,255,255,0.52)',
            valueColor: '#ffffff',
            subColor: 'rgba(255,255,255,0.65)',
            iconBg: 'rgba(255,255,255,0.10)',
            iconColor: '#ffffff',
        },
        {
            bg: '#1a4a1a',
            labelColor: 'rgba(255,255,255,0.52)',
            valueColor: '#ffffff',
            subColor: 'rgba(255,255,255,0.65)',
            iconBg: 'rgba(255,255,255,0.10)',
            iconColor: '#ffffff',
        },
    ];

    return (
        <>
            {showOverlay && <ClosedOverlay schedule={schedule} />}
            <HeroSection />

            {/* ══════════════════════════════════════════════════════
                SECCIÓN PRINCIPAL — Bold & Urban
            ══════════════════════════════════════════════════════ */}
            <motion.section
                className="relative boss-watermark"
                style={{
                    backgroundColor: '#F5F0E8',
                    backgroundImage: `url("data:image/svg+xml,${BOSS_TILE}")`,
                    backgroundRepeat: 'repeat',
                    backgroundSize: '280px 120px',
                    borderRadius: '28px 28px 0 0',
                }}
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true, amount: 0.04 }}
                transition={{ duration: 0.65, ease: EASE }}
            >

                {/* ── BLOQUE HEADLINE ──────────────────────────────── */}
                <div className="relative overflow-hidden" style={{ background: 'transparent' }}>

                    {/* Contenido headline */}
                    <div className="relative px-5 pt-14 pb-0" style={{ zIndex: 1 }}>

                        {/* Eyebrow */}
                        <motion.p
                            className="font-display uppercase select-none mb-5"
                            style={{ fontSize: '0.60rem', letterSpacing: '0.42em', color: '#2d6a2d' }}
                            initial={{ opacity: 0, y: 16 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={VIEWPORT}
                            transition={{ duration: 0.55, ease: EASE, delay: 0 }}
                        >
                            BURGERS BOSS · CORRIENTES CAPITAL
                        </motion.p>

                        {/* HEADLINE — 3 líneas dramáticas, animación directa */}
                        <div aria-label="El jefe del sabor en Corrientes">

                            {/* Línea 1: EL JEFE — negro */}
                            <motion.span
                                className="block font-display uppercase select-none"
                                style={{
                                    fontSize: 'clamp(5.2rem, 26vw, 12rem)',
                                    color: '#0a0a0a',
                                    letterSpacing: '-0.02em',
                                    lineHeight: 0.86,
                                }}
                                initial={{ opacity: 0, y: 48 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={VIEWPORT}
                                transition={{ duration: 0.70, ease: EASE, delay: 0.06 }}
                            >
                                EL JEFE
                            </motion.span>

                            {/* Línea 2: del sabor en — cursiva verde, offset */}
                            <motion.span
                                className="block font-headline italic select-none"
                                style={{
                                    fontSize: 'clamp(1.8rem, 8vw, 3.8rem)',
                                    color: '#2d6a2d',
                                    lineHeight: 1.15,
                                    paddingLeft: '0.15em',
                                    paddingTop: '0.04em',
                                    paddingBottom: '0.04em',
                                }}
                                initial={{ opacity: 0, x: -24 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                viewport={VIEWPORT}
                                transition={{ duration: 0.60, ease: EASE, delay: 0.18 }}
                            >
                                del sabor en
                            </motion.span>

                            {/* Línea 3: CORRIENTES — ámbar */}
                            <motion.span
                                className="block font-display uppercase select-none"
                                style={{
                                    fontSize: 'clamp(3.4rem, 17vw, 8rem)',
                                    color: '#F59E0B',
                                    letterSpacing: '-0.01em',
                                    lineHeight: 0.88,
                                }}
                                initial={{ opacity: 0, y: 48 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={VIEWPORT}
                                transition={{ duration: 0.70, ease: EASE, delay: 0.30 }}
                            >
                                CORRIENTES
                            </motion.span>
                        </div>
                    </div>

                    {/* Párrafo + CTA */}
                    <motion.div
                        className="relative px-5 pt-10 pb-12"
                        style={{ zIndex: 1 }}
                        initial={{ opacity: 0, y: 24 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={VIEWPORT}
                        transition={{ duration: 0.68, ease: EASE, delay: 0.24 }}
                    >
                        {/* Línea ámbar decorativa */}
                        <motion.div
                            initial={{ scaleX: 0 }}
                            whileInView={{ scaleX: 1 }}
                            viewport={VIEWPORT}
                            transition={{ duration: 0.6, ease: EASE, delay: 0.32 }}
                            style={{
                                height: '3px',
                                width: '48px',
                                background: '#F59E0B',
                                transformOrigin: 'left',
                                marginBottom: '1.2rem',
                            }}
                        />

                        <p style={{ fontSize: '1.08rem', color: '#444444', lineHeight: 1.84, marginBottom: '0', maxWidth: '380px' }}>
                            No somos una hamburguesería más. En Burger Boss, cada ingrediente es
                            seleccionado para crear una experiencia de sabor dominante. Carne{' '}
                            <span style={{ fontWeight: 700, color: '#1a4a1a' }}>100% vacuna</span>,
                            pan artesanal y ese toque secreto que{' '}
                            <span style={{ fontWeight: 700, color: '#1a4a1a' }}>solo el jefe conoce.</span>
                        </p>

                        {/* Galería marquee */}
                        <BurgerMarquee />

                        {/* Botón CTA */}
                        <button
                            onClick={scrollToMenu}
                            className="cursor-pointer font-display uppercase active:scale-95 transition-transform duration-150"
                            style={{
                                fontSize: '0.80rem',
                                letterSpacing: '0.20em',
                                background: '#1a4a1a',
                                color: '#ffffff',
                                padding: '14px 32px',
                                borderRadius: '999px',
                                boxShadow: '0 4px 24px rgba(26,74,26,0.28)',
                                border: 'none',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '8px',
                                marginTop: '0.75rem',
                            }}
                        >
                            Ver el Menú
                            <span style={{ fontSize: '1rem', lineHeight: 1 }}>→</span>
                        </button>
                    </motion.div>
                </div>

                {/* ── BLOQUES STATS ───────────────────────────────── */}
                <div className="flex flex-col">
                    {STATS.map(({ icon, label, value, sub, href }, i) => {
                        const Tag = href ? motion.a : motion.div;
                        return (
                            <Tag
                                key={label}
                                {...(href ? { href, target: '_blank', rel: 'noopener noreferrer' } : {})}
                                className="flex items-center gap-5 px-6 py-7"
                                style={{
                                    background: 'rgba(245,240,232,0.96)',
                                    borderTop: i > 0 ? '1px solid rgba(0,0,0,0.08)' : 'none',
                                    textDecoration: 'none',
                                    cursor: href ? 'pointer' : 'default',
                                    position: 'relative',
                                    overflow: 'hidden',
                                }}
                                initial={{ opacity: 0, x: -36 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                viewport={VIEWPORT}
                                transition={{ duration: 0.60, ease: EASE, delay: 0.08 + i * 0.14 }}
                                {...(href ? {
                                    whileHover: { x: 5, backgroundColor: 'rgba(45,106,45,0.05)' },
                                    transition: { duration: 0.60, ease: EASE, delay: 0.08 + i * 0.14 },
                                } : {})}
                            >
                                {/* Acento verde izquierdo — solo en el bloque clickeable */}
                                {href && (
                                    <motion.div
                                        style={{
                                            position: 'absolute', left: 0, top: '20%', bottom: '20%',
                                            width: '3px', borderRadius: '0 3px 3px 0',
                                            background: '#2d6a2d',
                                        }}
                                        initial={{ scaleY: 0 }}
                                        whileInView={{ scaleY: 1 }}
                                        viewport={VIEWPORT}
                                        transition={{ duration: 0.45, ease: EASE, delay: 0.30 }}
                                    />
                                )}

                                {/* Ícono — solo verde, sin caja */}
                                <div
                                    className="flex items-center justify-center flex-shrink-0"
                                    style={{ color: '#2d6a2d', width: '28px' }}
                                >
                                    {icon}
                                </div>

                                {/* Texto */}
                                <div className="flex-1 min-w-0">
                                    <p
                                        className="font-bold uppercase"
                                        style={{ fontSize: '0.56rem', letterSpacing: '0.32em', color: 'rgba(0,0,0,0.38)', marginBottom: '4px' }}
                                    >
                                        {label}
                                    </p>
                                    <p
                                        className="font-display uppercase leading-none"
                                        style={{ fontSize: 'clamp(1.3rem, 6vw, 2rem)', color: '#111111' }}
                                    >
                                        {value}
                                    </p>
                                    <p className="text-sm" style={{ color: 'rgba(0,0,0,0.50)', marginTop: '4px' }}>
                                        {sub}
                                    </p>
                                </div>

                                {/* Flecha — solo en el bloque clickeable */}
                                {href && (
                                    <motion.div
                                        style={{ color: '#2d6a2d', flexShrink: 0 }}
                                        animate={{ x: [0, 4, 0] }}
                                        transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut', repeatDelay: 1 }}
                                    >
                                        <ChevronRight className="w-5 h-5" />
                                    </motion.div>
                                )}
                            </Tag>
                        );
                    })}
                </div>

            </motion.section>

            <Menu
                products={products}
                categories={categories}
                loading={loading}
                error={error}
                refetch={refetch}
            />
        </>
    );
}
