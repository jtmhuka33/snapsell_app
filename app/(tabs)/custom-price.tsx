import { View, Text, TouchableOpacity, TextInput, Alert, ScrollView, Keyboard } from "react-native";
import { useState } from "react";
import { router, useLocalSearchParams } from "expo-router";
import { PriceResearchResult } from "@/helpers/ebayPriceResearcher";
import { ProductAnalysis } from "@/types/product";

export default function CustomPrice() {
    const params = useLocalSearchParams();
    const analysisResult: ProductAnalysis = JSON.parse(params.analysisResult as string);
    const priceResults: PriceResearchResult = JSON.parse(params.priceResults as string);

    const [customPrice, setCustomPrice] = useState<string>('');
    const [errorMessage, setErrorMessage] = useState<string>('');

    const handleBack = () => {
        if (router.canGoBack()) {
            router.back();
        }
    };

    const validatePrice = (price: string): boolean => {
        // Remove any non-numeric characters except decimal point
        const numericPrice = price.replace(/[^\d.]/g, '');
        const priceNumber = parseFloat(numericPrice);

        if (isNaN(priceNumber)) {
            setErrorMessage('Please enter a valid price');
            return false;
        }

        if (priceNumber <= 0) {
            setErrorMessage('Price must be greater than 0');
            return false;
        }

        if (priceNumber > 1000000) {
            setErrorMessage('Price seems too high. Please check.');
            return false;
        }

        setErrorMessage('');
        return true;
    };

    const handlePriceChange = (text: string) => {
        // Allow only numbers and one decimal point
        const filtered = text.replace(/[^\d.]/g, '');

        // Ensure only one decimal point
        const parts = filtered.split('.');
        if (parts.length > 2) {
            return;
        }

        setCustomPrice(filtered);

        // Clear error when user starts typing
        if (errorMessage) {
            setErrorMessage('');
        }
    };

    const handleContinue = () => {
        if (!customPrice.trim()) {
            Alert.alert("No Price Entered", "Please enter a price to continue.");
            return;
        }

        if (!validatePrice(customPrice)) {
            return;
        }

        const priceValue = parseFloat(customPrice);

        // Create a custom price stats object
        const customPriceData = {
            min: priceValue,
            max: priceValue,
            average: priceValue,
            median: priceValue,
            count: 1
        };

        Keyboard.dismiss();

        // Navigate to create listing with custom price
        router.push({
            pathname: '/(tabs)/create-listing',
            params: {
                analysisResult: JSON.stringify(analysisResult),
                selectedCondition: 'custom',
                selectedPrice: JSON.stringify(customPriceData),
                recommendedPrice: priceValue.toString(),
                priceRange: JSON.stringify({ min: priceValue, max: priceValue })
            }
        });
    };

    // Get market data for reference
    const getMarketReference = () => {
        const conditions = ['used', 'refurbished', 'new'] as const;
        const validConditions = conditions.filter(c => priceResults[c].count > 0);

        if (validConditions.length === 0) {
            return null;
        }

        return validConditions.map(condition => ({
            name: condition.charAt(0).toUpperCase() + condition.slice(1),
            median: priceResults[condition].median,
            emoji: condition === 'new' ? '✨' : condition === 'refurbished' ? '🔧' : '📦'
        }));
    };

    const marketReference = getMarketReference();

    return (
        <View className="flex-1 bg-gray-50 dark:bg-black">
            <ScrollView className="flex-1" keyboardShouldPersistTaps="handled">
                {/* Header with Back Button */}
                <View className="bg-white dark:bg-gray-900 p-6 border-b border-gray-200 dark:border-gray-800">
                    <View className="flex-row items-center mb-2">
                        <TouchableOpacity
                            onPress={handleBack}
                            className="mr-3 p-2 -ml-2"
                        >
                            <Text className="text-2xl dark:text-white">←</Text>
                        </TouchableOpacity>
                        <Text className="text-2xl font-bold text-gray-800 dark:text-white flex-1">
                            Set Custom Price
                        </Text>
                    </View>
                    <Text className="text-gray-600 dark:text-gray-400 mb-4 ml-12">
                        Enter your desired listing price
                    </Text>
                    <View className="bg-blue-50 dark:bg-blue-900/30 rounded-lg p-3 ml-12">
                        <Text className="text-sm text-blue-800 dark:text-blue-300 font-medium">
                            📦 {analysisResult.product.title}
                        </Text>
                    </View>
                </View>

                {/* Price Input Section */}
                <View className="p-6">
                    <View className="bg-white dark:bg-gray-900 rounded-2xl p-6 border-2 border-gray-200 dark:border-gray-800 mb-4">
                        <Text className="text-lg font-bold text-gray-800 dark:text-white mb-4">
                            Enter Price (EUR)
                        </Text>

                        <View className="flex-row items-center bg-gray-50 dark:bg-gray-800 rounded-xl border-2 border-gray-200 dark:border-gray-700 px-4">
                            <Text className="text-3xl font-bold text-gray-700 dark:text-gray-300 mr-2">€</Text>
                            <TextInput
                                value={customPrice}
                                onChangeText={handlePriceChange}
                                placeholder="0.00"
                                placeholderTextColor="#9CA3AF"
                                keyboardType="decimal-pad"
                                className="flex-1 text-3xl font-bold text-gray-900 dark:text-white py-4"
                                autoFocus
                            />
                        </View>

                        {errorMessage ? (
                            <View className="mt-3 bg-red-50 dark:bg-red-900/30 rounded-lg p-3">
                                <Text className="text-red-600 dark:text-red-400 text-sm">
                                    ⚠️ {errorMessage}
                                </Text>
                            </View>
                        ) : null}
                    </View>

                    {/* Market Reference - only show if we have data */}
                    {marketReference && marketReference.length > 0 && (
                        <View className="bg-white dark:bg-gray-900 rounded-2xl p-6 border-2 border-gray-200 dark:border-gray-800">
                            <Text className="text-base font-bold text-gray-800 dark:text-white mb-4">
                                📊 Market Reference
                            </Text>
                            <Text className="text-xs text-gray-600 dark:text-gray-400 mb-3">
                                Similar items on eBay:
                            </Text>

                            {marketReference.map((ref, index) => (
                                <View
                                    key={index}
                                    className="flex-row justify-between items-center py-3 border-b border-gray-100 dark:border-gray-800 last:border-b-0"
                                >
                                    <View className="flex-row items-center gap-2">
                                        <Text className="text-xl">{ref.emoji}</Text>
                                        <Text className="text-sm text-gray-700 dark:text-gray-300 font-medium">
                                            {ref.name}
                                        </Text>
                                    </View>
                                    <Text className="text-base font-bold text-green-600 dark:text-green-400">
                                        €{ref.median}
                                    </Text>
                                </View>
                            ))}

                            <View className="mt-4 bg-yellow-50 dark:bg-yellow-900/30 rounded-lg p-3">
                                <Text className="text-yellow-700 dark:text-yellow-300 text-xs text-center">
                                    💡 These are median market prices for reference
                                </Text>
                            </View>
                        </View>
                    )}

                    {/* Pricing Tips */}
                    <View className="mt-4 bg-blue-50 dark:bg-blue-900/30 rounded-2xl p-5 border-l-4 border-blue-400 dark:border-blue-600">
                        <Text className="text-blue-800 dark:text-blue-300 font-semibold mb-2 text-sm">
                            💡 Pricing Tips:
                        </Text>
                        <Text className="text-blue-700 dark:text-blue-400 text-xs mb-1">
                            • Price competitively to attract buyers
                        </Text>
                        <Text className="text-blue-700 dark:text-blue-400 text-xs mb-1">
                            • Consider item condition & features
                        </Text>
                        <Text className="text-blue-700 dark:text-blue-400 text-xs mb-1">
                            • Include room for negotiation
                        </Text>
                        <Text className="text-blue-700 dark:text-blue-400 text-xs">
                            • Factor in listing & shipping fees
                        </Text>
                    </View>
                </View>
            </ScrollView>

            {/* Continue Button */}
            <View className="bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 p-6">
                <TouchableOpacity
                    onPress={handleContinue}
                    disabled={!customPrice.trim()}
                    className={`py-4 rounded-xl ${
                        customPrice.trim() ? 'bg-blue-500 dark:bg-blue-600' : 'bg-gray-300 dark:bg-gray-700'
                    }`}
                >
                    <Text className="text-white text-center text-lg font-bold">
                        {customPrice.trim()
                            ? `Continue with €${customPrice}`
                            : 'Enter a Price to Continue'}
                    </Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}