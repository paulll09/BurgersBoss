import { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { AlertTriangle, Trash2, X } from 'lucide-react';

const ConfirmCtx = createContext(null);

export function useConfirm() {
    return useContext(ConfirmCtx);
}

export function ConfirmProvider({ children }) {
    const [state, setState] = useState(null);
    const resolveRef = useRef(null);

    const confirm = useCallback(({ title, message, confirmText = 'Eliminar', icon = 'delete' }) => {
        return new Promise((resolve) => {
            resolveRef.current = resolve;
            setState({ title, message, confirmText, icon });
        });
    }, []);

    const handleConfirm = () => {
        resolveRef.current?.(true);
        setState(null);
    };

    const handleCancel = () => {
        resolveRef.current?.(false);
        setState(null);
    };

    return (
        <ConfirmCtx.Provider value={confirm}>
            {children}
            {state && createPortal(
                <ConfirmModal {...state} onConfirm={handleConfirm} onCancel={handleCancel} />,
                document.body
            )}
        </ConfirmCtx.Provider>
    );
}

function ConfirmModal({ title, message, confirmText, icon, onConfirm, onCancel }) {
    const [closing, setClosing] = useState(false);
    const backdropRef = useRef(null);

    useEffect(() => {
        const handleKey = (e) => {
            if (e.key === 'Escape') handleClose();
        };
        document.addEventListener('keydown', handleKey);
        return () => document.removeEventListener('keydown', handleKey);
    }, []);

    const handleClose = () => {
        setClosing(true);
        setTimeout(() => onCancel(), 200);
    };

    const handleConfirmClick = () => {
        setClosing(true);
        setTimeout(() => onConfirm(), 200);
    };

    const IconComponent = icon === 'delete' ? Trash2 : AlertTriangle;

    return (
        <div
            ref={backdropRef}
            onClick={(e) => e.target === backdropRef.current && handleClose()}
            className={`fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-4 ${closing ? 'animate-fade-out' : 'animate-fade-in'}`}
            style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}
        >
            <div
                className={`w-full max-w-sm bg-background rounded-2xl shadow-2xl overflow-hidden ${closing ? 'animate-slide-down' : 'animate-slide-up'}`}
                style={{ boxShadow: '0 24px 48px rgba(0,0,0,0.2)' }}
            >
                {/* Header */}
                <div className="flex items-start gap-4 px-6 pt-6 pb-2">
                    <div className="shrink-0 w-11 h-11 rounded-xl bg-red-50 flex items-center justify-center">
                        <IconComponent className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <h3 className="font-display font-bold text-text text-lg leading-tight">
                            {title}
                        </h3>
                        <p className="text-text-muted text-sm mt-1.5 leading-relaxed">
                            {message}
                        </p>
                    </div>
                    <button
                        onClick={handleClose}
                        className="cursor-pointer shrink-0 p-1.5 rounded-lg text-text-muted hover:text-text hover:bg-surface transition-all"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* Actions */}
                <div className="flex gap-3 px-6 pt-4 pb-6">
                    <button
                        onClick={handleClose}
                        className="cursor-pointer flex-1 py-3 rounded-xl border border-border text-text font-semibold text-sm hover:bg-surface transition-all active:scale-[0.97]"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleConfirmClick}
                        className="cursor-pointer flex-1 py-3 rounded-xl bg-primary hover:bg-primary-dark text-white font-bold text-sm uppercase tracking-wider transition-all active:scale-[0.97] shadow-[0_4px_14px_rgba(217,0,9,0.25)]"
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
}
