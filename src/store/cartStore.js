import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const EMPTY_FORM = { name: '', address: '', paymentMethod: 'efectivo', notes: '' };

export const useCartStore = create(
    persist(
        (set, get) => ({
            items: [],
            orderType: null,
            checkoutForm: EMPTY_FORM,

            addItem: (product, variant = null) => {
                const cartKey = variant ? `${product.id}_${variant.id}` : product.id;
                set((state) => {
                    const existingItem = state.items.find((item) => (item.cartKey || item.id) === cartKey);
                    if (existingItem) {
                        return {
                            items: state.items.map((item) =>
                                (item.cartKey || item.id) === cartKey ? { ...item, quantity: item.quantity + 1 } : item
                            ),
                        };
                    }
                    return {
                        items: [...state.items, {
                            ...product,
                            product_variants: undefined,
                            cartKey,
                            variantId: variant?.id || null,
                            variantName: variant?.name || null,
                            price: variant ? variant.price : product.price,
                            originalPrice: variant ? (variant.originalPrice ?? variant.price) : product.price,
                            variantDiscount: variant?.discount || 0,
                            quantity: 1,
                        }],
                    };
                });
            },

            /* Agrega burger + extras como un único ítem agrupado */
            addBurger: (product, variant, extras = []) => {
                const sorted    = [...extras].sort((a, b) => a.id.localeCompare(b.id));
                const extrasKey = sorted.map(e => e.id).join('_');
                const cartKey   = [product.id, variant?.id, extrasKey].filter(Boolean).join('_');

                const burgerPrice = Number(variant?.price ?? product.price ?? 0);
                const extrasTotal = sorted.reduce((s, e) => s + Number(e.price), 0);

                set((state) => {
                    const existing = state.items.find(i => i.cartKey === cartKey);
                    if (existing) {
                        return { items: state.items.map(i => i.cartKey === cartKey ? { ...i, quantity: i.quantity + 1 } : i) };
                    }
                    return {
                        items: [...state.items, {
                            cartKey,
                            id:            product.id,
                            name:          product.name,
                            image_url:     product.image_url || null,
                            type:          'burger',
                            category_name: product.category_name || 'Hamburguesas',
                            variantId:     variant?.id   || null,
                            variantName:   variant?.name || null,
                            extras:        sorted.map(e => ({ id: e.id, name: e.name, price: Number(e.price) })),
                            price:         burgerPrice + extrasTotal,
                            quantity:      1,
                        }],
                    };
                });
            },
            removeItem: (cartKey) => {
                set((state) => ({
                    items: state.items.filter((item) => (item.cartKey || item.id) !== cartKey),
                }));
            },
            updateQuantity: (cartKey, quantity) => {
                set((state) => ({
                    items: state.items.map((item) =>
                        (item.cartKey || item.id) === cartKey ? { ...item, quantity: Math.max(0, quantity) } : item
                    ).filter(item => item.quantity > 0),
                }));
            },
            clearCart: () => set({ items: [], orderType: null, checkoutForm: EMPTY_FORM }),
            setOrderType: (orderType) => set({ orderType }),
            setCheckoutForm: (updates) => set((state) => ({ checkoutForm: { ...state.checkoutForm, ...updates } })),
            getTotalItems: () => get().items.reduce((total, item) => total + item.quantity, 0),
            getTotalPrice: () => get().items.reduce((total, item) => total + (item.price * item.quantity), 0),
        }),
        { name: 'burgersboss-cart' }
    )
);
