import { View, Text, TouchableOpacity, ScrollView } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { PriceResearchResult } from "@/helpers/ebayPriceResearcher";
import { ProductAnalysis } from "@/types/product";

type ConditionType = 'new' | 'refurbished' | 'used' | 'custom';

export default function PriceSelection() {
    const params = useLocalSearchParams();
    const analysisResult: ProductAnalysis = JSON.parse(params.analysisResult as string);
    const priceResults: PriceResearchResult = JSON.parse(params.priceResults as string);

    const handleBack = () => {
        if (router.canGoBack()) {
            router.back();
        }
    };

    const handleSelectCondition = (condition: ConditionType) => {

        if (condition === 'custom') {
            // Navigate to custom price page
            router.push({
                pathname: '/(tabs)/custom-price',
                params: {
                    analysisResult: JSON.stringify(analysisResult),
                    priceResults: JSON.stringify(priceResults)
                }
            });
        } else {
            // Navigate to create listing with selected price data
            const selectedPrice = priceResults[condition];

            router.push({
                pathname: '/(tabs)/create-listing',
                params: {
                    analysisResult: JSON.stringify(analysisResult),
                    selectedCondition: condition,
                    selectedPrice: JSON.stringify(selectedPrice),
                    recommendedPrice: priceResults.recommendedPrice?.toString() || '',
                    priceRange: JSON.stringify(priceResults.priceRange || {})
                }
            });
        }
    };

    const renderGridCard = (
        condition: ConditionType,
        title: string,
        emoji: string,
        description: string
    ) => {
        const isCustom = condition === 'custom';
        const priceData = !isCustom ? priceResults[condition] : null;
        const hasData = isCustom || (priceData && priceData.count > 0);

        return (
            <TouchableOpacity
                onPress={() => hasData && handleSelectCondition(condition)}
                disabled={!hasData}
                className={`flex-1 rounded-2xl p-3 border-2 ${
                    hasData
                        ? 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 active:bg-blue-50 dark:active:bg-blue-900/30 active:border-blue-500 dark:active:border-blue-600'
                        : 'bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-700 opacity-50'
                }`}
                style={{ aspectRatio: 1 }}
            >
                <View className="flex-1 justify-between" style={{ overflow: 'hidden' }}>
                    {/* Top Section - Emoji & Title */}
                    <View className="flex-shrink">
                        <Text className="text-3xl mb-1">{emoji}</Text>
                        <Text className="text-base font-bold text-gray-800 dark:text-white mb-0.5">
                            {title}
                        </Text>
                        <Text className="text-xs text-gray-500 dark:text-gray-400">
                            {description}
                        </Text>
                    </View>

                    {/* Bottom Section - Price Info */}
                    {hasData && (
                        <View className="mt-1 flex-shrink-0">
                            {!isCustom && priceData ? (
                                <View className="bg-green-50 dark:bg-green-900/30 rounded-lg p-2">
                                    <Text className="text-xs text-gray-600 dark:text-gray-400">
                                        Median:
                                    </Text>
                                    <Text className="text-lg font-bold text-green-600 dark:text-green-400">
                                        €{priceData.median}
                                    </Text>
                                </View>
                            ) : (
                                <View className="bg-blue-50 dark:bg-blue-900/30 rounded-lg p-2">
                                    <Text className="text-xs text-blue-700 dark:text-blue-300 text-center font-medium">
                                        Set your own price
                                    </Text>
                                </View>
                            )}
                        </View>
                    )}

                    {!hasData && !isCustom && (
                        <View className="mt-1">
                            <Text className="text-xs text-gray-500 dark:text-gray-400 text-center">
                                No data
                            </Text>
                        </View>
                    )}
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <View className="flex-1 bg-gray-50 dark:bg-black">
            <ScrollView className="flex-1">
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
                            Select Pricing Option
                        </Text>
                    </View>
                    <Text className="text-gray-600 dark:text-gray-400 mb-4 ml-12">
                        Choose a condition or set your own price
                    </Text>
                    <View className="bg-blue-50 dark:bg-blue-900/30 rounded-lg p-3 ml-12">
                        <Text className="text-sm text-blue-800 dark:text-blue-300 font-medium">
                            📦 {analysisResult.product.title}
                        </Text>
                    </View>
                </View>

                {/* Info Banner */}
                <View className="bg-yellow-50 dark:bg-yellow-900/30 border-l-4 border-yellow-400 dark:border-yellow-600 p-4 mx-6 mt-6 mb-4">
                    <Text className="text-yellow-800 dark:text-yellow-300 text-xs font-semibold mb-1">
                        💡 Pricing based on eBay listings:
                    </Text>
                    <Text className="text-yellow-700 dark:text-yellow-400 text-xs">
                        • Median prices are most reliable{'\n'}
                        • Outliers automatically removed{'\n'}
                        • Or set your own custom price
                    </Text>
                </View>

                {/* 2x2 Grid */}
                <View className="px-6">
                    {/* First Row */}
                    <View className="flex-row gap-4 mb-4">
                        {renderGridCard(
                            'new',
                            'New',
                            '✨',
                            'Brand new'
                        )}
                        {renderGridCard(
                            'refurbished',
                            'Refurbished',
                            '🔧',
                            'Restored'
                        )}
                    </View>

                    {/* Second Row */}
                    <View className="flex-row gap-4 mb-6">
                        {renderGridCard(
                            'used',
                            'Used',
                            '📦',
                            'Pre-owned'
                        )}
                        {renderGridCard(
                            'custom',
                            'Custom Price',
                            '💰',
                            'Set your own'
                        )}
                    </View>
                </View>

                {/* Search Info */}
                <View className="px-6 pb-6">
                    <View className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4">
                        <Text className="text-xs text-gray-600 dark:text-gray-400 text-center">
                            Market data from eBay Germany
                        </Text>
                        <Text className="text-xs text-gray-500 dark:text-gray-500 text-center mt-1">
                            Search: {priceResults.searchQuery}
                        </Text>
                    </View>
                </View>
            </ScrollView>
        </View>
    );
}