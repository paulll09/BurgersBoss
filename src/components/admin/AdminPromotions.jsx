import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Plus, Edit2, Trash2, Eye, EyeOff, X, Upload, Image as ImageIcon } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { usePromotions } from '../../hooks/usePromotions';
import toast from 'react-hot-toast';
import { inputCls } from '../../utils/styles';
import { useConfirm } from '../ui/ConfirmDialog';

const DAY_KEYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
const DAY_LABELS = { monday: 'Lun', tuesday: 'Mar', wednesday: 'Mié', thursday: 'Jue', friday: 'Vie', saturday: 'Sáb', sunday: 'Dom' };
const DAY_LABELS_FULL = { monday: 'Lunes', tuesday: 'Martes', wednesday: 'Miércoles', thursday: 'Jueves', friday: 'Viernes', saturday: 'Sábado', sunday: 'Domingo' };

/* ── Resize image preserving aspect ratio (max 1200px wide) ── */
function resizeImage(file) {
    return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => {
            URL.revokeObjectURL(img.src);
            const MAX_W = 1200;
            const scale = img.naturalWidth > MAX_W ? MAX_W / img.naturalWidth : 1;
            const W = Math.round(img.naturalWidth * scale);
            const H = Math.round(img.naturalHeight * scale);
            const canvas = document.createElement('canvas');
            canvas.width = W; canvas.height = H;
            canvas.getContext('2d').drawImage(img, 0, 0, W, H);
            canvas.toBlob((blob) => {
                resolve(blob ? new File([blob], `promo-${Date.now()}.jpg`, { type: 'image/jpeg' }) : null);
            }, 'image/jpeg', 0.92);
        };
        img.src = URL.createObjectURL(file);
    });
}

import { BUSINESS_ID } from '../../lib/config';
const EMPTY_FORM = { title: '', image_url: '', days: [], display_order: 0 };

export default function AdminPromotions() {
    const confirm = useConfirm();
    const { promotions, loading, refetch } = usePromotions(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [editing, setEditing] = useState(null);
    const [form, setForm] = useState(EMPTY_FORM);
    const [formLoading, setFormLoading] = useState(false);
    const [imageFile, setImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const fileInputRef = useRef(null);
    const formRef = useRef(null);
    const scrollYRef = useRef(0);

    const lockScroll = () => {
        scrollYRef.current = window.scrollY;
        document.body.style.position = 'fixed';
        document.body.style.top = `-${scrollYRef.current}px`;
        document.body.style.left = '0';
        document.body.style.right = '0';
        document.body.style.overflow = 'hidden';
    };

    const unlockScroll = () => {
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.left = '';
        document.body.style.right = '';
        document.body.style.overflow = '';
        window.scrollTo(0, scrollYRef.current);
    };

    // Ensure scroll is unlocked if component unmounts while modal is open
    useEffect(() => {
        return () => {
            document.body.style.position = '';
            document.body.style.top = '';
            document.body.style.left = '';
            document.body.style.right = '';
            document.body.style.overflow = '';
        };
    }, []);

    useEffect(() => {
        if (modalOpen && formRef.current) formRef.current.scrollTop = 0;
    }, [modalOpen]);

    const openCreate = () => {
        lockScroll();
        setEditing(null);
        setForm(EMPTY_FORM);
        setImageFile(null);
        setImagePreview(null);
        setModalOpen(true);
    };

    const openEdit = (promo) => {
        lockScroll();
        setEditing(promo);
        setForm({
            title: promo.title,
            image_url: promo.image_url || '',
            days: promo.days || [],
            display_order: promo.display_order || 0,
        });
        setImageFile(null);
        setImagePreview(promo.image_url || null);
        setModalOpen(true);
    };

    const closeModal = () => {
        unlockScroll();
        setModalOpen(false);
        setEditing(null);
        setForm(EMPTY_FORM);
        setImageFile(null);
        setImagePreview(prev => {
            if (prev && prev.startsWith('blob:')) URL.revokeObjectURL(prev);
            return null;
        });
    };

    const handleFileChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        e.target.value = '';
        const resized = await resizeImage(file);
        if (resized) {
            setImagePreview(prev => {
                if (prev && prev.startsWith('blob:')) URL.revokeObjectURL(prev);
                return URL.createObjectURL(resized);
            });
            setImageFile(resized);
        }
    };

    const uploadImage = async (file) => {
        const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
        const MAX_MB = 5;
        if (!ALLOWED_TYPES.includes(file.type))
            throw new Error('Solo se permiten imágenes JPG, PNG, WEBP o GIF.');
        if (file.size > MAX_MB * 1024 * 1024)
            throw new Error(`La imagen no puede superar los ${MAX_MB} MB.`);
        const ext = file.type.split('/')[1];
        const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
        const { error } = await supabase.storage.from('promo-images').upload(filename, file);
        if (error) throw error;
        const { data } = supabase.storage.from('promo-images').getPublicUrl(filename);
        return data.publicUrl;
    };

    const toggleDay = (day) => {
        setForm(prev => ({
            ...prev,
            days: prev.days.includes(day)
                ? prev.days.filter(d => d !== day)
                : [...prev.days, day],
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.title.trim()) {
            toast.error('Ingresá un título para la promo');
            return;
        }
        if (!imageFile && !form.image_url) {
            toast.error('Subí una imagen para la promo');
            return;
        }
        if (form.days.length === 0) {
            toast.error('Seleccioná al menos un día');
            return;
        }

        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
            toast.error('Sesión expirada. Volvé a iniciar sesión.');
            navigate('/admin');
            return;
        }

        setFormLoading(true);
        try {
            let imageUrl = form.image_url;
            if (imageFile) imageUrl = await uploadImage(imageFile);

            const payload = {
                title: form.title.trim(),
                image_url: imageUrl,
                days: form.days,
                display_order: parseInt(form.display_order) || 0,
            };

            if (editing) {
                const { error } = await supabase.from('promotions').update(payload).eq('id', editing.id);
                if (error) throw error;
                toast.success('Promo actualizada');
            } else {
                const { error } = await supabase.from('promotions').insert({ ...payload, active: true, business_id: BUSINESS_ID });
                if (error) throw error;
                toast.success('Promo creada');
            }

            closeModal();
            refetch();
        } catch (err) {
            toast.error(err.message);
        } finally {
            setFormLoading(false);
        }
    };

    const handleToggleActive = async (promo) => {
        const { error } = await supabase
            .from('promotions')
            .update({ active: !promo.active })
            .eq('id', promo.id);
        if (error) {
            toast.error(error.message);
        } else {
            toast.success(promo.active ? 'Promo ocultada' : 'Promo visible');
            refetch();
        }
    };

    const handleDelete = async (promo) => {
        const ok = await confirm({
            title: '¿Eliminar promoción?',
            message: `"${promo.title}" se eliminará permanentemente.`,
            confirmText: 'Eliminar',
        });
        if (!ok) return;
        const { error } = await supabase.from('promotions').delete().eq('id', promo.id);
        if (error) {
            toast.error(error.message);
        } else {
            toast.success('Eliminada');
            refetch();
        }
    };

    return (
        <div className="max-w-6xl mx-auto animate-fade-up pb-10">

            {/* ── Header ── */}
            <div className="flex items-center justify-between mb-6 gap-3">
                <div>
                    <h1 className="font-display uppercase leading-none" style={{ fontSize: 'clamp(1.8rem, 5vw, 2.4rem)', color: '#111' }}>
                        Promociones
                    </h1>
                    <p className="font-body text-xs mt-0.5" style={{ color: 'rgba(0,0,0,0.40)' }}>
                        {loading ? '...' : `${promotions.length} en total`}
                    </p>
                </div>
                <button
                    onClick={openCreate}
                    className="cursor-pointer flex items-center gap-2 bg-primary hover:bg-primary-dark text-white px-4 py-2.5 rounded-xl font-bold text-sm uppercase tracking-widest transition-all active:scale-95 shadow-[0_4px_14px_rgba(45,106,45,0.28)] shrink-0"
                >
                    <Plus className="w-4 h-4" />
                    <span className="hidden sm:inline">Nueva Promo</span>
                    <span className="sm:hidden">Nueva</span>
                </button>
            </div>

            {/* ── Mobile: Cards ── */}
            <div className="sm:hidden flex flex-col gap-3">
                {loading ? (
                    [...Array(3)].map((_, i) => (
                        <div key={i} className="h-24 rounded-2xl bg-surface animate-pulse" />
                    ))
                ) : promotions.length === 0 ? (
                    <div className="py-16 text-center text-text-muted text-sm">
                        No hay promociones. Creá la primera.
                    </div>
                ) : (
                    promotions.map((promo) => (
                        <div
                            key={promo.id}
                            className={`flex items-center gap-3 p-3 rounded-2xl border border-border bg-background transition-all ${!promo.active ? 'opacity-50' : ''}`}
                        >
                            {/* Image */}
                            <div className="w-20 h-12 rounded-xl bg-surface overflow-hidden border border-border flex items-center justify-center shrink-0">
                                {promo.image_url
                                    ? <img src={promo.image_url} alt={promo.title} className="w-full h-full object-cover" loading="lazy" />
                                    : <ImageIcon className="w-5 h-5 text-text-dim" />
                                }
                            </div>

                            {/* Info */}
                            <div className="flex-1 min-w-0">
                                <p className="font-semibold text-text text-sm truncate">{promo.title}</p>
                                <div className="flex flex-wrap gap-1 mt-1">
                                    {promo.days?.map(d => (
                                        <span key={d} className="text-[10px] font-bold bg-primary/10 text-primary px-1.5 py-0.5 rounded-full uppercase">
                                            {DAY_LABELS[d]}
                                        </span>
                                    ))}
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex items-center gap-1 shrink-0">
                                <button
                                    onClick={() => handleToggleActive(promo)}
                                    className={`p-2.5 rounded-xl transition-all active:scale-90 ${promo.active ? 'text-green-500 bg-green-500/10' : 'text-text-dim bg-surface'}`}
                                >
                                    {promo.active ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                                </button>
                                <button
                                    onClick={() => openEdit(promo)}
                                    className="p-2.5 rounded-xl text-blue-500 bg-blue-500/10 active:scale-90 transition-all"
                                >
                                    <Edit2 className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => handleDelete(promo)}
                                    className="p-2.5 rounded-xl text-red-500 bg-red-500/10 active:scale-90 transition-all"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* ── Desktop: Table ── */}
            <div className="hidden sm:block border border-border rounded-2xl overflow-hidden bg-background shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-border text-text-muted text-xs uppercase tracking-widest">
                                <th className="p-4 font-semibold">Imagen</th>
                                <th className="p-4 font-semibold">Título</th>
                                <th className="p-4 font-semibold">Días</th>
                                <th className="p-4 font-semibold text-center">Activa</th>
                                <th className="p-4 font-semibold text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {loading ? (
                                [...Array(3)].map((_, i) => (
                                    <tr key={i}><td colSpan="5" className="p-4">
                                        <div className="h-10 bg-surface animate-pulse rounded-lg" />
                                    </td></tr>
                                ))
                            ) : promotions.length === 0 ? (
                                <tr><td colSpan="5" className="p-10 text-center text-text-muted text-sm">
                                    No hay promociones. Creá la primera.
                                </td></tr>
                            ) : (
                                promotions.map((promo) => (
                                    <tr key={promo.id} className={`transition-colors hover:bg-surface/50 ${!promo.active ? 'opacity-50' : ''}`}>
                                        <td className="p-4">
                                            <div className="w-24 h-14 rounded-xl bg-surface overflow-hidden border border-border flex items-center justify-center">
                                                {promo.image_url
                                                    ? <img src={promo.image_url} alt={promo.title} className="w-full h-full object-cover" loading="lazy" />
                                                    : <ImageIcon className="w-5 h-5 text-text-dim" />
                                                }
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <p className="font-semibold text-text text-sm truncate max-w-[200px]">{promo.title}</p>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex flex-wrap gap-1">
                                                {promo.days?.map(d => (
                                                    <span key={d} className="text-[10px] font-bold bg-primary/10 text-primary px-2 py-0.5 rounded-full uppercase">
                                                        {DAY_LABELS_FULL[d]}
                                                    </span>
                                                ))}
                                            </div>
                                        </td>
                                        <td className="p-4 text-center">
                                            <button onClick={() => handleToggleActive(promo)}
                                                className={`cursor-pointer p-1.5 rounded-lg transition-all ${promo.active ? 'text-green-500 hover:bg-green-500/10' : 'text-text-dim hover:bg-surface'}`}>
                                                {promo.active ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                                            </button>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex items-center justify-end gap-1">
                                                <button onClick={() => openEdit(promo)}
                                                    className="cursor-pointer p-2 text-blue-500 hover:bg-blue-500/10 rounded-lg transition-all">
                                                    <Edit2 className="w-4 h-4" />
                                                </button>
                                                <button onClick={() => handleDelete(promo)}
                                                    className="cursor-pointer p-2 text-red-500 hover:bg-red-500/10 rounded-lg transition-all">
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* ── Promo Form — Full Screen Portal ── */}
            {modalOpen && createPortal(
                <div style={{ position: 'fixed', inset: 0, zIndex: 50, overflowY: 'auto', WebkitOverflowScrolling: 'touch', background: 'var(--color-background, #fff)' }}>

                    {/* Sticky header */}
                    <div style={{ position: 'sticky', top: 0, zIndex: 10, background: 'var(--color-background, #fff)', borderBottom: '1px solid var(--color-border, #e5e5e5)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px' }}>
                            <h2 className="font-display text-lg font-black text-secondary uppercase tracking-wider">
                                {editing ? 'Editar Promo' : 'Nueva Promo'}
                            </h2>
                            <button type="button" onClick={closeModal}
                                className="cursor-pointer p-2 rounded-xl text-text-muted hover:text-text hover:bg-surface transition-all active:scale-90">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                    </div>

                    {/* Form */}
                    <form ref={formRef} onSubmit={handleSubmit} style={{ maxWidth: '480px', margin: '0 auto', padding: '20px 20px calc(20px + env(safe-area-inset-bottom))' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

                            {/* Image upload */}
                            <div>
                                <label className="block text-xs font-semibold text-text-muted uppercase tracking-widest mb-2">
                                    Imagen de la promo <span className="text-primary">*</span>
                                </label>
                                <button
                                    type="button"
                                    onClick={() => fileInputRef.current?.click()}
                                    className="cursor-pointer w-full rounded-xl border-2 border-dashed border-border hover:border-primary/40 active:border-primary/60 transition-colors overflow-hidden bg-surface"
                                    style={imagePreview ? {} : { aspectRatio: '16 / 9' }}
                                >
                                    {imagePreview ? (
                                        <img src={imagePreview} alt="preview" className="w-full h-auto rounded-xl" />
                                    ) : (
                                        <div className="flex flex-col items-center justify-center h-full gap-2 text-text-muted">
                                            <Upload className="w-7 h-7" />
                                            <span className="text-sm font-medium">Tocar para subir imagen</span>
                                            <span className="text-xs text-text-dim">Se sube en su tamaño original</span>
                                        </div>
                                    )}
                                </button>
                                {imagePreview && (
                                    <button type="button" onClick={() => fileInputRef.current?.click()}
                                        className="cursor-pointer mt-2 text-xs text-primary font-semibold hover:underline">
                                        Cambiar imagen
                                    </button>
                                )}
                                <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="hidden" onChange={handleFileChange} />
                            </div>

                            {/* Title */}
                            <div>
                                <label className="block text-xs font-semibold text-text-muted uppercase tracking-widest mb-2">
                                    Título (solo admin) <span className="text-primary">*</span>
                                </label>
                                <input type="text" value={form.title}
                                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                                    placeholder="Ej: Pizza 2x1 Jueves"
                                    className={inputCls} />
                            </div>

                            {/* Day selector */}
                            <div>
                                <label className="block text-xs font-semibold text-text-muted uppercase tracking-widest mb-2">
                                    Días de la promo <span className="text-primary">*</span>
                                </label>
                                <div className="flex flex-wrap gap-2">
                                    {DAY_KEYS.map(day => {
                                        const selected = form.days.includes(day);
                                        return (
                                            <button
                                                key={day}
                                                type="button"
                                                onClick={() => toggleDay(day)}
                                                className={`cursor-pointer px-3.5 py-2 rounded-xl text-sm font-bold uppercase tracking-wider transition-all active:scale-95 ${
                                                    selected
                                                        ? 'bg-primary text-white shadow-[0_2px_8px_rgba(45,106,45,0.28)]'
                                                        : 'bg-surface border border-border text-text-muted hover:border-primary/30'
                                                }`}
                                            >
                                                {DAY_LABELS[day]}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Display order */}
                            <div>
                                <label className="block text-xs font-semibold text-text-muted uppercase tracking-widest mb-2">Orden</label>
                                <input type="number" min="0" value={form.display_order}
                                    onChange={(e) => setForm({ ...form, display_order: e.target.value })}
                                    placeholder="0"
                                    className={inputCls} />
                            </div>

                            {/* Submit buttons */}
                            <div className="flex gap-3 pt-1 pb-4">
                                <button type="button" onClick={closeModal}
                                    className="cursor-pointer flex-1 py-3 rounded-xl border border-border text-text-muted font-semibold text-sm active:scale-95 transition-all">
                                    Cancelar
                                </button>
                                <button type="submit" disabled={formLoading}
                                    className="cursor-pointer flex-1 py-3 rounded-xl bg-primary hover:bg-primary-dark text-white font-bold text-sm uppercase tracking-widest transition-all active:scale-[0.98] disabled:opacity-60 shadow-[0_4px_14px_rgba(45,106,45,0.22)]">
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
