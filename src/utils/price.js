export function getEffectivePrice(product) {
    const d = product.discount || 0;
    if (d <= 0 || d > 100) return product.price;
    return Math.round(product.price * (1 - d / 100));
}

export function hasDiscount(product) {
    return (product.discount || 0) > 0 && product.discount <= 100;
}

export function getEffectiveVariantPrice(variant) {
    const d = variant.discount || 0;
    if (d <= 0 || d > 100) return variant.price;
    return Math.round(variant.price * (1 - d / 100));
}

export function variantHasDiscount(variant) {
    return (variant.discount || 0) > 0 && variant.discount <= 100;
}
