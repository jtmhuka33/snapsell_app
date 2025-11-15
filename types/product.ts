export interface ProductAnalysis {
    product: {
        title: string;
        manufacturer: string;
        description: string;
    }
}

export interface PriceStats {
    min: number;
    max: number;
    average: number;
    median: number;
    count: number;
}

export interface PriceResearch {
    new: PriceStats;
    refurbished: PriceStats;
    usedGood: PriceStats;
    usedPoor: PriceStats;
}