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
    itemId?: string;
    shippingOptions?: Array<{
        shippingCost?: {
            value: string;
        };
    }>;
}

interface EbaySearchResponse {
    itemSummaries?: EbayItem[];
    total?: number;
}

interface PriceStats {
    min: number;
    max: number;
    average: number;
    median: number;
    count: number;
}

export interface PriceResearchResult {
    new: PriceStats;
    refurbished: PriceStats;
    used: PriceStats;
    searchQuery: string;
    recommendedPrice?: number;
    priceRange?: {
        min: number;
        max: number;
    };
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
    const { query, condition, limit = 100 } = params;

    const filter = `conditionIds:{${condition.replace(/,/g, '|')}}`;
    const encodedFilter = encodeURIComponent(filter);

    // Request more fields for better filtering
    const url = `https://api.ebay.com/buy/browse/v1/item_summary/search?q=${encodeURIComponent(query)}&filter=${encodedFilter}&limit=${limit}&fieldgroups=MATCHING_ITEMS,EXTENDED`;

    const response = await fetch(url, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`,
            'X-EBAY-C-MARKETPLACE-ID': 'EBAY_DE',
            'X-EBAY-C-ENDUSERCTX': 'affiliateCampaignId=<ePNCampaignId>'
        }
    });

    console.log('📡 eBay API Response status:', response.status);

    const data = await response.json();

    if (!response.ok) {
        console.error('❌ eBay API error:', response.status, data);
        return { itemSummaries: [], total: 0 };
    }

    return data;
}

/**
 * Advanced outlier detection using multiple methods
 */
function detectOutliers(prices: number[]): { filtered: number[]; removed: number[] } {
    if (prices.length < 4) {
        return { filtered: prices, removed: [] };
    }

    const sorted = [...prices].sort((a, b) => a - b);

    // Method 1: IQR Method (more aggressive for small datasets)
    const q1Index = Math.floor(sorted.length * 0.25);
    const q3Index = Math.floor(sorted.length * 0.75);
    const q1 = sorted[q1Index];
    const q3 = sorted[q3Index];
    const iqr = q3 - q1;

    // Use 1.5 * IQR for standard outlier detection
    const lowerBound = q1 - (1.5 * iqr);
    const upperBound = q3 + (1.5 * iqr);

    // Method 2: Percentile trimming (remove extreme 5% on each end if we have enough data)
    let percentileLower = 0;
    let percentileUpper = Infinity;

    if (sorted.length >= 20) {
        const p5Index = Math.floor(sorted.length * 0.05);
        const p95Index = Math.floor(sorted.length * 0.95);
        percentileLower = sorted[p5Index];
        percentileUpper = sorted[p95Index];
    }

    // Method 3: Z-score for very obvious outliers (3 standard deviations)
    const mean = sorted.reduce((sum, val) => sum + val, 0) / sorted.length;
    const variance = sorted.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / sorted.length;
    const stdDev = Math.sqrt(variance);
    const zScoreLower = mean - (3 * stdDev);
    const zScoreUpper = mean + (3 * stdDev);

    // Combine methods: point must pass ALL checks
    const combinedLower = Math.max(lowerBound, percentileLower, zScoreLower, 0); // Price can't be negative
    const combinedUpper = Math.min(upperBound, percentileUpper, zScoreUpper);

    const filtered = sorted.filter(p => p >= combinedLower && p <= combinedUpper);
    const removed = sorted.filter(p => p < combinedLower || p > combinedUpper);

    console.log(`🔍 Outlier Detection:
    - Original: ${sorted.length} items
    - IQR bounds: €${lowerBound.toFixed(2)} - €${upperBound.toFixed(2)}
    - Final bounds: €${combinedLower.toFixed(2)} - €${combinedUpper.toFixed(2)}
    - Filtered: ${filtered.length} items
    - Removed: ${removed.length} outliers`);

    return { filtered, removed };
}

/**
 * Filter out unreliable listings
 */
function filterReliableListings(items: EbayItem[]): EbayItem[] {
    return items.filter(item => {
        // Must have a valid price
        if (!item.price || !item.price.value) {
            return false;
        }

        const price = parseFloat(item.price.value);

        // Remove suspiciously low prices (likely scams or broken listings)
        if (price < 1) {
            return false;
        }

        // Remove extremely high prices that seem like typos (e.g., €10000 instead of €100)
        // This is a safety check before statistical outlier detection
        if (price > 10000) {
            return false;
        }

        // Filter out obvious spam/invalid titles
        const title = item.title?.toLowerCase() || '';
        const spamKeywords = ['fake', 'replica', 'not original', 'broken', 'defect', 'parts only'];
        return !spamKeywords.some(keyword => title.includes(keyword));


    });
}

/**
 * Calculate comprehensive price statistics with outlier removal
 */
function calculatePriceStats(items: EbayItem[]): PriceStats {
    if (!items || items.length === 0) {
        return {
            min: 0,
            max: 0,
            average: 0,
            median: 0,
            count: 0
        };
    }

    // Filter reliable listings first
    const reliableItems = filterReliableListings(items);

    if (reliableItems.length === 0) {
        return {
            min: 0,
            max: 0,
            average: 0,
            median: 0,
            count: 0
        };
    }

    // Extract prices
    let prices = reliableItems.map(item => parseFloat(item.price.value));

    // Detect and remove outliers
    const { filtered: filteredPrices } = detectOutliers(prices);

    // If we removed too many items, use less aggressive filtering
    if (filteredPrices.length < Math.max(5, prices.length * 0.5) && prices.length >= 10) {
        console.log('⚠️ Outlier removal too aggressive, using 10-90 percentile instead');
        const sorted = [...prices].sort((a, b) => a - b);
        const p10Index = Math.floor(sorted.length * 0.10);
        const p90Index = Math.floor(sorted.length * 0.90);
        prices = sorted.slice(p10Index, p90Index + 1);
    } else {
        prices = filteredPrices;
    }

    if (prices.length === 0) {
        return {
            min: 0,
            max: 0,
            average: 0,
            median: 0,
            count: 0
        };
    }

    // Sort for median calculation
    prices.sort((a, b) => a - b);

    // Calculate statistics
    const min = Math.round(prices[0] * 100) / 100;
    const max = Math.round(prices[prices.length - 1] * 100) / 100;
    const sum = prices.reduce((acc, price) => acc + price, 0);
    const average = Math.round((sum / prices.length) * 100) / 100;

    // Calculate median
    const medianIndex = Math.floor(prices.length / 2);
    const median = prices.length % 2 === 0
        ? Math.round(((prices[medianIndex - 1] + prices[medianIndex]) / 2) * 100) / 100
        : Math.round(prices[medianIndex] * 100) / 100;

    console.log(`📊 Price Stats:
    - Count: ${prices.length}
    - Min: €${min}
    - Max: €${max}
    - Average: €${average}
    - Median: €${median}`);

    return {
        min,
        max,
        average,
        median,
        count: prices.length
    };
}

/**
 * Generate search query variations for better results
 */
function generateSearchQueries(product: ProductAnalysis): string[] {
    const { title } = product.product;

    const queries: string[] = [];

    queries.push(`${title}`.trim());

    return queries;
}

/**
 * Research prices on eBay for a product across different conditions
 */
export async function researchEbayPrices(
    product: ProductAnalysis
): Promise<PriceResearchResult> {
    try {
        const token = await getEbayToken();

        // Generate multiple search query variations
        const searchQueries = generateSearchQueries(product);
        console.log('🔍 Search queries:', searchQueries);

        // Use the primary query
        const searchQuery = searchQueries[0];

        console.log('📦 Searching eBay for:', searchQuery);

        // Search all conditions in parallel with increased limit
        const [newResults, refurbishedResults, usedResults] = await Promise.all([
            searchEbayByCondition(token, {
                query: searchQuery,
                condition: CONDITION_CODES.NEW,
                limit: 100
            }),
            searchEbayByCondition(token, {
                query: searchQuery,
                condition: CONDITION_CODES.REFURBISHED,
                limit: 100
            }),
            searchEbayByCondition(token, {
                query: searchQuery,
                condition: CONDITION_CODES.USED,
                limit: 100
            })
        ]);

        // Log raw counts
        console.log('📈 Raw items found:', {
            new: newResults.itemSummaries?.length || 0,
            refurbished: refurbishedResults.itemSummaries?.length || 0,
            used: usedResults.itemSummaries?.length || 0
        });

        // Calculate statistics with advanced filtering
        const newStats = calculatePriceStats(newResults.itemSummaries || []);
        const refurbishedStats = calculatePriceStats(refurbishedResults.itemSummaries || []);
        const usedStats = calculatePriceStats(usedResults.itemSummaries || []);

        // Calculate recommended price based on condition with most data
        let recommendedPrice: number | undefined;
        let priceRange: { min: number; max: number } | undefined;

        // Prefer conditions with more data points
        const conditionsByPreference = [usedStats, refurbishedStats, newStats]
            .filter(stat => stat.count > 0)
            .sort((a, b) => b.count - a.count);

        if (conditionsByPreference.length > 0) {
            const bestCondition = conditionsByPreference[0];
            // Use median as it's more resistant to outliers than average
            recommendedPrice = bestCondition.median;

            // Provide a price range based on median ± 20%
            priceRange = {
                min: Math.round(recommendedPrice * 0.8 * 100) / 100,
                max: Math.round(recommendedPrice * 1.2 * 100) / 100
            };
        }

        console.log('💰 Final recommendation:', {
            recommendedPrice,
            priceRange,
            basedOnCount: conditionsByPreference[0]?.count
        });

        return {
            new: newStats,
            refurbished: refurbishedStats,
            used: usedStats,
            searchQuery,
            recommendedPrice,
            priceRange
        };
    } catch (error) {
        console.error('Error researching eBay prices:', error);
        throw error;
    }
}