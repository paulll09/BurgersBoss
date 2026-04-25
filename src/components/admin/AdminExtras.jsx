import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Plus, Edit2, Trash2, X, Eye, EyeOff } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useExtras } from '../../hooks/useExtras';
import { useConfirm } from '../ui/ConfirmDialog';
import { inputCls } from '../../utils/styles';
import { BUSINESS_ID } from '../../lib/config';
import toast from 'react-hot-toast';

const EMPTY = { name: '', description: '', price: '', display_order: 0, allowed_categories: [] };

export default function AdminExtras() {
    const confirm = useConfirm();
    const { extras, loading, refetch } = useExtras(true);

    const [categories,  setCategories]  = useState([]);
    const [modalOpen,   setModalOpen]   = useState(false);
    const [editing,     setEditing]     = useState(null);
    const [form,        setForm]        = useState(EMPTY);
    const [formLoading, setFormLoading] = useState(false);

    useEffect(() => {
        supabase.from('categories').select('id, name').eq('business_id', BUSINESS_ID).order('display_order')
            .then(({ data }) => { if (data) setCategories(data); });
    }, []);

    const openCreate = () => { setEditing(null); setForm(EMPTY); setModalOpen(true); };
    const openEdit   = (e) => {
        setEditing(e);
        setForm({ name: e.name, description: e.description || '', price: e.price, display_order: e.display_order || 0, allowed_categories: e.allowed_categories || [] });
        setModalOpen(true);
    };
    const closeModal = () => { setModalOpen(false); setEditing(null); setForm(EMPTY); };

    const toggleCategory = (id) => {
        setForm(f => ({
            ...f,
            allowed_categories: f.allowed_categories.includes(id)
                ? f.allowed_categories.filter(c => c !== id)
                : [...f.allowed_categories, id],
        }));
    };

    const handleSubmit = async (ev) => {
        ev.preventDefault();
        if (!form.name.trim() || !form.price) { toast.error('Completá nombre y precio'); return; }
        setFormLoading(true);
        try {
            const payload = {
                name: form.name.trim(),
                description: form.description.trim(),
                price: parseFloat(form.price),
                display_order: parseInt(form.display_order) || 0,
                allowed_categories: form.allowed_categories,
            };
            if (editing) {
                const { error } = await supabase.from('extras').update(payload).eq('id', editing.id);
                if (error) throw error;
                toast.success('Extra actualizado');
            } else {
                const { error } = await supabase.from('extras').insert({ ...payload, business_id: BUSINESS_ID, visible: true });
                if (error) throw error;
                toast.success('Extra creado');
            }
            closeModal();
            refetch();
        } catch (err) {
            toast.error(err.message);
        } finally {
            setFormLoading(false);
        }
    };

    const handleToggleVisible = async (extra) => {
        const { error } = await supabase.from('extras').update({ visible: !extra.visible }).eq('id', extra.id);
        if (error) { toast.error(error.message); return; }
        toast.success(extra.visible ? 'Extra ocultado' : 'Extra visible');
        refetch();
    };

    const handleDelete = async (extra) => {
        const ok = await confirm({
            title: '¿Eliminar extra?',
            message: `"${extra.name}" se eliminará permanentemente.`,
            confirmText: 'Eliminar',
        });
        if (!ok) return;
        const { error } = await supabase.from('extras').delete().eq('id', extra.id);
        if (error) { toast.error(error.message); return; }
        toast.success('Eliminado');
        refetch();
    };

    return (
        <div className="max-w-6xl mx-auto animate-fade-up pb-10">

            {/* Header */}
            <div className="flex items-center justify-between mb-6 gap-3">
                <div>
                    <h1 className="font-display uppercase leading-none" style={{ fontSize: 'clamp(1.8rem, 5vw, 2.4rem)', color: '#111' }}>
                        Extras
                    </h1>
                    <p className="font-body text-xs mt-0.5" style={{ color: 'rgba(0,0,0,0.40)' }}>
                        {loading ? '...' : `${extras.length} en total`}
                    </p>
                </div>
                <button
                    onClick={openCreate}
                    className="cursor-pointer flex items-center gap-2 bg-primary hover:bg-primary-dark text-white px-4 py-2.5 rounded-xl font-bold text-sm uppercase tracking-widest transition-all active:scale-95 shadow-[0_4px_14px_rgba(45,106,45,0.30)] shrink-0"
                >
                    <Plus className="w-4 h-4" />
                    <span className="hidden sm:inline">Nuevo Extra</span>
                    <span className="sm:hidden">Nuevo</span>
                </button>
            </div>

            {/* Lista */}
            <div className="flex flex-col gap-3">
                {loading ? (
                    [...Array(3)].map((_, i) => <div key={i} className="h-16 rounded-2xl bg-surface animate-pulse" />)
                ) : extras.length === 0 ? (
                    <div className="py-16 text-center flex flex-col items-center gap-3">
                        <p className="text-text-muted text-sm">No hay extras todavía.</p>
                        <button onClick={openCreate} className="cursor-pointer px-4 py-2 rounded-xl bg-primary text-white text-xs font-bold uppercase tracking-widest">
                            Crear primer extra
                        </button>
                    </div>
                ) : (
                    extras.map(extra => (
                        <div key={extra.id} className={`flex items-center gap-3 p-4 admin-card transition-all ${!extra.visible ? 'opacity-50' : ''}`}>
                            <div className="flex-1 min-w-0">
                                <p className="font-semibold text-text text-sm">{extra.name}</p>
                                {extra.description && <p className="text-text-muted text-xs mt-0.5 truncate">{extra.description}</p>}
                                <p className="font-bold text-sm mt-1" style={{ color: '#2d6a2d' }}>
                                    +${Number(extra.price).toLocaleString('es-AR')}
                                </p>
                                <p className="text-text-dim text-[11px] mt-0.5">
                                    {extra.allowed_categories?.length > 0
                                        ? `Solo en: ${extra.allowed_categories.map(id => categories.find(c => c.id === id)?.name).filter(Boolean).join(', ')}`
                                        : 'Todos los productos'}
                                </p>
                            </div>
                            <div className="flex items-center gap-1 shrink-0">
                                <button onClick={() => handleToggleVisible(extra)}
                                    className="p-2.5 rounded-xl transition-all active:scale-90"
                                    style={extra.visible
                                        ? { color: '#2d6a2d', background: 'rgba(45,106,45,0.10)' }
                                        : { color: 'rgba(0,0,0,0.30)', background: 'rgba(0,0,0,0.04)' }
                                    }>
                                    {extra.visible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                                </button>
                                <button onClick={() => openEdit(extra)}
                                    className="p-2.5 rounded-xl active:scale-90 transition-all"
                                    style={{ color: '#2d6a2d', background: 'rgba(45,106,45,0.08)' }}>
                                    <Edit2 className="w-4 h-4" />
                                </button>
                                <button onClick={() => handleDelete(extra)}
                                    className="p-2.5 rounded-xl text-red-500 bg-red-500/10 active:scale-90 transition-all">
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Modal */}
            {modalOpen && createPortal(
                <div style={{ position: 'fixed', inset: 0, zIndex: 50, overflowY: 'auto', WebkitOverflowScrolling: 'touch', background: 'var(--color-background, #fff)' }}>
                    <div style={{ position: 'sticky', top: 0, zIndex: 10, background: 'var(--color-background, #fff)', borderBottom: '1px solid var(--color-border, #e5e5e5)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px' }}>
                            <h2 className="font-display text-lg font-black text-secondary uppercase tracking-wider">
                                {editing ? 'Editar Extra' : 'Nuevo Extra'}
                            </h2>
                            <button type="button" onClick={closeModal}
                                className="cursor-pointer p-2 rounded-xl text-text-muted hover:text-text hover:bg-surface transition-all active:scale-90">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} style={{ maxWidth: '480px', margin: '0 auto', padding: '20px 20px 40px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

                            <div>
                                <label className="block text-xs font-semibold text-text-muted uppercase tracking-widest mb-2">
                                    Nombre <span className="text-primary">*</span>
                                </label>
                                <input type="text" value={form.name}
                                    onChange={e => setForm({ ...form, name: e.target.value })}
                                    placeholder="Ej: Pileta de cheddar"
                                    className={inputCls} />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-text-muted uppercase tracking-widest mb-2">Descripción</label>
                                <input type="text" value={form.description}
                                    onChange={e => setForm({ ...form, description: e.target.value })}
                                    placeholder="Ej: Salsa de queso cheddar derretida"
                                    className={inputCls} />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-text-muted uppercase tracking-widest mb-2">
                                    Precio <span className="text-primary">*</span>
                                </label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-dim text-sm">$</span>
                                    <input type="number" min="0" step="100" value={form.price}
                                        onChange={e => setForm({ ...form, price: e.target.value })}
                                        placeholder="4000"
                                        className={`${inputCls} pl-7`} />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-text-muted uppercase tracking-widest mb-2">Orden de visualización</label>
                                <input type="number" min="0" value={form.display_order}
                                    onChange={e => setForm({ ...form, display_order: e.target.value })}
                                    className={inputCls} />
                            </div>

                            {categories.length > 0 && (
                                <div>
                                    <label className="block text-xs font-semibold text-text-muted uppercase tracking-widest mb-1">
                                        Mostrar en categorías
                                    </label>
                                    <p className="text-text-dim text-[11px] mb-3">
                                        Sin selección = se muestra en todos los productos.
                                    </p>
                                    <div className="flex flex-col gap-2">
                                        {categories.map(cat => {
                                            const active = form.allowed_categories.includes(cat.id);
                                            return (
                                                <button
                                                    key={cat.id}
                                                    type="button"
                                                    onClick={() => toggleCategory(cat.id)}
                                                    className="cursor-pointer flex items-center gap-3 px-3 py-2.5 rounded-xl border transition-all text-left"
                                                    style={active
                                                        ? { border: '2px solid #2d6a2d', background: 'rgba(45,106,45,0.06)' }
                                                        : { border: '2px solid rgba(0,0,0,0.10)', background: 'transparent' }
                                                    }
                                                >
                                                    <div
                                                        className="w-4 h-4 rounded flex items-center justify-center shrink-0 transition-all"
                                                        style={{ background: active ? '#2d6a2d' : 'transparent', border: `2px solid ${active ? '#2d6a2d' : 'rgba(0,0,0,0.25)'}` }}
                                                    >
                                                        {active && (
                                                            <svg width="9" height="7" viewBox="0 0 9 7" fill="none">
                                                                <path d="M1 3.5L3.5 6L8 1" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                                                            </svg>
                                                        )}
                                                    </div>
                                                    <span className="font-body text-sm font-medium" style={{ color: active ? '#1a4a1a' : '#555' }}>
                                                        {cat.name}
                                                    </span>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            <div className="flex gap-3 pt-2">
                                <button type="button" onClick={closeModal}
                                    className="cursor-pointer flex-1 py-3 rounded-xl border border-border text-text-muted font-semibold text-sm active:scale-95 transition-all">
                                    Cancelar
                                </button>
                                <button type="submit" disabled={formLoading}
                                    className="cursor-pointer flex-1 py-3 rounded-xl bg-primary hover:bg-primary-dark text-white font-bold text-sm uppercase tracking-widest transition-all active:scale-[0.98] disabled:opacity-60">
                                    {formLoading ? 'Guardando...' : editing ? 'Guardar' : 'Crear'}
                                </button>
                            </div>
                        </div>
                    </form>
                </div>,
                document.body
            )}
        </div>
    );
}
