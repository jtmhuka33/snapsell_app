import {GoogleGenAI, Type} from "@google/genai";
import {File} from 'expo-file-system'
import {ProductAnalysis} from "@/types/product";

export const imageAnalyzer = async (imageUris: string | string[]): Promise<ProductAnalysis> => {
    try {
        const ai = new GoogleGenAI({apiKey: process.env.EXPO_PUBLIC_GOOGLE_API_KEY});
        const uris = Array.isArray(imageUris) ? imageUris : [imageUris];

        const promptText = uris.length > 1
            ? `Analyze ALL ${uris.length} images together. These show the SAME item from different angles. Provide ONE comprehensive assessment.\n\n`
            : 'Analyze this image.\n\n';

        const fullPrompt = promptText +
            '1. OBJECT IDENTIFICATION\n' +
            '   - What is this item? (Be as specific as possible with brand, model, and product name)\n' +
            '   - Category (furniture, electronics, appliance, etc.)\n' +
            '\n' +
            '2. CONDITION ASSESSMENT\n' +
            '   - Overall condition rating (Excellent/Good/Fair/Poor)\n' +
            '   - Visible damage: List any scratches, dents, stains, discoloration, missing parts, or wear\n' +
            '   - Functional concerns: Any visible issues that might affect usability\n' +
            '\n' +
            '3. ORIGINAL MANUFACTURER/RETAILER\n' +
            '   - Brand name and manufacturer\n' +
            '   - Original retailer (IKEA, MediaMarkt, Cherry, Amazon, etc.)\n' +
            '   - Product line or collection name (if identifiable)\n' +
            '   - Approximate original retail price (if known)\n' +
            '\n' +
            '4. ADDITIONAL NOTES\n' +
            '   - Approximate age or production year (if identifiable from design/features)\n' +
            '   - Any identifying marks, labels, or serial numbers visible\n' +
            '   - Comparability to similar items currently on the market\n' +
            '\n' +
            'Only describe the object, not surroundings. Fill out all JSON fields. ' +
            'Description is for second hand sale on eBay. ' +
            'Return ONE product analysis combining all images.';

        const contents = [];

        for (const uri of uris) {
            const file = new File(uri);
            const base64Image = await file.base64();
            contents.push({
                inlineData: {
                    mimeType: 'image/jpeg',
                    data: base64Image
                }
            });
        }

        contents.push({text: fullPrompt});

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: contents,
            config: {
                responseMimeType: 'application/json',
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        product: {
                            type: Type.OBJECT,
                            properties: {
                                title: {type: Type.STRING},
                                manufacturer: {type: Type.STRING},
                                description: {type: Type.STRING},
                            }
                        }
                    }
                }
            }
        });

        return JSON.parse(response.text || '{}');

    } catch (error) {
        console.error('[imageAnalyzer]', error);
        throw error;
    }
}