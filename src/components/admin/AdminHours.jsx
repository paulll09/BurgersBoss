import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useSchedule } from '../../hooks/useSchedule';
import toast from 'react-hot-toast';
import { inputClsCompact } from '../../utils/styles';

const DAY_ORDER = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
const DAY_LABELS_ES = {
    monday: 'Lunes', tuesday: 'Martes', wednesday: 'Miércoles',
    thursday: 'Jueves', friday: 'Viernes', saturday: 'Sábado', sunday: 'Domingo',
};

export default function AdminHours() {
    const navigate = useNavigate();
    const { schedule, loading, saveSchedule } = useSchedule();
    const [form, setForm] = useState(null);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (schedule) setForm(structuredClone(schedule));
    }, [schedule]);

    const handleToggle = (day) => {
        setForm(prev => ({ ...prev, [day]: { ...prev[day], open: !prev[day].open } }));
    };

    const handleTime = (day, field, value) => {
        setForm(prev => ({ ...prev, [day]: { ...prev[day], [field]: value } }));
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            await saveSchedule(form);
            toast.success('Horarios guardados');
        } catch (err) {
            toast.error(err.message || 'Error al guardar');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="max-w-xl mx-auto animate-fade-up pb-10">

            {/* Header */}
            <div className="flex items-center justify-between mb-6 gap-3">
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => navigate('/admin/dashboard')}
                        className="cursor-pointer p-2.5 rounded-xl border border-border text-text-muted hover:text-text hover:border-primary/30 transition-all active:scale-95"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div>
                        <h1 className="font-display text-2xl sm:text-3xl font-black text-secondary uppercase tracking-wider leading-none">Horarios</h1>
                        <p className="text-text-muted text-xs font-body italic mt-0.5">Configurá los días y horarios de apertura</p>
                    </div>
                </div>
                <button
                    onClick={handleSave}
                    disabled={saving || !form}
                    className="cursor-pointer flex items-center gap-2 bg-primary hover:bg-primary-dark text-white px-4 py-2.5 rounded-xl font-bold text-sm uppercase tracking-widest transition-all active:scale-95 shadow-[0_4px_14px_rgba(217,0,9,0.25)] disabled:opacity-60 shrink-0"
                >
                    {saving ? 'Guardando...' : 'Guardar'}
                </button>
            </div>

            {/* Nota sobre medianoche */}
            <p className="text-text-dim text-xs mb-4 px-1">
                * Para horarios que cruzan la medianoche (ej: 20:00 → 02:00) escribí la hora de cierre del día siguiente.
            </p>

            {/* Días */}
            <div className="flex flex-col gap-3">
                {loading || !form ? (
                    [...Array(7)].map((_, i) => (
                        <div key={i} className="h-16 rounded-2xl bg-surface animate-pulse" />
                    ))
                ) : (
                    DAY_ORDER.map((day) => {
                        const slot = form[day] ?? { open: false, from: '20:00', to: '00:00' };
                        return (
                            <div
                                key={day}
                                className={`flex flex-col gap-2 p-4 rounded-2xl border transition-all ${slot.open ? 'border-primary/20 bg-primary/5' : 'border-border bg-background'}`}
                            >
                                {/* Fila superior: toggle + nombre */}
                                <div className="flex items-center gap-3">
                                    <button
                                        onClick={() => handleToggle(day)}
                                        className={`cursor-pointer shrink-0 w-11 h-6 rounded-full transition-all relative ${slot.open ? 'bg-primary' : 'bg-border'}`}
                                    >
                                        <span
                                            className="absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all"
                                            style={{ left: slot.open ? '22px' : '2px' }}
                                        />
                                    </button>
                                    <span className={`text-sm font-semibold ${slot.open ? 'text-text' : 'text-text-muted'}`}>
                                        {DAY_LABELS_ES[day]}
                                    </span>
                                    {!slot.open && <span className="text-text-dim text-xs ml-auto">Cerrado</span>}
                                </div>

                                {/* Fila inferior: horas (solo si está abierto) */}
                                {slot.open && (
                                    <div className="flex items-center gap-2 pl-14">
                                        <input
                                            type="time"
                                            value={slot.from}
                                            onChange={e => handleTime(day, 'from', e.target.value)}
                                            className={`${inputClsCompact} flex-1`}
                                        />
                                        <span className="text-text-dim text-sm shrink-0">→</span>
                                        <input
                                            type="time"
                                            value={slot.to}
                                            onChange={e => handleTime(day, 'to', e.target.value)}
                                            className={`${inputClsCompact} flex-1`}
                                        />
                                    </div>
                                )}
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
}
