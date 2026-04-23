import { useState, useContext } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, User, Users, Calendar, Clock, MessageCircle, Info } from 'lucide-react';
import { BarCtx } from '../context/barCtx';
import { WHATSAPP_PHONE } from '../lib/config';

const DAY_KEYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

function generateTimeSlots(from, to) {
    const slots = [];
    const [fh, fm] = from.split(':').map(Number);
    let current = fh * 60 + fm;
    const [th, tm] = to.split(':').map(Number);
    let end = th * 60 + tm;
    if (end <= current) end += 24 * 60;
    const limit = end - 30;
    while (current <= limit) {
        const h = Math.floor(current / 60) % 24;
        const m = current % 60;
        slots.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
        current += 30;
    }
    return slots;
}

const inputCls = (err) =>
    `w-full min-w-0 bg-white border ${err ? 'border-primary ring-1 ring-primary/20' : 'border-border focus:border-text-dim'} rounded-xl px-4 py-3.5 text-text text-base outline-none transition-colors placeholder:text-text-dim font-body`;

export default function ReservationPage() {
    const { schedule } = useContext(BarCtx);
    const [form, setForm] = useState({ name: '', people: '', date: '', time: '' });
    const [errors, setErrors] = useState({});

    // Derived state — computed during render
    const selectedDaySlot = (form.date && schedule)
        ? (schedule[DAY_KEYS[new Date(form.date + 'T12:00:00').getDay()]] ?? null)
        : null;
    const timeSlots = selectedDaySlot?.open
        ? generateTimeSlots(selectedDaySlot.from, selectedDaySlot.to)
        : [];
    const dayIsClosed = Boolean(form.date && selectedDaySlot && !selectedDaySlot.open);
    const hasErrors = Object.keys(errors).length > 0;

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm(prev => ({ ...prev, [name]: value, ...(name === 'date' ? { time: '' } : {}) }));
        if (errors[name]) setErrors(prev => ({ ...prev, [name]: false }));
    };

    const setField = (field, val) => {
        setForm(prev => ({ ...prev, [field]: val }));
        if (errors[field]) setErrors(prev => ({ ...prev, [field]: false }));
    };

    const validate = () => {
        const e = {};
        if (!form.name.trim()) e.name = true;
        if (!form.people) e.people = true;
        if (!form.date) e.date = true;
        if (!form.time) e.time = true;
        setErrors(e);
        return Object.keys(e).length === 0;
    };

    const handleSubmit = () => {
        if (!validate()) return;
        const phone = WHATSAPP_PHONE;
        const dateStr = new Date(form.date + 'T12:00:00').toLocaleDateString('es-AR', {
            weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
        });
        let text = `Hola! Quisiera hacer una *reserva* en Bar Bulgaria:\n\n`;
        text += `*Nombre:* ${form.name.trim()}\n`;
        text += `*Personas:* ${form.people}\n`;
        text += `*Dia:* ${dateStr}\n`;
        text += `*Horario:* ${form.time} hs\n`;
        text += `\nPor favor, confirmen disponibilidad. Gracias!`;
        window.open(`https://wa.me/${phone}?text=${encodeURIComponent(text)}`, '_blank');
    };

    const today = new Date().toISOString().split('T')[0];

    return (
        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 animate-fade-in">

                {/* Header */}
                <div className="flex items-center gap-3 mb-8 pb-4 border-b border-border">
                    <Link
                        to="/"
                        className="flex items-center justify-center w-9 h-9 rounded-full bg-cream hover:bg-surface2 transition-all group shrink-0"
                        style={{ boxShadow: '0 0 0 1px rgba(0,0,0,0.08)' }}
                    >
                        <ArrowLeft className="w-4 h-4 text-text-muted group-hover:text-text group-hover:-translate-x-0.5 transition-all" />
                    </Link>
                    <div>
                        <h1 className="font-display font-semibold text-3xl sm:text-4xl text-text uppercase leading-none">
                            Realizar Reserva
                        </h1>
                        <p className="text-text-muted text-xs uppercase tracking-widest font-semibold mt-1">
                            Bar Bulgaria
                        </p>
                    </div>
                </div>

                {/* Form card */}
                <div
                    className="rounded-2xl p-5 sm:p-7 bg-cream"
                    style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.06), 0 0 0 1px rgba(0,0,0,0.05)' }}
                >
                    <div className="space-y-5">

                        {/* Nombre */}
                        <div>
                            <label className="flex items-center gap-1.5 text-[11px] font-semibold text-text-muted uppercase tracking-widest mb-2">
                                <User className="w-3.5 h-3.5 text-primary" />
                                Nombre y Apellido <span className="text-primary">*</span>
                            </label>
                            <input
                                type="text"
                                name="name"
                                value={form.name}
                                onChange={handleChange}
                                placeholder="Ej: Juan Pérez"
                                className={inputCls(errors.name)}
                                autoComplete="name"
                                enterKeyHint="next"
                            />
                        </div>

                        {/* Cantidad de personas */}
                        <div>
                            <label className="flex items-center gap-1.5 text-[11px] font-semibold text-text-muted uppercase tracking-widest mb-2">
                                <Users className="w-3.5 h-3.5 text-primary" />
                                Cantidad de Personas <span className="text-primary">*</span>
                            </label>
                            <input
                                type="number"
                                name="people"
                                value={form.people}
                                onChange={handleChange}
                                min="2"
                                placeholder="Ej: 4"
                                className={inputCls(errors.people)}
                                inputMode="numeric"
                                enterKeyHint="next"
                            />
                        </div>

                        {/* Día */}
                        <div>
                            <label className="flex items-center gap-1.5 text-[11px] font-semibold text-text-muted uppercase tracking-widest mb-2">
                                <Calendar className="w-3.5 h-3.5 text-primary" />
                                Día <span className="text-primary">*</span>
                            </label>
                            <input
                                type="date"
                                name="date"
                                value={form.date}
                                onChange={handleChange}
                                min={today}
                                className={inputCls(errors.date)}
                            />
                            {dayIsClosed ? (
                                <p className="mt-2 text-[12px] font-semibold text-primary">
                                    El bar está cerrado ese día. Elegí otra fecha.
                                </p>
                            ) : null}
                        </div>

                        {/* Horario */}
                        <div>
                            <label className="flex items-center gap-1.5 text-[11px] font-semibold text-text-muted uppercase tracking-widest mb-2">
                                <Clock className="w-3.5 h-3.5 text-primary" />
                                Horario <span className="text-primary">*</span>
                            </label>
                            {!form.date ? (
                                <p className="text-sm text-text-dim italic">
                                    Seleccioná primero un día para ver los horarios disponibles.
                                </p>
                            ) : (form.date && !dayIsClosed && timeSlots.length > 0) ? (
                                <div className={`flex flex-wrap gap-2 ${errors.time ? 'p-1 ring-1 ring-primary/30 rounded-xl' : ''}`}>
                                    {timeSlots.map((t) => (
                                        <button
                                            key={t}
                                            type="button"
                                            onClick={() => setField('time', t)}
                                            className={`cursor-pointer h-10 px-4 rounded-xl text-sm font-bold transition-all active:scale-95 ${
                                                form.time === t
                                                    ? 'bg-primary text-white shadow-[0_2px_8px_rgba(217,0,9,0.35)]'
                                                    : 'bg-cream text-text-muted hover:text-text'
                                            }`}
                                            style={form.time !== t ? { boxShadow: '0 0 0 1px rgba(0,0,0,0.08)' } : undefined}
                                        >
                                            {t}
                                        </button>
                                    ))}
                                </div>
                            ) : null}
                        </div>

                        {hasErrors ? (
                            <p className="text-primary text-xs font-semibold text-center">
                                Completá todos los campos requeridos (*)
                            </p>
                        ) : null}
                    </div>

                    {/* Divider + submit */}
                    <div className="mt-6 pt-5 border-t border-border">

                        {/* Aviso de tolerancia horaria */}
                        <div
                            className="flex gap-3 rounded-xl px-4 py-3.5 mb-5"
                            style={{ background: 'rgba(217,0,9,0.05)', border: '1px solid rgba(217,0,9,0.12)' }}
                        >
                            <Info className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                            <p className="text-[12px] text-text-muted leading-relaxed font-body">
                                <span className="font-semibold text-text">Tolerancia de 20 minutos.</span>{' '}
                                Tu lugar queda reservado hasta 20 minutos después del horario acordado.
                                Pasado ese tiempo, el bar podrá disponer de la mesa sin previo aviso.
                                Te recomendamos llegar puntual para garantizar tu reserva.
                            </p>
                        </div>

                        <button
                            onClick={handleSubmit}
                            disabled={dayIsClosed}
                            className="cursor-pointer w-full bg-primary hover:bg-primary-dark disabled:opacity-40 disabled:cursor-not-allowed text-white py-4 rounded-2xl font-semibold text-sm uppercase tracking-widest flex items-center justify-center gap-2.5 transition-colors active:scale-[0.98]"
                            style={{ boxShadow: '0 4px 16px rgba(217,0,9,0.25)' }}
                        >
                            <MessageCircle className="w-[18px] h-[18px]" />
                            Confirmar por WhatsApp
                        </button>
                        <p className="text-xs text-center text-text-dim mt-4">
                            Serás redirigido a WhatsApp para confirmar tu reserva.
                        </p>
                    </div>
                </div>
            </div>
    );
}
