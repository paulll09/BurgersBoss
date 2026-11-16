import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Copy, Check, CreditCard, User, Calendar } from 'lucide-react';
import toast from 'react-hot-toast';

export default function SubscriptionPaymentModal({ isOpen, onClose, paymentInfo, dueDay, monthName }) {
    const [copiedCVU, setCopiedCVU] = useState(false);

    if (!isOpen) return null;

    const handleCopyCVU = () => {
        if (!paymentInfo?.cvu) return;
        navigator.clipboard.writeText(paymentInfo.cvu);
        setCopiedCVU(true);
        toast.success('CVU copiado al portapapeles');
        setTimeout(() => setCopiedCVU(false), 2500);
    };

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                {/* Backdrop */}
                <motion.div
                    className="fixed inset-0 bg-black/50 backdrop-blur-xs"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                />

                {/* Modal box */}
                <motion.div
                    className="relative w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl z-10 overflow-hidden border border-gray-100"
                    initial={{ scale: 0.92, opacity: 0, y: 12 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.92, opacity: 0, y: 12 }}
                    transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                >
                    {/* Close button */}
                    <button
                        onClick={onClose}
                        className="cursor-pointer absolute top-4 right-4 p-2 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                        aria-label="Cerrar modal"
                    >
                        <X className="w-5 h-5" />
                    </button>

                    {/* Header */}
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center shrink-0">
                            <CreditCard className="w-6 h-6 text-amber-600" />
                        </div>
                        <div>
                            <h3 className="font-display text-xl text-gray-900 uppercase leading-none">
                                Datos de Pago
                            </h3>
                            <p className="font-body text-xs text-gray-500 mt-1">
                                Suscripción mensual · {monthName}
                            </p>
                        </div>
                    </div>

                    <p className="font-body text-xs text-gray-600 mb-5 leading-relaxed">
                        Realizá la transferencia bancaria antes del <strong>día {dueDay} de cada mes</strong> para mantener la plataforma web en funcionamiento continuo.
                    </p>

                    {/* Transfer Details Card */}
                    <div className="space-y-3 bg-gray-50 p-4 rounded-2xl border border-gray-100 mb-6">
                        {/* Titular */}
                        <div className="flex items-start justify-between">
                            <div className="flex items-center gap-2 text-gray-500 text-xs font-semibold uppercase tracking-wider">
                                <User className="w-3.5 h-3.5" />
                                <span>Titular de la cuenta</span>
                            </div>
                            <span className="font-body font-bold text-sm text-gray-900 text-right">
                                {paymentInfo?.holder || 'Carlos Paul Aquino'}
                            </span>
                        </div>

                        <hr className="border-gray-200/60" />

                        {/* CVU */}
                        <div>
                            <div className="flex items-center justify-between mb-1">
                                <span className="text-gray-500 text-xs font-semibold uppercase tracking-wider">
                                    CVU
                                </span>
                                <button
                                    onClick={handleCopyCVU}
                                    className="cursor-pointer inline-flex items-center gap-1 text-xs font-bold text-amber-700 hover:text-amber-800 transition-colors px-2 py-0.5 rounded-md hover:bg-amber-100/60"
                                >
                                    {copiedCVU ? (
                                        <>
                                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                                            <span className="text-emerald-700">¡Copiado!</span>
                                        </>
                                    ) : (
                                        <>
                                            <Copy className="w-3.5 h-3.5" />
                                            <span>Copiar CVU</span>
                                        </>
                                    )}
                                </button>
                            </div>
                            <div className="font-mono text-sm font-bold text-gray-800 bg-white p-2.5 rounded-xl border border-gray-200 tracking-wide select-all text-center">
                                {paymentInfo?.cvu || '0000003100045782936295'}
                            </div>
                        </div>

                        <hr className="border-gray-200/60" />

                        {/* Vencimiento */}
                        <div className="flex items-center justify-between text-xs">
                            <div className="flex items-center gap-1.5 text-gray-500 font-medium">
                                <Calendar className="w-3.5 h-3.5" />
                                <span>Fecha límite habitual:</span>
                            </div>
                            <span className="font-semibold text-gray-800">Día {dueDay} de cada mes</span>
                        </div>
                    </div>

                    {/* Action button */}
                    <button
                        onClick={onClose}
                        className="cursor-pointer w-full py-3 px-4 rounded-xl font-body font-bold text-sm text-white bg-gray-900 hover:bg-gray-800 active:scale-[0.99] transition-all shadow-md"
                    >
                        Entendido
                    </button>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
