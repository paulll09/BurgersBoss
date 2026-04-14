import { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { OverlayCtx } from '../../context/overlayCtx';

const DAY_LABELS_ES = {
    monday: 'Lunes', tuesday: 'Martes', wednesday: 'Miércoles',
    thursday: 'Jueves', friday: 'Viernes', saturday: 'Sábado', sunday: 'Domingo',
};
const DAY_ORDER = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
// Key includes today's date — dismissal expires at midnight automatically
const SESSION_KEY = `bar_closed_dismissed_${new Date().toLocaleDateString('es-AR')}`;

export default function ClosedOverlay({ schedule }) {
    const [dismissed, setDismissed] = useState(
        () => sessionStorage.getItem(SESSION_KEY) === '1'
    );
    const { setActive } = useContext(OverlayCtx);
    const navigate = useNavigate();

    useEffect(() => {
        const alreadyDismissed = sessionStorage.getItem(SESSION_KEY) === '1';
        if (!alreadyDismissed) setActive(true);
        return () => setActive(false);
    }, [setActive]);

    if (dismissed) return null;

    const handleDismiss = () => {
        sessionStorage.setItem(SESSION_KEY, '1');
        setDismissed(true);
        setActive(false);
    };

    const rows = DAY_ORDER.map((key) => {
        const slot = schedule?.[key];
        return {
            label: DAY_LABELS_ES[key],
            text: slot?.open ? `${slot.from} — ${slot.to === '00:00' ? '00:00 (medianoche)' : slot.to}` : 'Cerrado',
            isOpen: slot?.open ?? false,
        };
    });

    return (
        <div
            className="fixed inset-0 z-[9000] flex items-center justify-center px-4"
            style={{ background: 'rgba(0,0,0,0.93)', backdropFilter: 'blur(6px)' }}
        >
            <div
                className="animate-fade-up w-full max-w-sm flex flex-col items-center text-center gap-5 px-7 py-9 rounded-3xl"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
            >
                {/* Logo */}
                <img
                    src="/images/logo.png"
                    alt="Bar Bulgaria"
                    className="w-20 h-20 object-contain"
                    draggable="false"
                />

                {/* Mensaje */}
                <div>
                    <h2 className="font-display text-3xl font-black text-white uppercase tracking-wider leading-none mb-2">
                        Estamos Cerrados
                    </h2>
                    <p className="text-white/50 text-sm font-body leading-relaxed">
                        En este momento el bar no está abierto.<br />
                        ¡Te esperamos pronto!
                    </p>
                </div>

                {/* Tabla de horarios */}
                <div
                    className="w-full rounded-2xl overflow-hidden"
                    style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}
                >
                    {rows.map(({ label, text, isOpen }, i) => (
                        <div
                            key={label}
                            className="flex justify-between items-center px-4 py-2.5 text-sm"
                            style={{ borderBottom: i < rows.length - 1 ? '1px solid rgba(255,255,255,0.06)' : 'none' }}
                        >
                            <span className="text-white/45 font-body">{label}</span>
                            <span style={{ color: isOpen ? 'rgba(255,255,255,0.85)' : 'rgba(255,255,255,0.2)', fontWeight: isOpen ? 600 : 400 }}>
                                {text}
                            </span>
                        </div>
                    ))}
                </div>

                {/* CTAs */}
                <div className="w-full flex flex-col gap-3">
                    <button
                        onClick={handleDismiss}
                        className="cursor-pointer w-full py-3.5 rounded-xl bg-primary hover:bg-primary-dark text-white text-sm font-bold uppercase tracking-widest transition-all active:scale-95 animate-wiggle shadow-[0_4px_20px_rgba(217,0,9,0.35)]"
                    >
                        Ver menú de todas formas →
                    </button>
                    <button
                        onClick={() => { handleDismiss(); navigate('/reserva'); }}
                        className="cursor-pointer w-full py-3.5 rounded-xl bg-primary hover:bg-primary-dark text-white text-sm font-bold uppercase tracking-widest transition-all active:scale-95 shadow-[0_4px_20px_rgba(217,0,9,0.35)]"
                    >
                        Realizar Reserva
                    </button>
                </div>
            </div>
        </div>
    );
}
