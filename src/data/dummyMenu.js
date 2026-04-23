export const dummyCategories = [
    { id: '1', name: 'Hamburguesas & Lomitos', menu_section: 'burger',  display_order: 1 },
    { id: '2', name: 'Papas & Extras',         menu_section: 'side',    display_order: 2 },
    { id: '3', name: 'Bebidas',                menu_section: 'other',   display_order: 3 },
];

export const dummyProducts = [
    {
        id: 'p1',
        name: 'Doble Burger',
        description: 'Doble carne, doble queso, una locura de sabor.',
        price: 8500,
        image_url: '/images/hamburguesaDoble1.jpg',
        category_id: '1',
        product_variants: [],
        discount: 20,
    },
    {
        id: 'p2',
        name: 'Burger Crazy Cheddar',
        description: 'Bañada en cheddar, con papas incluidas.',
        price: 9500,
        image_url: '/images/hamburguesCrazyDoble.jpg',
        category_id: '1',
        product_variants: [],
    },
    {
        id: 'p5',
        name: 'Sándwich Especial',
        description: 'Pechuga, jamón, queso, lechuga y tomate.',
        price: 7500,
        image_url: '/images/hamburguesaDoble1.jpg',
        category_id: '1',
        product_variants: [],
    },
    {
        id: 'p6',
        name: 'Lomito Tradicional',
        description: 'Lomito completo con papas fritas.',
        price: 11000,
        image_url: '/images/hamburguesCrazyDoble.jpg',
        category_id: '1',
        product_variants: [],
    },
    {
        id: 'p7',
        name: 'Papas con Cheddar',
        description: 'Porción abundante de papas fritas con cheddar fundido y verdeo.',
        price: 4500,
        image_url: '/images/hamburguesaDoble1.jpg',
        category_id: '2',
        product_variants: [
            { id: 'v1', product_id: 'p7', name: 'Chica', price: 4500, discount: 15, display_order: 0 },
            { id: 'v2', product_id: 'p7', name: 'Grande', price: 6500, discount: 0, display_order: 1 },
        ],
    },
    {
        id: 'p4',
        name: 'Coca Cola',
        description: 'Gaseosa línea Coca Cola.',
        price: 2500,
        image_url: '/images/hamburguesCrazyDoble.jpg',
        category_id: '3',
        product_variants: [
            { id: 'v3', product_id: 'p4', name: '500ml', price: 2500, discount: 0, display_order: 0 },
            { id: 'v4', product_id: 'p4', name: '1.5L', price: 4000, discount: 0, display_order: 1 },
        ],
    },
];
