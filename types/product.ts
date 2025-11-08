export interface ProductAnalysis {
    product: {
        title: string;
        manufacturer: string;
        description: string;
    }
}

export interface PriceResearch {
    new: {
        min: number
        max: number
    }
    refurbished: {
        min: number
        max: number
    }
    usedGood: {
        min: number
        max: number
    }
    usedPoor: {
        min: number
        max: number
    }
}