import { useEffect } from 'react';
import { motion } from 'framer-motion';

export default function Loader({ onComplete }) {
    useEffect(() => {
        const t = setTimeout(() => onComplete?.(), 1400);
        return () => clearTimeout(t);
    }, []);

    return (
        <motion.div
            className="fixed inset-0 z-[9999] flex items-center justify-center"
            style={{ background: '#000' }}
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.45, ease: 'easeInOut' }}
        >
            <div className="flex flex-col items-center">
                <img
                    src="/LogoBurgersBossSinFondo.webp"
                    alt="Burgers Boss"
                    className="object-contain animate-loader-bounce"
                    style={{ width: '140px', height: 'auto' }}
                    draggable="false"
                />
                <p className="mt-6 text-white/50 text-xs font-display tracking-[0.35em] uppercase flex items-end gap-0.5">
                    Cargando Menú
                    <span className="flex gap-[3px] ml-1 mb-[1px]">
                        <span className="animate-dot-1">.</span>
                        <span className="animate-dot-2">.</span>
                        <span className="animate-dot-3">.</span>
                    </span>
                </p>
            </div>
        </motion.div>
    );
}
