import { useState, useEffect, useContext } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { OverlayCtx } from '../../context/overlayCtx';
import { PREMIUM_EASE } from '../../lib/motion';

/* ── Constants ─────────────────────────────────────────────── */
const G = '#2d6a2d';
const G_LIGHT = '#3a8a3a';
const G_GLOW = 'rgba(45,106,45,0.40)';

const DAY_LABELS_ES = {
    monday: 'Lunes', tuesday: 'Martes', wednesday: 'Miércoles',
    thursday: 'Jueves', friday: 'Viernes', saturday: 'Sábado', sunday: 'Domingo',
};
const DAY_ORDER = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
const TODAY_KEY = DAY_ORDER[new Date().getDay() === 0 ? 6 : new Date().getDay() - 1];
const SESSION_KEY = `bb_closed_dismissed_${new Date().toLocaleDateString('es-AR')}`;

/* ── Variants ───────────────────────────────────────────────── */
const backdropVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.3, ease: 'easeOut' } },
    exit:   { opacity: 0, transition: { duration: 0.22, ease: 'easeIn' } },
};

const cardVariants = {
    hidden: { opacity: 0, y: 28, scale: 0.97 },
    visible: { opacity: 1, y: 0, scale: 1, transition: { type: 'tween', duration: 0.5, ease: PREMIUM_EASE, delay: 0.08 } },
    exit:   { opacity: 0, y: 14, scale: 0.98, transition: { type: 'tween', duration: 0.22, ease: 'easeIn' } },
};

const stagger = {
    hidden: {},
    visible: { transition: { staggerChildren: 0.08, delayChildren: 0.22 } },
};

const fadeUp = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0, transition: { type: 'tween', duration: 0.4, ease: PREMIUM_EASE } },
};

/* ── Component ──────────────────────────────────────────────── */
export default function ClosedOverlay({ schedule }) {
    const [dismissed, setDismissed] = useState(
        () => sessionStorage.getItem(SESSION_KEY) === '1'
    );
    const { setActive } = useContext(OverlayCtx);
    const reduced = useReducedMotion();

    useEffect(() => {
        const alreadyDismissed = sessionStorage.getItem(SESSION_KEY) === '1';
        if (!alreadyDismissed) setActive(true);
        return () => setActive(false);
    }, [setActive]);

    const handleDismiss = () => {
        sessionStorage.setItem(SESSION_KEY, '1');
        setDismissed(true);
        setActive(false);
    };

    const rows = DAY_ORDER.map((key) => {
        const slot = schedule?.[key];
        return {
            key,
            label: DAY_LABELS_ES[key],
            text: slot?.open ? `${slot.from} — ${slot.to}` : 'Cerrado',
            isOpen: slot?.open ?? false,
            isToday: key === TODAY_KEY,
        };
    });

    return (
        <AnimatePresence>
            {!dismissed && (
                <motion.div
                    key="overlay"
                    variants={reduced ? {} : backdropVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    className="fixed inset-0 z-[9000] flex items-center justify-center px-4"
                    style={{ background: 'rgba(0,0,0,0.94)', backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)' }}
                    aria-modal="true"
                    role="dialog"
                    aria-label="Local cerrado"
                >
                    <motion.div
                        variants={reduced ? {} : cardVariants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        className="w-full max-w-sm flex flex-col items-center text-center"
                        style={{
                            background: '#111111',
                            border: '1px solid rgba(45,106,45,0.45)',
                            borderRadius: '28px',
                            overflow: 'hidden',
                            boxShadow: `0 0 0 1px rgba(255,255,255,0.05), 0 40px 80px rgba(0,0,0,0.8), 0 0 80px rgba(45,106,45,0.12)`,
                        }}
                    >
                        {/* Accent top bar */}
                        <div style={{ height: '3px', width: '100%', background: `linear-gradient(90deg, ${G}, ${G_LIGHT}, ${G})` }} />

                        <motion.div
                            variants={reduced ? {} : stagger}
                            initial="hidden"
                            animate="visible"
                            className="flex flex-col items-center px-7 pt-9 pb-7 gap-6 w-full"
                        >
                            {/* Logo */}
                            <motion.div variants={fadeUp}>
                                <img
                                    src="/LogoBurgersBossSinFondo.webp"
                                    alt="Burgers Boss"
                                    className="w-28 h-28 object-contain select-none"
                                    draggable="false"
                                    style={{ filter: 'drop-shadow(0 6px 20px rgba(0,0,0,0.6))' }}
                                />
                            </motion.div>

                            {/* Title */}
                            <motion.div variants={fadeUp} className="flex flex-col items-center gap-2.5">
                                <div style={{ height: '2px', width: '40px', background: G, borderRadius: '2px' }} />
                                <h2
                                    className="font-display uppercase leading-none select-none"
                                    style={{ fontSize: 'clamp(2.1rem, 9vw, 2.7rem)', color: '#ffffff', letterSpacing: '-0.01em' }}
                                >
                                    Estamos{' '}
                                    <span style={{ color: G }}>Cerrados</span>
                                </h2>
                                <p className="font-body text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.80)' }}>
                                    En este momento el local se encuentra cerrado.
                                </p>
                            </motion.div>

                            {/* Schedule */}
                            <motion.div
                                variants={fadeUp}
                                className="w-full rounded-2xl overflow-hidden"
                                style={{ border: '1px solid rgba(255,255,255,0.10)', background: 'rgba(255,255,255,0.04)' }}
                            >
                                {rows.map(({ key, label, text, isOpen, isToday }, i) => (
                                    <div
                                        key={key}
                                        className="flex justify-between items-center px-4 py-3"
                                        style={{
                                            borderBottom: i < rows.length - 1 ? '1px solid rgba(255,255,255,0.07)' : 'none',
                                            background: isToday ? 'rgba(45,106,45,0.18)' : 'transparent',
                                        }}
                                    >
                                        <span
                                            className="font-body text-[13px] flex items-center gap-2"
                                            style={{ color: '#ffffff', fontWeight: isToday ? 700 : 400 }}
                                        >
                                            {label}
                                            {isToday && (
                                                <span
                                                    className="text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded-full"
                                                    style={{ background: G, color: '#fff' }}
                                                >
                                                    hoy
                                                </span>
                                            )}
                                        </span>
                                        <span
                                            className="font-body text-[13px]"
                                            style={{
                                                color: isOpen ? (isToday ? G_LIGHT : '#ffffff') : 'rgba(255,255,255,0.40)',
                                                fontWeight: isOpen ? 600 : 400,
                                            }}
                                        >
                                            {text}
                                        </span>
                                    </div>
                                ))}
                            </motion.div>

                            {/* CTA */}
                            <motion.div variants={fadeUp} className="w-full flex flex-col gap-3">
                                <button
                                    onClick={handleDismiss}
                                    className="cursor-pointer w-full py-4 rounded-xl font-body font-bold text-sm uppercase tracking-widest transition-all active:scale-[0.97] hover:opacity-90"
                                    style={{
                                        background: G,
                                        color: '#ffffff',
                                        boxShadow: `0 4px 24px ${G_GLOW}`,
                                        minHeight: '52px',
                                    }}
                                >
                                    Ver menú de todas formas
                                </button>
                                <button
                                    onClick={handleDismiss}
                                    className="cursor-pointer w-full py-2 font-body text-xs uppercase tracking-widest transition-opacity hover:opacity-60"
                                    style={{ color: 'rgba(255,255,255,0.55)' }}
                                >
                                    Cerrar
                                </button>
                            </motion.div>
                        </motion.div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
