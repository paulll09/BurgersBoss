import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Edit2, Trash2, X, GripVertical } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';
import { inputCls } from '../../utils/styles';
import { useConfirm } from '../ui/ConfirmDialog';

export default function AdminCategories() {
    const navigate = useNavigate();
    const confirm = useConfirm();
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [editing, setEditing] = useState(null);
    const [form, setForm] = useState({ name: '', display_order: '' });
    const [formLoading, setFormLoading] = useState(false);

    useEffect(() => {
        fetchCategories();
    }, []);

    // Ensure scroll is unlocked if component unmounts while modal is open
    useEffect(() => {
        return () => {
            document.body.style.overflow = '';
            document.body.style.position = '';
            document.body.style.top = '';
            document.body.style.width = '';
        };
    }, []);

    const BUSINESS_ID = import.meta.env.VITE_BUSINESS_ID;

    const fetchCategories = async () => {
        setLoading(true);
        const { data, error } = await supabase.from('categories').select('*').eq('business_id', BUSINESS_ID).order('display_order');
        if (error) toast.error(error.message);
        else setCategories(data);
        setLoading(false);
    };

    const lockScroll = () => {
        const scrollY = window.scrollY;
        document.body.style.overflow = 'hidden';
        document.body.style.position = 'fixed';
        document.body.style.top = `-${scrollY}px`;
        document.body.style.width = '100%';
    };

    const unlockScroll = () => {
        const scrollY = Math.abs(parseInt(document.body.style.top || '0'));
        document.body.style.overflow = '';
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.width = '';
        window.scrollTo(0, scrollY);
    };

    const openCreate = () => {
        lockScroll();
        setEditing(null);
        setForm({ name: '', display_order: categories.length + 1 });
        setModalOpen(true);
    };

    const openEdit = (cat) => {
        lockScroll();
        setEditing(cat);
        setForm({ name: cat.name, display_order: cat.display_order });
        setModalOpen(true);
    };

    const closeModal = () => {
        unlockScroll();
        setModalOpen(false);
        setEditing(null);
        setForm({ name: '', display_order: '' });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.name.trim()) {
            toast.error('El nombre es obligatorio');
            return;
        }

        setFormLoading(true);
        try {
            const payload = {
                name: form.name.trim(),
                display_order: parseInt(form.display_order) || 0,
            };

            if (editing) {
                const { error } = await supabase.from('categories').update(payload).eq('id', editing.id);
                if (error) throw error;
                toast.success('Categoría actualizada');
            } else {
                const { error } = await supabase.from('categories').insert({ ...payload, business_id: BUSINESS_ID });
                if (error) throw error;
                toast.success('Categoría creada');
            }

            closeModal();
            fetchCategories();
        } catch (err) {
            toast.error(err.message);
        } finally {
            setFormLoading(false);
        }
    };

    const handleDelete = async (cat) => {
        const ok = await confirm({
            title: '¿Eliminar categoría?',
            message: `"${cat.name}" se eliminará y sus productos quedarán sin categoría.`,
            confirmText: 'Eliminar',
        });
        if (!ok) return;
        const { error } = await supabase.from('categories').delete().eq('id', cat.id);
        if (error) {
            toast.error(error.message);
        } else {
            toast.success('Categoría eliminada');
            fetchCategories();
        }
    };

    return (
        <div className="max-w-6xl mx-auto animate-fade-up pb-10">

            {/* ── Header ── */}
            <div className="flex items-center justify-between mb-6 gap-3">
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => navigate('/admin/dashboard')}
                        className="cursor-pointer p-2.5 rounded-xl border border-border text-text-muted hover:text-text hover:border-primary/30 transition-all active:scale-95"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div>
                        <h1 className="font-display text-2xl sm:text-3xl font-black text-secondary uppercase tracking-wider leading-none">Categorías</h1>
                        <p className="text-text-muted text-xs font-body italic mt-0.5">
                            {loading ? '...' : `${categories.length} en total`}
                        </p>
                    </div>
                </div>
                <button
                    onClick={openCreate}
                    className="cursor-pointer flex items-center gap-2 bg-primary hover:bg-primary-dark text-white px-4 py-2.5 rounded-xl font-bold text-sm uppercase tracking-widest transition-all active:scale-95 shadow-[0_4px_14px_rgba(217,0,9,0.25)] shrink-0"
                >
                    <Plus className="w-4 h-4" />
                    <span className="hidden sm:inline">Nueva Categoría</span>
                    <span className="sm:hidden">Nueva</span>
                </button>
            </div>

            {/* ── Lista ── */}
            <div className="flex flex-col gap-3">
                {loading ? (
                    [...Array(3)].map((_, i) => (
                        <div key={i} className="h-16 rounded-2xl bg-surface animate-pulse" />
                    ))
                ) : categories.length === 0 ? (
                    <div className="py-16 text-center text-text-muted text-sm">
                        No hay categorías. Creá la primera.
                    </div>
                ) : (
                    categories.map((cat) => (
                        <div
                            key={cat.id}
                            className="flex items-center gap-3 p-4 rounded-2xl border border-border bg-background"
                        >
                            <GripVertical className="w-4 h-4 text-text-dim shrink-0" />

                            <div className="flex-1 min-w-0">
                                <p className="font-semibold text-text">{cat.name}</p>
                                <p className="text-text-muted text-xs mt-0.5">Orden: {cat.display_order}</p>
                            </div>

                            <div className="flex items-center gap-1 shrink-0">
                                <button
                                    onClick={() => openEdit(cat)}
                                    className="cursor-pointer p-2.5 rounded-xl text-blue-500 bg-blue-500/10 active:scale-90 transition-all"
                                >
                                    <Edit2 className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => handleDelete(cat)}
                                    className="cursor-pointer p-2.5 rounded-xl text-red-500 bg-red-500/10 active:scale-90 transition-all"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* ── Modal / Bottom Sheet (portal to escape animate-fade-up transform) ── */}
            {modalOpen && createPortal(
                <div
                    className="fixed inset-x-0 top-0 z-50 flex items-end sm:items-center justify-center"
                    style={{ height: '100dvh', background: 'rgba(0,0,0,0.65)' }}
                    onClick={(e) => { if (e.target === e.currentTarget) closeModal(); }}
                >
                    <div className="bg-background w-full sm:max-w-md sm:rounded-2xl rounded-t-3xl border border-border shadow-2xl animate-fade-up" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>

                        <div className="sm:hidden flex justify-center pt-3 pb-1">
                            <div className="w-10 h-1 rounded-full bg-border" />
                        </div>

                        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
                            <h2 className="font-display text-lg font-black text-secondary uppercase tracking-wider">
                                {editing ? 'Editar Categoría' : 'Nueva Categoría'}
                            </h2>
                            <button onClick={closeModal}
                                className="cursor-pointer p-2 rounded-xl text-text-muted hover:text-text hover:bg-surface transition-all active:scale-90">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="flex flex-col gap-4 px-5 py-5">
                            <div>
                                <label className="block text-xs font-semibold text-text-muted uppercase tracking-widest mb-2">
                                    Nombre <span className="text-primary">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={form.name}
                                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                                    placeholder="Ej: Hamburguesas & Lomitos"
                                    className={inputCls}
                                    autoFocus
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-text-muted uppercase tracking-widest mb-2">
                                    Orden de aparición
                                </label>
                                <input
                                    type="number"
                                    min="1"
                                    value={form.display_order}
                                    onChange={(e) => setForm({ ...form, display_order: e.target.value })}
                                    placeholder="1"
                                    className={inputCls}
                                />
                                <p className="text-text-dim text-xs mt-1.5">Número más bajo = aparece primero en el menú.</p>
                            </div>

                            <div className="flex gap-3 pt-1 pb-2">
                                <button type="button" onClick={closeModal}
                                    className="cursor-pointer flex-1 py-3 rounded-xl border border-border text-text-muted font-semibold text-sm active:scale-95 transition-all">
                                    Cancelar
                                </button>
                                <button type="submit" disabled={formLoading}
                                    className="cursor-pointer flex-1 py-3 rounded-xl bg-primary hover:bg-primary-dark text-white font-bold text-sm uppercase tracking-widest transition-all active:scale-[0.98] disabled:opacity-60 shadow-[0_4px_14px_rgba(217,0,9,0.2)]">
                                    {formLoading ? 'Guardando...' : editing ? 'Guardar' : 'Crear'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
}
