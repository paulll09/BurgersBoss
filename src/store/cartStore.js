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
                            originalPrice: variant ? variant.price : product.price,
                            variantDiscount: variant?.discount || 0,
                            quantity: 1,
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
        { name: 'bulgaria-cart' }
    )
);
