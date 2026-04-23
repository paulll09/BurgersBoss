import { motion } from 'framer-motion';
import { fadeUp, VIEWPORT } from '../../lib/motion';

/* ── Constantes ──────────────────────────────────────────────── */
const MARQUEE_ITEMS = [
    'Burgers Boss',
    'Corrientes Capital',
    'Pitágoras 4311',
    '20:30 — 01:00',
    'Delivery & Retiro',
    'Lunes a Domingo',
];

/* ── Sub-componentes ─────────────────────────────────────────── */
const IconInstagram = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
        strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 flex-shrink-0">
        <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
        <circle cx="12" cy="12" r="4"/>
        <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none"/>
    </svg>
);

const AQLogoSvg = () => (
    <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 flex-shrink-0">
        <circle cx="20" cy="20" r="19" stroke="rgba(255,255,255,0.35)" strokeWidth="1"/>
        <text x="50%" y="53%" dominantBaseline="middle" textAnchor="middle"
            fill="white" fontSize="13" fontFamily="system-ui, sans-serif" fontWeight="700" letterSpacing="-0.5">
            AQ
        </text>
    </svg>
);

function MarqueeStrip() {
    const repeated = [...MARQUEE_ITEMS, ...MARQUEE_ITEMS, ...MARQUEE_ITEMS];
    return (
        <div className="overflow-hidden" style={{
            background: '#0d0d0d',
            borderTop: '1px solid rgba(255,255,255,0.06)',
            borderBottom: '1px solid rgba(255,255,255,0.06)',
            padding: '11px 0',
        }}>
            <div className="flex whitespace-nowrap animate-footer-marquee">
                {repeated.map((item, i) => (
                    <span key={i}
                        className="inline-flex items-center gap-3.5 px-5 text-[10px] font-bold uppercase tracking-[0.25em] flex-shrink-0"
                        style={{ color: 'rgba(255,255,255,0.30)' }}
                    >
                        <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: '#2d6a2d' }} />
                        {item}
                    </span>
                ))}
            </div>
        </div>
    );
}

/* ════════════════════════════════════════════════════════════════
   FOOTER
════════════════════════════════════════════════════════════════ */
export default function Footer() {
    return (
        <footer className="mt-auto" style={{ background: '#0a0a0a' }}>

            {/* ── Cuerpo principal ─────────────────────────────── */}
            <div className="max-w-6xl mx-auto px-5 sm:px-8 pt-16 pb-0">
                <motion.div
                    initial="hidden"
                    whileInView="visible"
                    viewport={VIEWPORT}
                    variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.10 } } }}
                >

                    {/* ── Bloque de marca ────────────────────────── */}
                    <motion.div
                        variants={fadeUp}
                        className="flex items-start justify-between gap-6 mb-12 sm:mb-16"
                    >
                        <div>
                            {/* Línea ámbar */}
                            <div style={{
                                height: '2px',
                                width: '40px',
                                background: '#2d6a2d',
                                marginBottom: '1.5rem',
                            }} />

                            {/* Nombre de marca */}
                            <h2
                                className="font-display uppercase select-none"
                                style={{
                                    fontSize: 'clamp(3.8rem, 21vw, 9.5rem)',
                                    lineHeight: 0.86,
                                    color: '#ffffff',
                                    letterSpacing: '-0.01em',
                                }}
                            >
                                Burgers<br />
                                <span style={{ color: '#2d6a2d' }}>Boss.</span>
                            </h2>

                            {/* Tagline */}
                            <p
                                className="font-headline italic mt-4 select-none"
                                style={{
                                    color: 'rgba(255,255,255,0.36)',
                                    fontSize: 'clamp(0.95rem, 3vw, 1.2rem)',
                                    lineHeight: 1.4,
                                }}
                            >
                                El jefe del sabor en Corrientes.
                            </p>
                        </div>

                        {/* Logo flotando a la derecha */}
                        <img
                            src="/LogoBurgersBossSinFondo.webp"
                            alt="Burgers Boss"
                            className="w-20 sm:w-28 h-auto object-contain flex-shrink-0"
                            style={{ marginTop: '3rem', opacity: 0.75 }}
                            draggable="false"
                        />
                    </motion.div>

                    {/* ── Grid de info ────────────────────────────── */}
                    <div
                        className="grid grid-cols-1 sm:grid-cols-3"
                        style={{ borderTop: '1px solid rgba(255,255,255,0.07)', borderBottom: '1px solid rgba(255,255,255,0.07)' }}
                    >
                        {/* Ubicación */}
                        <motion.a
                            variants={fadeUp}
                            href="https://www.google.com/maps/search/Pit%C3%A1goras+4311+Corrientes+Argentina"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex flex-col py-8 sm:pr-8 footer-info-link footer-col"
                            style={{ textDecoration: 'none' }}
                        >
                            <span
                                className="font-bold uppercase mb-3 select-none"
                                style={{ fontSize: '0.7rem', letterSpacing: '0.25em', color: '#2d6a2d' }}
                            >
                                Dónde estamos
                            </span>
                            <span
                                className="font-display uppercase text-white"
                                style={{ fontSize: 'clamp(1.5rem, 6.5vw, 2.1rem)', lineHeight: 1, letterSpacing: '0.01em' }}
                            >
                                Pitágoras 4311
                            </span>
                            <span
                                className="mt-2"
                                style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.40)' }}
                            >
                                Corrientes Capital
                            </span>
                        </motion.a>

                        {/* Horarios */}
                        <motion.div
                            variants={fadeUp}
                            className="flex flex-col py-8 sm:px-8 footer-col footer-col-mid"
                        >
                            <span
                                className="font-bold uppercase mb-3 select-none"
                                style={{ fontSize: '0.7rem', letterSpacing: '0.25em', color: '#2d6a2d' }}
                            >
                                Horarios
                            </span>
                            <span
                                className="font-display uppercase text-white"
                                style={{ fontSize: 'clamp(1.5rem, 6.5vw, 2.1rem)', lineHeight: 1, letterSpacing: '0.01em' }}
                            >
                                20:30 — 01:00
                            </span>
                            <span
                                className="mt-2"
                                style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.40)' }}
                            >
                                Lunes a Domingo
                            </span>
                        </motion.div>

                        {/* Redes */}
                        <motion.div
                            variants={fadeUp}
                            className="flex flex-col py-8 sm:pl-8 footer-col"
                        >
                            <span
                                className="font-bold uppercase mb-3 select-none"
                                style={{ fontSize: '0.7rem', letterSpacing: '0.25em', color: '#2d6a2d' }}
                            >
                                Seguinos
                            </span>
                            <a
                                href="http://instagram.com/burgers.boss_/"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-3 w-fit footer-ig-link"
                                style={{ textDecoration: 'none' }}
                            >
                                <span
                                    className="flex items-center justify-center w-9 h-9 rounded-full flex-shrink-0 footer-ig-icon"
                                    style={{ background: 'rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.55)' }}
                                >
                                    <IconInstagram />
                                </span>
                                <span
                                    className="font-display uppercase text-white"
                                    style={{ fontSize: 'clamp(1.3rem, 5.5vw, 1.8rem)', lineHeight: 1 }}
                                >
                                    @burgers.boss_
                                </span>
                            </a>
                            <span
                                className="mt-2"
                                style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.40)' }}
                            >
                                Instagram
                            </span>
                        </motion.div>
                    </div>

                </motion.div>
            </div>

            {/* ── Marquee ──────────────────────────────────────── */}
            <div className="mt-0">
                <MarqueeStrip />
            </div>

            {/* ── Copyright ────────────────────────────────────── */}
            <div
                className="px-5 sm:px-8 py-5 flex flex-col sm:flex-row items-center justify-between gap-3"
                style={{ background: '#060606' }}
            >
                <p className="text-xs" style={{ color: 'rgba(255,255,255,0.18)' }}>
                    © {new Date().getFullYear()} Burgers Boss. Todos los derechos reservados.
                </p>
                <a
                    href="https://www.aqtech.com.ar"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 transition-opacity hover:opacity-80"
                    style={{ color: 'rgba(255,255,255,0.25)' }}
                >
                    <span className="text-xs">Desarrollado por</span>
                    <AQLogoSvg />
                    <span className="text-xs font-semibold tracking-wide" style={{ color: 'rgba(255,255,255,0.42)' }}>
                        AQ Tech
                    </span>
                </a>
            </div>

        </footer>
    );
}
