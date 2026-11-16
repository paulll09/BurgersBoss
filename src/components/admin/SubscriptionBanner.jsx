import { useState } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, Clock, CreditCard, Copy, Check } from 'lucide-react';
import toast from 'react-hot-toast';
import { useSubscription } from '../../hooks/useSubscription';
import SubscriptionPaymentModal from './SubscriptionPaymentModal';

export default function SubscriptionBanner() {
    const { status, dueDay, monthName, paymentInfo, loading } = useSubscription();
    const [modalOpen, setModalOpen] = useState(false);
    const [copiedCVU, setCopiedCVU] = useState(false);

    if (loading || status === 'PAID') {
        return null; // Oculto si está al día o cargando
    }

    const isOverdue = status === 'OVERDUE';

    const handleQuickCopy = (e) => {
        e.stopPropagation();
        if (!paymentInfo?.cvu) return;
        navigator.clipboard.writeText(paymentInfo.cvu);
        setCopiedCVU(true);
        toast.success('CVU copiado al portapapeles');
        setTimeout(() => setCopiedCVU(false), 2500);
    };

    return (
        <>
            <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className={`mb-6 p-4 sm:p-4.5 rounded-2xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs ${
                    isOverdue
                        ? 'bg-rose-50/90 border-rose-200 text-rose-950'
                        : 'bg-amber-50/90 border-amber-200 text-amber-950'
                }`}
            >
                <div className="flex items-start gap-3.5 min-w-0">
                    <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 mt-0.5 sm:mt-0 ${
                            isOverdue ? 'bg-rose-100 text-rose-600' : 'bg-amber-100 text-amber-700'
                        }`}
                    >
                        {isOverdue ? (
                            <AlertTriangle className="w-5 h-5 animate-pulse" />
                        ) : (
                            <Clock className="w-5 h-5" />
                        )}
                    </div>
                    <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                            <span
                                className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${
                                    isOverdue
                                        ? 'bg-rose-600 text-white'
                                        : 'bg-amber-500 text-slate-950'
                                }`}
                            >
                                {isOverdue ? 'Suscripción Vencida' : 'Recordatorio de Pago'}
                            </span>
                            <span className="text-xs font-semibold opacity-75">
                                Período {monthName}
                            </span>
                        </div>
                        <p className="font-body text-xs sm:text-sm font-medium mt-1 leading-snug">
                            {isOverdue
                                ? `La suscripción del servicio web venció el día ${dueDay} de ${monthName}. Por favor realizá la transferencia para mantener la web activa.`
                                : `El pago de la suscripción mensual del servicio vence el día ${dueDay} de ${monthName}.`
                            }
                        </p>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 self-end sm:self-center shrink-0 w-full sm:w-auto">
                    <button
                        onClick={handleQuickCopy}
                        className={`cursor-pointer inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all border active:scale-95 flex-1 sm:flex-initial ${
                            isOverdue
                                ? 'bg-white/80 hover:bg-white text-rose-900 border-rose-200'
                                : 'bg-white/80 hover:bg-white text-amber-900 border-amber-200'
                        }`}
                    >
                        {copiedCVU ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedCVU ? '¡Copiado!' : 'Copiar CVU'}</span>
                    </button>

                    <button
                        onClick={() => setModalOpen(true)}
                        className={`cursor-pointer inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-white transition-all shadow-xs active:scale-95 flex-1 sm:flex-initial ${
                            isOverdue
                                ? 'bg-rose-600 hover:bg-rose-700'
                                : 'bg-amber-600 hover:bg-amber-700'
                        }`}
                    >
                        <CreditCard className="w-3.5 h-3.5" />
                        <span>Ver datos de pago</span>
                    </button>
                </div>
            </motion.div>

            {/* Modal de Pago */}
            <SubscriptionPaymentModal
                isOpen={modalOpen}
                onClose={() => setModalOpen(false)}
                paymentInfo={paymentInfo}
                dueDay={dueDay}
                monthName={monthName}
            />
        </>
    );
}
