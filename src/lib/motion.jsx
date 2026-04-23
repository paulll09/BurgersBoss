import { motion, useReducedMotion } from 'framer-motion';

// ── Premium easing curve ───────────────────
// Fast start, very smooth deceleration — feels "premium"
export const PREMIUM_EASE = [0.22, 1, 0.36, 1];

// ── Shared viewport config ─────────────────
// once:true → anima solo al entrar, no al salir (performance)
// amount:0.12 → dispara antes para que se vea suave en mobile
// margin negativo → dispara antes de llegar al borde inferior
export const VIEWPORT = { once: true, amount: 0.12, margin: '0px 0px -32px 0px' };

// ── Variants ───────────────────────────────

export const fadeUp = {
    hidden: { opacity: 0, y: 24 },
    visible: {
        opacity: 1,
        y: 0,
        transition: { type: 'tween', duration: 0.6, ease: PREMIUM_EASE },
    },
};

export const scaleIn = {
    hidden: { opacity: 0, scale: 0.9 },
    visible: {
        opacity: 1,
        scale: 1,
        transition: { type: 'tween', duration: 0.5, ease: PREMIUM_EASE },
    },
};

export const slideLeft = {
    hidden: { opacity: 0, x: -36 },
    visible: {
        opacity: 1,
        x: 0,
        transition: { type: 'tween', duration: 0.55, ease: PREMIUM_EASE },
    },
};

export const staggerContainer = {
    hidden: {},
    visible: {
        transition: { staggerChildren: 0.07, delayChildren: 0.05 },
    },
};

// ── Hero panel slide-up variant ────────────
export const heroPanel = {
    hidden: { opacity: 0, y: '100%' },
    visible: {
        opacity: 1,
        y: 0,
        transition: { type: 'tween', duration: 0.6, ease: PREMIUM_EASE },
    },
};

export const heroStagger = {
    hidden: {},
    visible: {
        transition: { staggerChildren: 0.15 },
    },
};

// ── Text section variants ──────────────────

export const lineStagger = {
    hidden: {},
    visible: {
        transition: { staggerChildren: 0.12 },
    },
};

export const lineSlideUp = {
    hidden: { opacity: 0, y: 32 },
    visible: {
        opacity: 1,
        y: 0,
        transition: { type: 'tween', duration: 0.5, ease: PREMIUM_EASE },
    },
};

export const iconStagger = {
    hidden: {},
    visible: {
        transition: { staggerChildren: 0.2 },
    },
};

export const iconFadeUp = {
    hidden: { opacity: 0, y: 16 },
    visible: {
        opacity: 1,
        y: 0,
        transition: { type: 'tween', duration: 0.5, ease: PREMIUM_EASE },
    },
};

export const popIn = {
    hidden: { opacity: 0, scale: 0.85 },
    visible: {
        opacity: 1,
        scale: 1,
        transition: { type: 'tween', duration: 0.45, ease: [0.34, 1.56, 0.64, 1] },
    },
};

// ── Reusable MotionDiv wrapper ─────────────
// Animates children when they enter the viewport (once).
// Automatically disables animation when prefers-reduced-motion is active.
export function MotionDiv({ variants: v = fadeUp, className, style, children, ...rest }) {
    const reduced = useReducedMotion();

    return (
        <motion.div
            className={className}
            style={style}
            variants={v}
            initial={reduced ? 'visible' : 'hidden'}
            whileInView="visible"
            viewport={VIEWPORT}
            {...rest}
        >
            {children}
        </motion.div>
    );
}
