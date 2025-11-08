import {ProductAnalysis} from "@/types/product";


export const generatePriceResearchPrompt = (product: ProductAnalysis) => {
    return `
You are an expert market pricing analyst. Research and provide accurate market prices for the following product based on
current listings and recent sales data from major online marketplaces.

PRODUCT TO RESEARCH:
Title: ${product.product.title}
Manufacturer: ${product.product.manufacturer}
Description: ${product.product.description}

TASK: Analyze pricing across eBay, Facebook Marketplace, Amazon (Used/Renewed), Mercari, OfferUp, and other relevant platforms.

IMPORTANT REQUIREMENTS:
1. Base prices on ACTUAL market data from the last 90 days
2. Consider both active listings AND completed/sold items
3. Provide realistic price ranges that reflect current market conditions
4. All prices must be in EUR
5. Factor in shipping costs typically added to these items (this means remove the shipping costs if applicable)

RETURN EXACTLY THIS INFORMATION:

NEW PRICE (Current retail or last known MSRP):
- Minimum: [lowest retail price found]
- Maximum: [highest retail price found]

REFURBISHED PRICE (Professionally restored with warranty):
- Minimum: [lowest refurbished price]
- Maximum: [highest refurbished price]

USED - GOOD CONDITION (Fully functional, minor cosmetic wear, complete):
- Minimum: [lowest good condition price]
- Maximum: [highest good condition price]
3
- Minimum: [lowest poor condition price]
- Maximum: [highest poor condition price]

MARKET INSIGHTS:
- Best selling platform for this item
- Quick sale price (to sell within 1 week)

Base your analysis on real market data. If exact product matches are limited, use comparable items and adjust accordingly.`;
}