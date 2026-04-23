import { createContext, useContext } from 'react';

export const DEFAULT_FEATURES = {
    products:     true,
    categories:   true,
    hours:        true,
    qr:           true,
    promotions:   true,
    reservations: false,
};

export const FeaturesCtx = createContext(DEFAULT_FEATURES);
export const useFeatures  = () => useContext(FeaturesCtx);
