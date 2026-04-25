import { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Plus, Trash2, Edit2, X, Tag, Check } from 'lucide-react';
import { useExpenses, useExpenseCategories } from '../../hooks/useExpenses';
import { getBusinessDayDate, fetchScheduleOnce } from '../../hooks/useSchedule';
import { useConfirm } from '../ui/ConfirmDialog';
import { inputCls } from '../../utils/styles';
import toast from 'react-hot-toast';

const G = '#2d6a2d';

const PRESET_COLORS = [
    '#2d6a2d', '#1a4a1a', '#2563eb', '#0891b2',
    '#7c3aed', '#be185d', '#dc2626', '#d97706',
    '#374151', '#78350f',
];

function fmt(n) {
    return '$' + Number(n).toLocaleString('es-AR', { maximumFractionDigits: 0 });
}

function formatDate(d) {
    return new Date(d + 'T12:00:00').toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' });
}

const PERIODS = [
    { id: 'today', label: 'Hoy' },
    { id: 'week',  label: 'Semana' },
    { id: 'month', label: 'Mes' },
    { id: 'all',   label: 'Todos' },
];

/* ── Category dot ── */
function CatDot({ color, size = 10 }) {
    return <span style={{ display: 'inline-block', width: size, height: size, borderRadius: '50%', background: color, flexShrink: 0 }} />;
}

/* ════════════════════════════════════════════
   CATEGORY MANAGER MODAL
════════════════════════════════════════════ */
function CategoryModal({ onClose }) {
    const confirm = useConfirm();
    const { categories, createCategory, updateCategory, deleteCategory } = useExpenseCategories();
    const [form, setForm]         = useState({ name: '', color: PRESET_COLORS[0] });
    const [editing, setEditing]   = useState(null);
    const [saving, setSaving]     = useState(false);

    const openEdit = (cat) => { setEditing(cat); setForm({ name: cat.name, color: cat.color }); };
    const cancelEdit = () => { setEditing(null); setForm({ name: '', color: PRESET_COLORS[0] }); };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.name.trim()) { toast.error('El nombre es obligatorio'); return; }
        setSaving(true);
        const { error } = editing
            ? await updateCategory(editing.id, form)
            : await createCategory(form);
        setSaving(false);
        if (error) { toast.error(error.message); return; }
        toast.success(editing ? 'Categoría actualizada' : 'Categoría creada');
        cancelEdit();
    };

    const handleDelete = async (cat) => {
        const ok = await confirm({
            title: '¿Eliminar categoría?',
            message: `"${cat.name}" se eliminará. Los gastos asociados quedan sin categoría.`,
            confirmText: 'Eliminar',
        });
        if (!ok) return;
        const { error } = await deleteCategory(cat.id);
        if (error) toast.error(error.message);
        else toast.success('Eliminada');
    };

    return createPortal(
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
            style={{ background: 'rgba(0,0,0,0.55)', height: '100dvh' }}
            onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
            <motion.div
                className="bg-white w-full sm:max-w-md sm:rounded-2xl rounded-t-3xl overflow-hidden"
                style={{ maxHeight: '85dvh', display: 'flex', flexDirection: 'column', paddingBottom: 'env(safe-area-inset-bottom)' }}
                initial={{ y: 60, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
                exit={{ y: 60, opacity: 0 }} transition={{ type: 'spring', damping: 28, stiffness: 320 }}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: 'rgba(0,0,0,0.08)', flexShrink: 0 }}>
                    <h2 className="font-display uppercase text-2xl leading-none" style={{ color: '#111' }}>Categorías</h2>
                    <button onClick={onClose} className="cursor-pointer p-2 rounded-xl active:scale-90 transition-all" style={{ color: 'rgba(0,0,0,0.40)', background: 'rgba(0,0,0,0.05)' }}>
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div style={{ overflowY: 'auto', flex: 1 }} className="px-5 py-4 flex flex-col gap-4">
                    {/* Category list */}
                    {categories.length === 0 ? (
                        <p className="admin-sub text-center py-4">Sin categorías. Creá la primera.</p>
                    ) : (
                        <div className="flex flex-col gap-2">
                            {categories.map(cat => (
                                <div key={cat.id} className="flex items-center gap-3 p-3 admin-card">
                                    <CatDot color={cat.color} size={12} />
                                    <span className="flex-1 font-body text-sm font-semibold" style={{ color: '#111' }}>{cat.name}</span>
                                    <button onClick={() => openEdit(cat)}
                                        className="cursor-pointer p-2 rounded-lg active:scale-90 transition-all"
                                        style={{ color: G, background: 'rgba(45,106,45,0.08)' }}>
                                        <Edit2 className="w-3.5 h-3.5" />
                                    </button>
                                    <button onClick={() => handleDelete(cat)}
                                        className="cursor-pointer p-2 rounded-lg active:scale-90 transition-all"
                                        style={{ color: '#dc2626', background: 'rgba(239,68,68,0.08)' }}>
                                        <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Form */}
                    <div className="rounded-2xl p-4" style={{ background: 'rgba(0,0,0,0.03)', border: '1px solid rgba(0,0,0,0.08)' }}>
                        <p className="admin-label mb-3">{editing ? `Editando: ${editing.name}` : 'Nueva categoría'}</p>
                        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
                            <input
                                type="text" value={form.name} autoFocus={!editing}
                                onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                                placeholder="Ej: Ingredientes"
                                className={inputCls}
                            />
                            {/* Color picker */}
                            <div>
                                <p className="admin-label mb-2">Color</p>
                                <div className="flex flex-wrap gap-2">
                                    {PRESET_COLORS.map(c => (
                                        <button key={c} type="button" onClick={() => setForm(p => ({ ...p, color: c }))}
                                            className="cursor-pointer w-7 h-7 rounded-full flex items-center justify-center transition-all active:scale-90"
                                            style={{ background: c, boxShadow: form.color === c ? `0 0 0 2px #fff, 0 0 0 4px ${c}` : 'none' }}>
                                            {form.color === c && <Check className="w-3.5 h-3.5 text-white" />}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div className="flex gap-2">
                                {editing && (
                                    <button type="button" onClick={cancelEdit}
                                        className="cursor-pointer flex-1 py-2.5 rounded-xl font-body text-sm font-semibold border transition-all active:scale-95"
                                        style={{ borderColor: 'rgba(0,0,0,0.10)', color: 'rgba(0,0,0,0.50)' }}>
                                        Cancelar
                                    </button>
                                )}
                                <button type="submit" disabled={saving}
                                    className="cursor-pointer flex-1 py-2.5 rounded-xl font-body font-bold text-sm uppercase tracking-widest transition-all active:scale-[0.98] disabled:opacity-60"
                                    style={{ background: G, color: '#fff' }}>
                                    {saving ? 'Guardando…' : editing ? 'Guardar' : 'Crear'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </motion.div>
        </div>,
        document.body
    );
}

/* ════════════════════════════════════════════
   EXPENSE FORM (inline at top)
════════════════════════════════════════════ */
function localToday() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

async function getSessionDate() {
    try {
        const schedule = await fetchScheduleOnce();
        return getBusinessDayDate(schedule);
    } catch {
        return localToday();
    }
}

const EMPTY = { amount: '', description: '', category_id: '', date: localToday() };

function ExpenseFormWithDate(props) {
    const [sessionDate, setSessionDate] = useState(localToday());
    useEffect(() => { getSessionDate().then(setSessionDate); }, []);
    return <ExpenseForm {...props} defaultDate={sessionDate} />;
}

function ExpenseForm({ categories, onSave, editingExpense, onCancelEdit, defaultDate }) {
    const [form, setForm]   = useState(editingExpense
        ? { amount: editingExpense.amount, description: editingExpense.description ?? '', category_id: editingExpense.category_id ?? '', date: editingExpense.date }
        : { ...EMPTY, date: defaultDate ?? localToday() }
    );

    // Actualizar la fecha default cuando carga la fecha de sesión
    useEffect(() => {
        if (!editingExpense && defaultDate) {
            setForm(p => ({ ...p, date: defaultDate }));
        }
    }, [defaultDate]);
    const [saving, setSaving] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.amount || parseFloat(form.amount) <= 0) { toast.error('Ingresá un monto válido'); return; }
        setSaving(true);
        const { error } = await onSave({ ...form, category_id: form.category_id || null });
        setSaving(false);
        if (error) { toast.error(error.message); return; }
        toast.success(editingExpense ? 'Gasto actualizado' : 'Gasto registrado');
        if (!editingExpense) setForm({ ...EMPTY, date: form.date });
    };

    return (
        <form onSubmit={handleSubmit} className="admin-card p-4 flex flex-col gap-3 mb-5">
            <p className="admin-label">{editingExpense ? 'Editar gasto' : 'Registrar gasto'}</p>
            <div className="flex gap-2 flex-wrap sm:flex-nowrap">
                {/* Amount */}
                <div className="relative w-full sm:w-32 shrink-0">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 font-body text-sm" style={{ color: 'rgba(0,0,0,0.40)' }}>$</span>
                    <input type="number" min="0" step="100" value={form.amount} placeholder="0"
                        onChange={e => setForm(p => ({ ...p, amount: e.target.value }))}
                        className={`${inputCls} pl-7`} />
                </div>
                {/* Description */}
                <input type="text" value={form.description} placeholder="Descripción (opcional)"
                    onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                    className={`${inputCls} flex-1 min-w-0`} />
            </div>
            <div className="flex gap-2 flex-wrap sm:flex-nowrap">
                {/* Category */}
                <select value={form.category_id}
                    onChange={e => setForm(p => ({ ...p, category_id: e.target.value }))}
                    className={`${inputCls} flex-1`}>
                    <option value="">Sin categoría</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                {/* Date */}
                <input type="date" value={form.date} max={localToday()}
                    onChange={e => setForm(p => ({ ...p, date: e.target.value }))}
                    className={`${inputCls} w-full sm:w-40 shrink-0`} />
            </div>
            <div className="flex gap-2">
                {editingExpense && (
                    <button type="button" onClick={onCancelEdit}
                        className="cursor-pointer flex-1 py-2.5 rounded-xl font-body text-sm font-semibold border transition-all active:scale-95"
                        style={{ borderColor: 'rgba(0,0,0,0.10)', color: 'rgba(0,0,0,0.50)' }}>
                        Cancelar
                    </button>
                )}
                <button type="submit" disabled={saving}
                    className="cursor-pointer flex-1 py-2.5 rounded-xl font-body font-bold text-sm uppercase tracking-widest transition-all active:scale-[0.98] disabled:opacity-60 shadow-[0_4px_14px_rgba(45,106,45,0.22)]"
                    style={{ background: G, color: '#fff' }}>
                    {saving ? 'Guardando…' : editingExpense ? 'Guardar cambios' : '+ Registrar gasto'}
                </button>
            </div>
        </form>
    );
}

/* ════════════════════════════════════════════
   ADMIN GASTOS — MAIN
════════════════════════════════════════════ */
export default function AdminGastos() {
    const confirm = useConfirm();
    const [period, setPeriod]         = useState('month');
    const [catModalOpen, setCatModal] = useState(false);
    const [editingExp, setEditingExp] = useState(null);

    const { categories }                                              = useExpenseCategories();
    const { expenses, loading, total, createExpense, updateExpense, deleteExpense } = useExpenses(period);

    /* Group expenses by date */
    const grouped = useMemo(() => {
        const map = {};
        expenses.forEach(e => {
            if (!map[e.date]) map[e.date] = [];
            map[e.date].push(e);
        });
        return Object.entries(map).sort(([a], [b]) => b.localeCompare(a));
    }, [expenses]);

    const handleSave = async (data) => {
        if (editingExp) return updateExpense(editingExp.id, data);
        return createExpense(data);
    };

    const handleDelete = async (exp) => {
        const ok = await confirm({
            title: '¿Eliminar gasto?',
            message: `${exp.description || 'Este gasto'} — ${fmt(exp.amount)}`,
            confirmText: 'Eliminar',
        });
        if (!ok) return;
        const { error } = await deleteExpense(exp.id);
        if (error) toast.error(error.message);
        else toast.success('Eliminado');
    };

    return (
        <div className="max-w-2xl mx-auto animate-fade-up pb-10">

            {/* Header */}
            <div className="flex items-center justify-between mb-6 gap-3">
                <div>
                    <h1 className="font-display uppercase leading-none" style={{ fontSize: 'clamp(1.8rem, 5vw, 2.4rem)', color: '#111' }}>
                        Gastos
                    </h1>
                    <p className="admin-sub mt-0.5">Registrá los costos del negocio</p>
                </div>
                <button
                    onClick={() => setCatModal(true)}
                    className="cursor-pointer flex items-center gap-2 px-4 py-2.5 rounded-xl font-body font-bold text-sm uppercase tracking-widest transition-all active:scale-95 shrink-0"
                    style={{ background: '#fff', color: G, border: `1.5px solid ${G}` }}
                >
                    <Tag className="w-4 h-4" />
                    <span className="hidden sm:inline">Categorías</span>
                </button>
            </div>

            {/* Period selector */}
            <div className="flex gap-1 p-1 rounded-xl mb-5" style={{ background: 'rgba(0,0,0,0.08)' }}>
                {PERIODS.map(p => (
                    <button key={p.id} onClick={() => { setPeriod(p.id); setEditingExp(null); }}
                        className="cursor-pointer flex-1 py-2 rounded-lg font-body text-sm font-semibold transition-all"
                        style={period === p.id
                            ? { background: '#fff', color: '#111', boxShadow: '0 1px 4px rgba(0,0,0,0.12)' }
                            : { color: 'rgba(0,0,0,0.50)' }
                        }>
                        {p.label}
                    </button>
                ))}
            </div>

            {/* Expense form */}
            <ExpenseFormWithDate
                key={editingExp?.id ?? 'new'}
                categories={categories}
                onSave={handleSave}
                editingExpense={editingExp}
                onCancelEdit={() => setEditingExp(null)}
            />

            {/* Total */}
            {!loading && expenses.length > 0 && (
                <div className="flex items-center justify-between px-5 py-3.5 rounded-2xl mb-4"
                    style={{ background: 'rgba(220,38,38,0.06)', border: '1.5px solid rgba(220,38,38,0.15)' }}>
                    <p className="font-body text-sm font-semibold" style={{ color: '#dc2626' }}>
                        Total gastos ({expenses.length})
                    </p>
                    <p className="font-display text-2xl leading-none" style={{ color: '#dc2626' }}>
                        {fmt(total)}
                    </p>
                </div>
            )}

            {/* Expense list */}
            {loading ? (
                <div className="flex flex-col gap-2">
                    {[...Array(3)].map((_, i) => <div key={i} className="h-14 rounded-xl animate-pulse" style={{ background: 'rgba(255,255,255,0.7)' }} />)}
                </div>
            ) : expenses.length === 0 ? (
                <div className="py-16 text-center">
                    <p className="font-display uppercase text-2xl mb-2" style={{ color: 'rgba(0,0,0,0.22)' }}>Sin gastos</p>
                    <p className="admin-sub">Registrá el primer gasto del período.</p>
                </div>
            ) : (
                <div className="flex flex-col gap-4">
                    {grouped.map(([date, items]) => (
                        <div key={date}>
                            <p className="admin-label mb-2">{formatDate(date)}</p>
                            <div className="flex flex-col gap-2">
                                {items.map(exp => (
                                    <div key={exp.id} className={`flex items-center gap-3 p-3.5 admin-card transition-all ${editingExp?.id === exp.id ? 'opacity-40' : ''}`}>
                                        <CatDot color={exp.category?.color ?? 'rgba(0,0,0,0.20)'} size={10} />
                                        <div className="flex-1 min-w-0">
                                            <p className="font-body text-sm font-semibold truncate" style={{ color: '#111' }}>
                                                {exp.description || <span style={{ color: 'rgba(0,0,0,0.38)' }}>Sin descripción</span>}
                                            </p>
                                            {exp.category && (
                                                <p className="font-body text-xs" style={{ color: exp.category.color }}>
                                                    {exp.category.name}
                                                </p>
                                            )}
                                        </div>
                                        <p className="font-body text-sm font-bold shrink-0" style={{ color: '#dc2626' }}>
                                            {fmt(exp.amount)}
                                        </p>
                                        <div className="flex gap-1 shrink-0">
                                            <button onClick={() => setEditingExp(exp)}
                                                className="cursor-pointer p-2 rounded-lg active:scale-90 transition-all"
                                                style={{ color: G, background: 'rgba(45,106,45,0.08)' }}>
                                                <Edit2 className="w-3.5 h-3.5" />
                                            </button>
                                            <button onClick={() => handleDelete(exp)}
                                                className="cursor-pointer p-2 rounded-lg active:scale-90 transition-all"
                                                style={{ color: '#dc2626', background: 'rgba(220,38,38,0.08)' }}>
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Category modal */}
            <AnimatePresence>
                {catModalOpen && <CategoryModal onClose={() => setCatModal(false)} />}
            </AnimatePresence>
        </div>
    );
}
