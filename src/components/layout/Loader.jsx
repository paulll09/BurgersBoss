import { useEffect, useState } from 'react';

export default function Loader() {
    const [hiding, setHiding] = useState(false);
    const [removed, setRemoved] = useState(false);

    useEffect(() => {
        const t1 = setTimeout(() => setHiding(true), 1400);
        const t2 = setTimeout(() => setRemoved(true), 1900); // after fade-out completes
        return () => { clearTimeout(t1); clearTimeout(t2); };
    }, []);

    if (removed) return null;

    return (
        <div
            className="fixed inset-0 z-[9999] flex items-center justify-center"
            style={{
                background: '#000',
                transition: 'opacity 0.5s ease',
                opacity: hiding ? 0 : 1,
                pointerEvents: hiding ? 'none' : 'all',
            }}
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
        </div>
    );
}
