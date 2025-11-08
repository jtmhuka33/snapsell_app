import { ProductAnalysis } from "@/types/product";

export const CONDITION_CODES = {
    NEW: '1000|1500',
    REFURBISHED: '2000|2010|2020|2030',
    USED: '3000|4000|5000|6000|7000'
};

interface EbaySearchParams {
    query: string;
    condition: string;
    limit?: number;
}

interface EbayItem {
    price: {
        value: string;
        currency: string;
    };
    title: string;
    condition: string;
}

interface EbaySearchResponse {
    itemSummaries?: EbayItem[];
    total?: number;
}

interface PriceStats {
    min: number;
    max: number;
    average: number;
    count: number;
}

export interface PriceResearchResult {
    new: PriceStats;
    refurbished: PriceStats;
    used: PriceStats;
    searchQuery: string;
}

/**
 * Get OAuth application token for eBay API
 */
async function getEbayToken(): Promise<string> {
    const appId = process.env.EXPO_PUBLIC_EBAY_APP_ID;
    const certId = process.env.EXPO_PUBLIC_EBAY_CERT_ID;

    if (!appId || !certId) {
        throw new Error('eBay API credentials not configured');
    }

    const credentials = btoa(`${appId}:${certId}`);

    const response = await fetch('https://api.ebay.com/identity/v1/oauth2/token', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': `Basic ${credentials}`
        },
        body: 'grant_type=client_credentials&scope=https://api.ebay.com/oauth/api_scope'
    });

    if (!response.ok) {
        throw new Error(`Failed to get eBay token: ${response.statusText}`);
    }

    const data = await response.json();
    return data.access_token;
}

/**
 * Search eBay Browse API for items with specific condition
 */
async function searchEbayByCondition(
    token: string,
    params: EbaySearchParams
): Promise<EbaySearchResponse> {
    const { query, condition, limit = 50 } = params;

    const filter = `conditionIds:{${condition.replace(/,/g, '|')}}`;
    const encodedFilter = encodeURIComponent(filter);

    const url = `https://api.ebay.com/buy/browse/v1/item_summary/search?q=${encodeURIComponent(query)}&filter=${encodedFilter}&limit=${limit}&fieldgroups=MATCHING_ITEMS`;

    const response = await fetch(url, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`,
            'X-EBAY-C-MARKETPLACE-ID': 'EBAY_DE',
            'X-EBAY-C-ENDUSERCTX': 'affiliateCampaignId=<ePNCampaignId>'
        }
    });

    console.log('📡 Response status:', response.status);

    const data = await response.json();
    console.log('📦 Response data:', JSON.stringify(data, null, 2));

    if (!response.ok) {
        console.error('❌ eBay API error:', response.status, data);
        return { itemSummaries: [], total: 0 };
    }

    return data;
}

/**
 * Calculate price statistics from eBay items
 */
function calculatePriceStats(items: EbayItem[]): PriceStats {
    if (!items || items.length === 0) {
        return { min: 0, max: 0, average: 0, count: 0 };
    }

    let prices = items
        .filter(item => item.price && item.price.value)
        .map(item => parseFloat(item.price.value))
        .sort((a, b) => a - b);

    if (prices.length === 0) {
        return { min: 0, max: 0, average: 0, count: 0 };
    }

    // Only remove outliers if we have enough data (10+ items)
    if (prices.length >= 10) {
        const q1 = prices[Math.floor(prices.length * 0.25)];
        const q3 = prices[Math.floor(prices.length * 0.75)];
        const iqr = q3 - q1;
        const lowerBound = q1 - (1.5 * iqr);
        const upperBound = q3 + (1.5 * iqr);

        const filteredPrices = prices.filter(p => p >= lowerBound && p <= upperBound);

        // Only use filtered prices if we still have at least 5 items
        if (filteredPrices.length >= 5) {
            prices = filteredPrices;
        }
    }

    const min = Math.min(...prices);
    const max = Math.max(...prices);
    const average = prices.reduce((sum, price) => sum + price, 0) / prices.length;

    return {
        min: Math.round(min * 100) / 100,
        max: Math.round(max * 100) / 100,
        average: Math.round(average * 100) / 100,
        count: prices.length
    };
}

/**
 * Research prices on eBay for a product across different conditions
 */
export async function researchEbayPrices(
    product: ProductAnalysis
): Promise<PriceResearchResult> {
    try {
        const token = await getEbayToken();

        const searchQuery = `${product.product.title}`.trim();

        console.log('Searching eBay for:', searchQuery);

        const [newResults, refurbishedResults, usedResults] = await Promise.all([
            searchEbayByCondition(token, {
                query: searchQuery,
                condition: CONDITION_CODES.NEW,
                limit: 50
            }),
            searchEbayByCondition(token, {
                query: searchQuery,
                condition: CONDITION_CODES.REFURBISHED,
                limit: 50
            }),
            searchEbayByCondition(token, {
                query: searchQuery,
                condition: CONDITION_CODES.USED,
                limit: 50
            })
        ]);

        // Log actual item counts
        console.log('Items found:', {
            new: newResults.itemSummaries?.length || 0,
            refurbished: refurbishedResults.itemSummaries?.length || 0,
            used: usedResults.itemSummaries?.length || 0
        });

        const newStats = calculatePriceStats(newResults.itemSummaries || []);
        const refurbishedStats = calculatePriceStats(refurbishedResults.itemSummaries || []);
        const usedStats = calculatePriceStats(usedResults.itemSummaries || []);

        return {
            new: newStats,
            refurbished: refurbishedStats,
            used: usedStats,
            searchQuery
        };
    } catch (error) {
        console.error('Error researching eBay prices:', error);
        throw error;
    }
}