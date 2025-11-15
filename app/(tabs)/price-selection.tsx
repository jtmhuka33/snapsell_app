import { View, Text, TouchableOpacity, ScrollView, Alert } from "react-native";
import { useState } from "react";
import { router, useLocalSearchParams } from "expo-router";
import { PriceResearchResult } from "@/helpers/ebayPriceResearcher";
import { ProductAnalysis } from "@/types/product";

type ConditionType = 'new' | 'refurbished' | 'used';

export default function PriceSelection() {
    const params = useLocalSearchParams();
    const analysisResult: ProductAnalysis = JSON.parse(params.analysisResult as string);
    const priceResults: PriceResearchResult = JSON.parse(params.priceResults as string);

    const [selectedCondition, setSelectedCondition] = useState<ConditionType | null>(null);

    const handleBack = () => {
        if (router.canGoBack()) {
            router.back();
        }
    };

    const handleSelectCondition = (condition: ConditionType) => {
        setSelectedCondition(condition);
    };

    const handleContinue = () => {
        if (!selectedCondition) {
            Alert.alert("No Selection", "Please select a condition to continue.");
            return;
        }

        const selectedPrice = priceResults[selectedCondition];

        if (selectedPrice.count === 0) {
            Alert.alert(
                "No Data Available",
                `We couldn't find any ${selectedCondition} listings for this item. Please select a different condition.`
            );
            return;
        }

        // Navigate to create listing with selected price data
        router.push({
            pathname: '/(tabs)/create-listing',
            params: {
                analysisResult: JSON.stringify(analysisResult),
                selectedCondition,
                selectedPrice: JSON.stringify(selectedPrice),
                recommendedPrice: priceResults.recommendedPrice?.toString() || '',
                priceRange: JSON.stringify(priceResults.priceRange || {})
            }
        });
    };

    const renderConditionCard = (
        condition: ConditionType,
        title: string,
        description: string,
        emoji: string
    ) => {
        const priceData = priceResults[condition];
        const isSelected = selectedCondition === condition;
        const hasData = priceData.count > 0;

        return (
            <TouchableOpacity
                onPress={() => hasData && handleSelectCondition(condition)}
                disabled={!hasData}
                className={`mb-4 rounded-2xl p-6 border-2 ${
                    isSelected
                        ? 'bg-blue-50 border-blue-500'
                        : hasData
                            ? 'bg-white border-gray-200'
                            : 'bg-gray-100 border-gray-300 opacity-50'
                }`}
            >
                <View className="flex-row items-center justify-between mb-3">
                    <View className="flex-row items-center gap-3">
                        <Text className="text-4xl">{emoji}</Text>
                        <View>
                            <Text className={`text-xl font-bold ${isSelected ? 'text-blue-700' : 'text-gray-800'}`}>
                                {title}
                            </Text>
                            <Text className="text-sm text-gray-500">{description}</Text>
                        </View>
                    </View>
                    {isSelected && (
                        <View className="w-6 h-6 rounded-full bg-blue-500 items-center justify-center">
                            <Text className="text-white text-xs">✓</Text>
                        </View>
                    )}
                </View>

                {hasData ? (
                    <>
                        <View className="mt-4 pt-4 border-t border-gray-200">
                            {/* Median Price (Most Important) */}
                            <View className="flex-row justify-between items-center mb-3 bg-green-50 p-3 rounded-lg">
                                <Text className="text-gray-700 font-semibold">Median Price:</Text>
                                <Text className="text-xl font-bold text-green-600">
                                    €{priceData.median}
                                </Text>
                            </View>

                            {/* Price Range */}
                            <View className="flex-row justify-between items-center mb-2">
                                <Text className="text-gray-600">Price Range:</Text>
                                <Text className="text-base font-semibold text-gray-800">
                                    €{priceData.min} - €{priceData.max}
                                </Text>
                            </View>

                            {/* Average Price */}
                            <View className="flex-row justify-between items-center mb-2">
                                <Text className="text-gray-600">Average Price:</Text>
                                <Text className="text-base font-semibold text-gray-700">
                                    €{priceData.average}
                                </Text>
                            </View>

                            {/* Data Source Info */}
                            <View className="flex-row justify-between items-center">
                                <Text className="text-gray-600">Based on:</Text>
                                <Text className="text-sm text-gray-500">
                                    {priceData.count} verified listing{priceData.count !== 1 ? 's' : ''}
                                </Text>
                            </View>
                        </View>

                        {isSelected && (
                            <View className="mt-4 bg-blue-100 rounded-lg p-3">
                                <Text className="text-blue-700 text-sm text-center font-medium">
                                    💡 Suggested listing price: €{priceData.median}
                                </Text>
                                <Text className="text-blue-600 text-xs text-center mt-1">
                                    (Median is more reliable than average)
                                </Text>
                            </View>
                        )}
                    </>
                ) : (
                    <View className="mt-4 pt-4 border-t border-gray-200">
                        <Text className="text-gray-500 text-center text-sm">
                            No {condition} listings found for this item
                        </Text>
                    </View>
                )}
            </TouchableOpacity>
        );
    };

    return (
        <View className="flex-1 bg-gray-50">
            <ScrollView className="flex-1">
                {/* Header with Back Button */}
                <View className="bg-white p-6 border-b border-gray-200">
                    <View className="flex-row items-center mb-2">
                        <TouchableOpacity
                            onPress={handleBack}
                            className="mr-3 p-2 -ml-2"
                        >
                            <Text className="text-2xl">←</Text>
                        </TouchableOpacity>
                        <Text className="text-2xl font-bold text-gray-800 flex-1">
                            Select Condition
                        </Text>
                    </View>
                    <Text className="text-gray-600 mb-4 ml-12">
                        Choose the condition that best matches your item
                    </Text>
                    <View className="bg-blue-50 rounded-lg p-3 ml-12">
                        <Text className="text-sm text-blue-800 font-medium">
                            📦 {analysisResult.product.manufacturer} {analysisResult.product.title}
                        </Text>
                    </View>
                </View>

                {/* Info Banner */}
                <View className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mx-6 mt-4">
                    <Text className="text-yellow-800 text-xs font-semibold mb-1">
                        💡 How prices are calculated:
                    </Text>
                    <Text className="text-yellow-700 text-xs">
                        • Median price is the middle value - most reliable{'\n'}
                        • Outliers (extreme prices) are automatically removed{'\n'}
                        • More listings = more reliable pricing data
                    </Text>
                </View>

                {/* Condition Cards */}
                <View className="p-6">
                    {renderConditionCard(
                        'new',
                        'New',
                        'Brand new, never used',
                        '✨'
                    )}
                    {renderConditionCard(
                        'refurbished',
                        'Refurbished',
                        'Professionally restored',
                        '🔧'
                    )}
                    {renderConditionCard(
                        'used',
                        'Used',
                        'Previously owned',
                        '📦'
                    )}
                </View>

                {/* Search Info */}
                <View className="px-6 pb-6">
                    <View className="bg-gray-100 rounded-lg p-4">
                        <Text className="text-xs text-gray-600 text-center">
                            Prices from active eBay listings in Germany
                        </Text>
                        <Text className="text-xs text-gray-500 text-center mt-1">
                            Search: {priceResults.searchQuery}
                        </Text>
                    </View>
                </View>
            </ScrollView>

            {/* Continue Button */}
            <View className="bg-white border-t border-gray-200 p-6">
                <TouchableOpacity
                    onPress={handleContinue}
                    disabled={!selectedCondition}
                    className={`py-4 rounded-xl ${
                        selectedCondition ? 'bg-blue-500' : 'bg-gray-300'
                    }`}
                >
                    <Text className="text-white text-center text-lg font-bold">
                        {selectedCondition ? 'Continue with Selected Condition' : 'Select a Condition'}
                    </Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}