import { useState, useRef, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Edit2, Trash2, Eye, EyeOff, X, Upload, Image as ImageIcon, Search } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useProducts } from '../../hooks/useProducts';
import toast from 'react-hot-toast';
import { inputCls } from '../../utils/styles';
import { useConfirm } from '../ui/ConfirmDialog';

/* ── Resize image to 800x600 (cover + center crop) ── */
function resizeImage(file) {
    return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => {
            URL.revokeObjectURL(img.src);
            const W = 800, H = 600;
            const scale = Math.max(W / img.naturalWidth, H / img.naturalHeight);
            const sw = W / scale, sh = H / scale;
            const sx = (img.naturalWidth - sw) / 2;
            const sy = (img.naturalHeight - sh) / 2;
            const canvas = document.createElement('canvas');
            canvas.width = W; canvas.height = H;
            canvas.getContext('2d').drawImage(img, sx, sy, sw, sh, 0, 0, W, H);
            canvas.toBlob((blob) => {
                resolve(blob ? new File([blob], `product-${Date.now()}.jpg`, { type: 'image/jpeg' }) : null);
            }, 'image/jpeg', 0.92);
        };
        img.src = URL.createObjectURL(file);
    });
}


const BUSINESS_ID = import.meta.env.VITE_BUSINESS_ID;
const EMPTY_FORM = { name: '', description: '', price: '', category_id: '', image_url: '', discount: 0, variants: [] };

export default function AdminProducts() {
    const navigate = useNavigate();
    const confirm = useConfirm();
    const { products, categories, loading, refetch } = useProducts(true);
    const categoryMap = useMemo(
        () => new Map(categories.map(c => [c.id, c.name])),
        [categories]
    );
    const [search, setSearch] = useState('');
    const [filterCat, setFilterCat] = useState('');

    const filteredProducts = useMemo(() => {
        let list = products;
        if (filterCat) list = list.filter(p => p.category_id === filterCat);
        if (search.trim()) {
            const q = search.trim().toLowerCase();
            list = list.filter(p => p.name.toLowerCase().includes(q));
        }
        return list;
    }, [products, search, filterCat]);

    const [modalOpen, setModalOpen] = useState(false);
    const [editing, setEditing] = useState(null);
    const [form, setForm] = useState(EMPTY_FORM);
    const [formLoading, setFormLoading] = useState(false);
    const [imageFile, setImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const fileInputRef = useRef(null);
    const formRef = useRef(null);

    const scrollYRef = useRef(0);

    const hasVariants = form.variants.length > 0;

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

    const openEdit = (product) => {
        lockScroll();
        setEditing(product);
        const variants = (product.product_variants || []).map(v => ({
            id: v.id,
            name: v.name,
            price: v.price,
            discount: v.discount || 0,
            display_order: v.display_order || 0,
        }));
        setForm({
            name: product.name,
            description: product.description || '',
            price: product.price,
            category_id: product.category_id || '',
            image_url: product.image_url || '',
            discount: product.discount || 0,
            variants,
        });
        setImageFile(null);
        setImagePreview(product.image_url || null);
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
        const { error } = await supabase.storage.from('product-images').upload(filename, file);
        if (error) throw error;
        const { data } = supabase.storage.from('product-images').getPublicUrl(filename);
        return data.publicUrl;
    };

    /* ── Variant helpers ── */
    const addVariant = () => {
        setForm(f => ({
            ...f,
            variants: [...f.variants, { id: crypto.randomUUID(), name: '', price: '', discount: 0, display_order: f.variants.length }],
        }));
    };

    const updateVariant = (idx, field, value) => {
        setForm(f => ({
            ...f,
            variants: f.variants.map((v, i) => i === idx ? { ...v, [field]: value } : v),
        }));
    };

    const removeVariant = (idx) => {
        setForm(f => ({
            ...f,
            variants: f.variants.filter((_, i) => i !== idx),
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!form.name.trim() || !form.category_id) {
            toast.error('Completá nombre y categoría');
            return;
        }

        if (hasVariants) {
            const invalidVariant = form.variants.some(v => !v.name.trim() || !v.price);
            if (invalidVariant) {
                toast.error('Completá nombre y precio de cada variante');
                return;
            }
        } else if (!form.price) {
            toast.error('Completá el precio');
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

            const variantPrices = form.variants.map(v => parseFloat(v.price));
            const basePrice = hasVariants ? Math.min(...variantPrices) : parseFloat(form.price);

            const payload = {
                name: form.name.trim(),
                description: form.description.trim(),
                price: basePrice,
                category_id: form.category_id,
                image_url: imageUrl || null,
                discount: hasVariants ? 0 : (parseInt(form.discount) || 0),
            };

            let productId;

            if (editing) {
                const { error } = await supabase.from('products').update(payload).eq('id', editing.id);
                if (error) throw error;
                productId = editing.id;
            } else {
                const { data, error } = await supabase.from('products').insert({ ...payload, visible: true, business_id: BUSINESS_ID }).select('id').single();
                if (error) throw error;
                productId = data.id;
            }

            // Sync variants: delete all then re-insert
            if (editing) {
                const { error: delErr } = await supabase.from('product_variants').delete().eq('product_id', productId);
                if (delErr) throw delErr;
            }

            if (hasVariants) {
                const variantRows = form.variants.map((v, i) => ({
                    product_id: productId,
                    name: v.name.trim(),
                    price: parseFloat(v.price),
                    discount: parseInt(v.discount) || 0,
                    display_order: i,
                }));
                const { error: insErr } = await supabase.from('product_variants').insert(variantRows);
                if (insErr) throw insErr;
            }

            toast.success(editing ? 'Producto actualizado' : 'Producto creado');
            closeModal();
            refetch();
        } catch (err) {
            toast.error(err.message);
        } finally {
            setFormLoading(false);
        }
    };

    const handleToggleVisible = async (product) => {
        const { error } = await supabase
            .from('products')
            .update({ visible: !product.visible })
            .eq('id', product.id);
        if (error) {
            toast.error(error.message);
        } else {
            toast.success(product.visible ? 'Producto ocultado' : 'Producto visible');
            refetch();
        }
    };

    const handleDelete = async (product) => {
        const ok = await confirm({
            title: '¿Eliminar producto?',
            message: `"${product.name}" se eliminará permanentemente. Esta acción no se puede deshacer.`,
            confirmText: 'Eliminar',
        });
        if (!ok) return;
        const { error } = await supabase.from('products').delete().eq('id', product.id);
        if (error) {
            toast.error(error.message);
        } else {
            toast.success('Eliminado');
            refetch();
        }
    };

    /* ── Price display helper for admin list ── */
    const renderAdminPrice = (product) => {
        const variants = product.product_variants || [];
        if (variants.length > 0) {
            const prices = variants.map(v => v.price);
            const min = Math.min(...prices);
            const max = Math.max(...prices);
            return (
                <div>
                    <span className="font-bold text-primary text-sm">
                        ${min.toLocaleString('es-AR')}{min !== max ? ` - $${max.toLocaleString('es-AR')}` : ''}
                    </span>
                    <span className="text-text-dim text-[10px] ml-1.5">{variants.length} var.</span>
                </div>
            );
        }
        if (product.discount > 0) {
            return (
                <div>
                    <span className="font-bold text-primary text-sm">${Math.round(product.price * (1 - product.discount / 100)).toLocaleString('es-AR')}</span>
                    <span className="text-text-dim text-xs line-through ml-1.5">${Number(product.price).toLocaleString('es-AR')}</span>
                    <span className="text-[10px] font-bold text-primary ml-1">-{product.discount}%</span>
                </div>
            );
        }
        return <span className="font-bold text-primary text-sm">${Number(product.price).toLocaleString('es-AR')}</span>;
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
                        <h1 className="font-display text-2xl sm:text-3xl font-black text-secondary uppercase tracking-wider leading-none">Productos</h1>
                        <p className="text-text-muted text-xs font-body italic mt-0.5">
                            {loading ? '...' : `${products.length} en total`}
                        </p>
                    </div>
                </div>
                <button
                    onClick={openCreate}
                    className="cursor-pointer flex items-center gap-2 bg-primary hover:bg-primary-dark text-white px-4 py-2.5 rounded-xl font-bold text-sm uppercase tracking-widest transition-all active:scale-95 shadow-[0_4px_14px_rgba(217,0,9,0.25)] shrink-0"
                >
                    <Plus className="w-4 h-4" />
                    <span className="hidden sm:inline">Nuevo Producto</span>
                    <span className="sm:hidden">Nuevo</span>
                </button>
            </div>

            {/* ── Search + Filter ── */}
            {!loading && products.length > 0 && (
                <div className="flex gap-2 mb-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-dim" />
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Buscar producto..."
                            className={`${inputCls} pl-9 py-2.5 text-sm`}
                        />
                    </div>
                    <select
                        value={filterCat}
                        onChange={(e) => setFilterCat(e.target.value)}
                        className={`${inputCls} py-2.5 text-sm w-auto min-w-[130px]`}
                    >
                        <option value="">Todas</option>
                        {categories.map((c) => (
                            <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                    </select>
                </div>
            )}

            {/* ── Mobile: Cards ── */}
            <div className="sm:hidden flex flex-col gap-3">
                {loading ? (
                    [...Array(3)].map((_, i) => (
                        <div key={i} className="h-20 rounded-2xl bg-surface animate-pulse" />
                    ))
                ) : filteredProducts.length === 0 ? (
                    <div className="py-16 text-center text-text-muted text-sm">
                        {products.length === 0 ? 'No hay productos. Creá el primero.' : 'No se encontraron productos.'}
                    </div>
                ) : (
                    filteredProducts.map((product) => {
                        const catName = categoryMap.get(product.category_id);
                        return (
                            <div
                                key={product.id}
                                className={`flex items-center gap-3 p-3 rounded-2xl border border-border bg-background transition-all ${!product.visible ? 'opacity-50' : ''}`}
                            >
                                {/* Image */}
                                <div className="w-14 h-14 rounded-xl bg-surface overflow-hidden border border-border flex items-center justify-center shrink-0">
                                    {product.image_url
                                        ? <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" loading="lazy" />
                                        : <ImageIcon className="w-5 h-5 text-text-dim" />
                                    }
                                </div>

                                {/* Info */}
                                <div className="flex-1 min-w-0">
                                    <p className="font-semibold text-text text-sm truncate">{product.name}</p>
                                    {catName && <p className="text-text-muted text-xs truncate">{catName}</p>}
                                    <div className="mt-0.5">{renderAdminPrice(product)}</div>
                                </div>

                                {/* Actions */}
                                <div className="flex items-center gap-1 shrink-0">
                                    <button
                                        onClick={() => handleToggleVisible(product)}
                                        className={`p-2.5 rounded-xl transition-all active:scale-90 ${product.visible ? 'text-green-500 bg-green-500/10' : 'text-text-dim bg-surface'}`}
                                    >
                                        {product.visible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                                    </button>
                                    <button
                                        onClick={() => openEdit(product)}
                                        className="p-2.5 rounded-xl text-blue-500 bg-blue-500/10 active:scale-90 transition-all"
                                    >
                                        <Edit2 className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(product)}
                                        className="p-2.5 rounded-xl text-red-500 bg-red-500/10 active:scale-90 transition-all"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {/* ── Desktop: Table ── */}
            <div className="hidden sm:block border border-border rounded-2xl overflow-hidden bg-background shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-border text-text-muted text-xs uppercase tracking-widest">
                                <th className="p-4 font-semibold">Imagen</th>
                                <th className="p-4 font-semibold">Nombre</th>
                                <th className="p-4 font-semibold">Categoría</th>
                                <th className="p-4 font-semibold">Precio</th>
                                <th className="p-4 font-semibold text-center">Visible</th>
                                <th className="p-4 font-semibold text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {loading ? (
                                [...Array(4)].map((_, i) => (
                                    <tr key={i}><td colSpan="6" className="p-4">
                                        <div className="h-10 bg-surface animate-pulse rounded-lg" />
                                    </td></tr>
                                ))
                            ) : filteredProducts.length === 0 ? (
                                <tr><td colSpan="6" className="p-10 text-center text-text-muted text-sm">
                                    {products.length === 0 ? 'No hay productos. Creá el primero.' : 'No se encontraron productos.'}
                                </td></tr>
                            ) : (
                                filteredProducts.map((product) => (
                                    <tr key={product.id} className={`transition-colors hover:bg-surface/50 ${!product.visible ? 'opacity-50' : ''}`}>
                                        <td className="p-4">
                                            <div className="w-12 h-12 rounded-xl bg-surface overflow-hidden border border-border flex items-center justify-center">
                                                {product.image_url
                                                    ? <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" loading="lazy" />
                                                    : <ImageIcon className="w-5 h-5 text-text-dim" />
                                                }
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <p className="font-semibold text-text text-sm truncate max-w-[180px]">{product.name}</p>
                                            {product.description && <p className="text-text-muted text-xs truncate max-w-[180px] mt-0.5">{product.description}</p>}
                                        </td>
                                        <td className="p-4 text-text-muted text-sm">
                                            {categoryMap.get(product.category_id) || '—'}
                                        </td>
                                        <td className="p-4">
                                            {renderAdminPrice(product)}
                                        </td>
                                        <td className="p-4 text-center">
                                            <button onClick={() => handleToggleVisible(product)}
                                                className={`cursor-pointer p-1.5 rounded-lg transition-all ${product.visible ? 'text-green-500 hover:bg-green-500/10' : 'text-text-dim hover:bg-surface'}`}>
                                                {product.visible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                                            </button>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex items-center justify-end gap-1">
                                                <button onClick={() => openEdit(product)}
                                                    className="cursor-pointer p-2 text-blue-500 hover:bg-blue-500/10 rounded-lg transition-all">
                                                    <Edit2 className="w-4 h-4" />
                                                </button>
                                                <button onClick={() => handleDelete(product)}
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

            {/* ── Product Form — Full Screen (portal to escape animate-fade-up transform) ── */}
            {modalOpen && createPortal(
                <div style={{ position: 'fixed', inset: 0, zIndex: 50, overflowY: 'auto', WebkitOverflowScrolling: 'touch', background: 'var(--color-background, #fff)' }}>

                    {/* Sticky header */}
                    <div style={{ position: 'sticky', top: 0, zIndex: 10, background: 'var(--color-background, #fff)', borderBottom: '1px solid var(--color-border, #e5e5e5)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px' }}>
                            <h2 className="font-display text-lg font-black text-secondary uppercase tracking-wider">
                                {editing ? 'Editar Producto' : 'Nuevo Producto'}
                            </h2>
                            <button type="button" onClick={closeModal}
                                className="cursor-pointer p-2 rounded-xl text-text-muted hover:text-text hover:bg-surface transition-all active:scale-90">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                    </div>

                    {/* Form — just normal document flow, scrolls with parent */}
                    <form ref={formRef} onSubmit={handleSubmit} style={{ maxWidth: '480px', margin: '0 auto', padding: '20px 20px calc(20px + env(safe-area-inset-bottom))' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

                                {/* Image upload — compact */}
                                <div>
                                    <label className="block text-xs font-semibold text-text-muted uppercase tracking-widest mb-2">Imagen</label>
                                    <button
                                        type="button"
                                        onClick={() => fileInputRef.current?.click()}
                                        className="cursor-pointer w-full rounded-xl border-2 border-dashed border-border hover:border-primary/40 active:border-primary/60 transition-colors overflow-hidden bg-surface"
                                        style={{ aspectRatio: '4 / 3' }}
                                    >
                                        {imagePreview ? (
                                            <img src={imagePreview} alt="preview" className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="flex flex-col items-center justify-center h-full gap-2 text-text-muted">
                                                <Upload className="w-7 h-7" />
                                                <span className="text-sm font-medium">Tocar para subir foto</span>
                                                <span className="text-xs text-text-dim">Se ajusta a 4:3 automáticamente</span>
                                            </div>
                                        )}
                                    </button>
                                    {imagePreview && (
                                        <button type="button" onClick={() => fileInputRef.current?.click()}
                                            className="cursor-pointer mt-2 text-xs text-primary font-semibold hover:underline">
                                            Cambiar foto
                                        </button>
                                    )}
                                    <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="hidden" onChange={handleFileChange} />
                                </div>

                                {/* Name */}
                                <div>
                                    <label className="block text-xs font-semibold text-text-muted uppercase tracking-widest mb-2">
                                        Nombre <span className="text-primary">*</span>
                                    </label>
                                    <input type="text" value={form.name}
                                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                                        placeholder="Ej: Doble Burger"
                                        className={inputCls} />
                                </div>

                                {/* Description */}
                                <div>
                                    <label className="block text-xs font-semibold text-text-muted uppercase tracking-widest mb-2">Descripción</label>
                                    <textarea value={form.description}
                                        onChange={(e) => setForm({ ...form, description: e.target.value })}
                                        placeholder="Ej: Doble carne, doble queso..."
                                        rows="2"
                                        className={`${inputCls} resize-none`} />
                                </div>

                                {/* Category (always visible) */}
                                <div>
                                    <label className="block text-xs font-semibold text-text-muted uppercase tracking-widest mb-2">
                                        Categoría <span className="text-primary">*</span>
                                    </label>
                                    <select value={form.category_id}
                                        onChange={(e) => setForm({ ...form, category_id: e.target.value })}
                                        className={inputCls}>
                                        <option value="">Elegir...</option>
                                        {categories.map((c) => (
                                            <option key={c.id} value={c.id}>{c.name}</option>
                                        ))}
                                    </select>
                                </div>

                                {/* Price + Discount — only when NO variants */}
                                {!hasVariants && (
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="block text-xs font-semibold text-text-muted uppercase tracking-widest mb-2">
                                                Precio <span className="text-primary">*</span>
                                            </label>
                                            <div className="relative">
                                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-dim text-sm">$</span>
                                                <input type="number" min="0" step="100" value={form.price}
                                                    onChange={(e) => setForm({ ...form, price: e.target.value })}
                                                    placeholder="8500"
                                                    className={`${inputCls} pl-7`} />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-semibold text-text-muted uppercase tracking-widest mb-2">Descuento</label>
                                            <div className="relative">
                                                <input type="number" min="0" max="100" step="1" value={form.discount}
                                                    onChange={(e) => setForm({ ...form, discount: e.target.value })}
                                                    placeholder="0"
                                                    className={`${inputCls} pr-8`} />
                                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-text-dim text-sm font-semibold">%</span>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* ── Variants section ── */}
                                <div>
                                    <div className="flex items-center justify-between mb-2">
                                        <label className="block text-xs font-semibold text-text-muted uppercase tracking-widest">Variantes</label>
                                        <button
                                            type="button"
                                            onClick={addVariant}
                                            className="cursor-pointer flex items-center gap-1 text-xs text-primary font-semibold hover:underline"
                                        >
                                            <Plus className="w-3.5 h-3.5" />
                                            Agregar variante
                                        </button>
                                    </div>

                                    {hasVariants ? (
                                        <div className="flex flex-col gap-2.5">
                                            {form.variants.map((v, idx) => (
                                                <div key={v.id} className="flex items-start gap-2 p-3 rounded-xl border border-border bg-surface/50">
                                                    <div className="flex-1 flex flex-col gap-2">
                                                        <input
                                                            type="text"
                                                            value={v.name}
                                                            onChange={(e) => updateVariant(idx, 'name', e.target.value)}
                                                            placeholder="Ej: Grande"
                                                            className={`${inputCls} text-sm py-2.5`}
                                                        />
                                                        <div className="grid grid-cols-2 gap-2">
                                                            <div className="relative">
                                                                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-text-dim text-xs">$</span>
                                                                <input
                                                                    type="number"
                                                                    min="0"
                                                                    step="100"
                                                                    value={v.price}
                                                                    onChange={(e) => updateVariant(idx, 'price', e.target.value)}
                                                                    placeholder="Precio"
                                                                    className={`${inputCls} text-sm py-2.5 pl-6`}
                                                                />
                                                            </div>
                                                            <div className="relative">
                                                                <input
                                                                    type="number"
                                                                    min="0"
                                                                    max="100"
                                                                    step="1"
                                                                    value={v.discount}
                                                                    onChange={(e) => updateVariant(idx, 'discount', e.target.value)}
                                                                    placeholder="Dto %"
                                                                    className={`${inputCls} text-sm py-2.5 pr-7`}
                                                                />
                                                                <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-dim text-xs font-semibold">%</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={() => removeVariant(idx)}
                                                        className="cursor-pointer p-2 text-red-400 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all mt-1"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            ))}
                                            <p className="text-text-dim text-[11px] italic">El precio base se calculará automáticamente del menor precio de las variantes.</p>
                                        </div>
                                    ) : (
                                        <p className="text-text-dim text-xs">Sin variantes. El producto tendrá un precio único.</p>
                                    )}
                                </div>

                                {/* Live preview */}
                                {(form.name || imagePreview) && (
                                    <div>
                                        <label className="block text-xs font-semibold text-text-muted uppercase tracking-widest mb-2">Así se verá en el menú</label>
                                        <div
                                            className="flex flex-col overflow-hidden rounded-2xl bg-cream pointer-events-none"
                                            style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.06), 0 0 0 1px rgba(0,0,0,0.07)' }}
                                        >
                                            <div className="relative w-full aspect-[4/3] overflow-hidden bg-surface2">
                                                {imagePreview ? (
                                                    <img src={imagePreview} alt="preview" className="w-full h-full object-cover" />
                                                ) : (
                                                    <div className="w-full h-full bg-surface2" />
                                                )}
                                                {!hasVariants && parseInt(form.discount) > 0 && parseInt(form.discount) <= 100 && (
                                                    <div className="absolute top-2 left-2 bg-primary text-white text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full shadow-md">
                                                        -{parseInt(form.discount)}%
                                                    </div>
                                                )}
                                            </div>
                                            <div className="px-4 pt-3 pb-3.5">
                                                <h3 className="font-display font-semibold text-text uppercase leading-tight text-[1rem]">
                                                    {form.name || 'Nombre'}
                                                </h3>
                                                {form.description && (
                                                    <p className="text-text-muted text-[12px] leading-snug line-clamp-2 mt-1">{form.description}</p>
                                                )}

                                                {hasVariants ? (
                                                    /* Variant rows preview */
                                                    <div className="flex flex-col gap-1.5 pt-3">
                                                        {form.variants.filter(v => v.name || v.price).map((v, idx) => {
                                                            const d = parseInt(v.discount) || 0;
                                                            const vPrice = v.price ? Number(v.price) : 0;
                                                            const effPrice = d > 0 && d <= 100 ? Math.round(vPrice * (1 - d / 100)) : vPrice;
                                                            return (
                                                                <div key={idx} className="flex items-center justify-between">
                                                                    <div className="flex items-center gap-1.5">
                                                                        <span className="text-text text-xs font-medium">{v.name || '...'}</span>
                                                                        {d > 0 && d <= 100 && (
                                                                            <span className="text-primary text-[9px] font-bold">-{d}%</span>
                                                                        )}
                                                                    </div>
                                                                    <div className="flex items-center gap-1.5">
                                                                        {d > 0 && d <= 100 && vPrice > 0 && (
                                                                            <span className="text-text-dim text-[10px] line-through">${vPrice.toLocaleString('es-AR')}</span>
                                                                        )}
                                                                        <div className="flex items-baseline gap-0.5">
                                                                            <span className="text-text-dim text-[10px] font-semibold">$</span>
                                                                            <span className="font-display font-bold text-text text-sm leading-none">
                                                                                {effPrice ? effPrice.toLocaleString('es-AR') : '0'}
                                                                            </span>
                                                                        </div>
                                                                        <span className="flex items-center justify-center w-6 h-6 bg-primary text-white rounded-full">
                                                                            <Plus className="w-3 h-3" strokeWidth={2.5} />
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                ) : (
                                                    /* Single price preview */
                                                    <div className="flex items-center justify-between pt-3">
                                                        {parseInt(form.discount) > 0 && parseInt(form.discount) <= 100 && form.price ? (
                                                            <div className="flex flex-col">
                                                                <div className="flex items-baseline gap-1">
                                                                    <span className="text-text-dim text-xs font-semibold">$</span>
                                                                    <span className="font-display font-bold text-primary text-xl leading-none">
                                                                        {Math.round(Number(form.price) * (1 - parseInt(form.discount) / 100)).toLocaleString('es-AR')}
                                                                    </span>
                                                                </div>
                                                                <span className="text-text-dim text-xs line-through mt-0.5">
                                                                    ${Number(form.price).toLocaleString('es-AR')}
                                                                </span>
                                                            </div>
                                                        ) : (
                                                            <div className="flex items-baseline gap-1">
                                                                <span className="text-text-dim text-xs font-semibold">$</span>
                                                                <span className="font-display font-bold text-text text-xl leading-none">
                                                                    {form.price ? Number(form.price).toLocaleString('es-AR') : '0'}
                                                                </span>
                                                            </div>
                                                        )}
                                                        <span className="flex items-center gap-1.5 bg-primary text-white text-[10px] font-semibold uppercase tracking-wider px-3 py-2 rounded-full">
                                                            <Plus className="w-3 h-3" strokeWidth={2.5} />
                                                            Agregar
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Submit buttons */}
                                <div className="flex gap-3 pt-1 pb-4">
                                    <button type="button" onClick={closeModal}
                                        className="cursor-pointer flex-1 py-3 rounded-xl border border-border text-text-muted font-semibold text-sm active:scale-95 transition-all">
                                        Cancelar
                                    </button>
                                    <button type="submit" disabled={formLoading}
                                        className="cursor-pointer flex-1 py-3 rounded-xl bg-primary hover:bg-primary-dark text-white font-bold text-sm uppercase tracking-widest transition-all active:scale-[0.98] disabled:opacity-60 shadow-[0_4px_14px_rgba(217,0,9,0.2)]">
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
