import { ProductAnalysis } from "@/types/product";

interface ListingParams {
    product: ProductAnalysis;
    price: number;
    condition: 'new' | 'refurbished' | 'used' | 'custom';
    quantity?: number;
}

interface EbayListingResponse {
    success: boolean;
    listingId?: string;
    offerId?: string;
    error?: string;
    errorDetails?: any;
}

/**
 * Get OAuth user token for eBay API
 * Note: This requires the user to have authenticated via OAuth flow
 * For now, this will use client credentials, but full implementation requires user OAuth
 */
async function getEbayUserToken(): Promise<string> {
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
        body: 'grant_type=client_credentials&scope=https://api.ebay.com/oauth/api_scope https://api.ebay.com/oauth/api_scope/sell.inventory'
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Failed to get eBay token: ${response.statusText} - ${JSON.stringify(errorData)}`);
    }

    const data = await response.json();
    return data.access_token;
}

/**
 * Map condition to eBay condition ID
 */
function mapConditionToEbayId(condition: string): string {
    const conditionMap: { [key: string]: string } = {
        'new': '1000', // Brand New
        'refurbished': '2000', // Manufacturer Refurbished
        'used': '3000', // Used
        'custom': '3000' // Default to Used for custom
    };
    return conditionMap[condition] || '3000';
}

/**
 * Create an inventory item on eBay
 */
async function createInventoryItem(
    token: string,
    sku: string,
    product: ProductAnalysis,
    condition: string
): Promise<void> {
    const inventoryItem = {
        availability: {
            shipToLocationAvailability: {
                quantity: 1
            }
        },
        condition: mapConditionToEbayId(condition),
        product: {
            title: product.product.title,
            description: product.product.description,
            aspects: {
                Brand: [product.product.manufacturer]
            }
        }
    };

    const response = await fetch(
        `https://api.ebay.com/sell/inventory/v1/inventory_item/${sku}`,
        {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
                'Content-Language': 'de-DE'
            },
            body: JSON.stringify(inventoryItem)
        }
    );

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Failed to create inventory item: ${JSON.stringify(errorData)}`);
    }
}

/**
 * Create an offer for the inventory item
 */
async function createOffer(
    token: string,
    sku: string,
    price: number
): Promise<string> {
    // Note: This requires business policies to be set up
    // In a real implementation, you would need to:
    // 1. Create or retrieve fulfillment policy ID
    // 2. Create or retrieve payment policy ID
    // 3. Create or retrieve return policy ID

    const offer = {
        sku: sku,
        marketplaceId: 'EBAY_DE',
        format: 'FIXED_PRICE',
        availableQuantity: 1,
        categoryId: '99', // Placeholder - would need to determine correct category
        listingDescription: 'Item listed via SnapSell app',
        listingPolicies: {
            // These would need to be actual policy IDs from the user's account
            fulfillmentPolicyId: 'FULFILLMENT_POLICY_ID',
            paymentPolicyId: 'PAYMENT_POLICY_ID',
            returnPolicyId: 'RETURN_POLICY_ID'
        },
        pricingSummary: {
            price: {
                currency: 'EUR',
                value: price.toString()
            }
        }
    };

    const response = await fetch(
        'https://api.ebay.com/sell/inventory/v1/offer',
        {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
                'Content-Language': 'de-DE'
            },
            body: JSON.stringify(offer)
        }
    );

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Failed to create offer: ${JSON.stringify(errorData)}`);
    }

    const data = await response.json();
    return data.offerId;
}

/**
 * Publish an offer to create a live listing
 */
async function publishOffer(token: string, offerId: string): Promise<string> {
    const response = await fetch(
        `https://api.ebay.com/sell/inventory/v1/offer/${offerId}/publish`,
        {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        }
    );

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Failed to publish offer: ${JSON.stringify(errorData)}`);
    }

    const data = await response.json();
    return data.listingId;
}

/**
 * Create a listing on eBay
 * Full flow: Create inventory item -> Create offer -> Publish offer
 */
export async function createEbayListing(params: ListingParams): Promise<EbayListingResponse> {
    try {
        console.log('🚀 Starting eBay listing creation...');

        // Generate unique SKU
        const sku = `SNAPSELL-${Date.now()}`;

        console.log('📝 Step 1: Getting OAuth token...');
        const token = await getEbayUserToken();

        console.log('📦 Step 2: Creating inventory item...');
        await createInventoryItem(token, sku, params.product, params.condition);

        console.log('💰 Step 3: Creating offer...');
        const offerId = await createOffer(token, sku, params.price);

        console.log('🎉 Step 4: Publishing offer...');
        const listingId = await publishOffer(token, offerId);

        console.log('✅ Listing created successfully!', { listingId, offerId });

        return {
            success: true,
            listingId,
            offerId
        };

    } catch (error) {
        console.error('❌ Error creating eBay listing:', error);

        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error occurred',
            errorDetails: error
        };
    }
}

/**
 * Get eBay listing URL from listing ID
 */
export function getEbayListingUrl(listingId: string): string {
    return `https://www.ebay.de/itm/${listingId}`;
}