import { View, Text, TouchableOpacity, ScrollView } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { ProductAnalysis } from "@/types/product";

export default function PriceMethodSelection() {
    const params = useLocalSearchParams();
    const analysisResult: ProductAnalysis = JSON.parse(params.analysisResult as string);

    const handleBack = () => {
        if (router.canGoBack()) {
            router.back();
        }
    };

    const handleEbayResearch = () => {
        // Navigate to eBay price loading screen
        router.push({
            pathname: '/(tabs)/price-loading',
            params: {
                analysisResult: JSON.stringify(analysisResult)
            }
        });
    };

    const handleAIResearch = () => {
        // Placeholder for future AI research implementation
        // Currently does nothing
        console.log('AI Research coming soon...');
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
                            Choose Research Method
                        </Text>
                    </View>
                    <Text className="text-gray-600 dark:text-gray-400 mb-4 ml-12">
                        Select how you'd like to research pricing
                    </Text>
                    <View className="bg-blue-50 dark:bg-blue-900/30 rounded-lg p-3 ml-12">
                        <Text className="text-sm text-blue-800 dark:text-blue-300 font-medium">
                            📦 {analysisResult.product.title}
                        </Text>
                    </View>
                </View>

                {/* Info Banner */}
                <View className="bg-indigo-50 dark:bg-indigo-900/30 border-l-4 border-indigo-400 dark:border-indigo-600 p-4 mx-6 mt-6 mb-4">
                    <Text className="text-indigo-800 dark:text-indigo-300 text-xs font-semibold mb-1">
                        💡 Choose Your Pricing Strategy:
                    </Text>
                    <Text className="text-indigo-700 dark:text-indigo-400 text-xs">
                        • eBay: Real marketplace data from active listings{'\n'}
                        • AI: Intelligent analysis (coming soon)
                    </Text>
                </View>

                {/* Research Method Cards */}
                <View className="px-6 space-y-4">
                    {/* eBay Research Card */}
                    <TouchableOpacity
                        onPress={handleEbayResearch}
                        className="bg-white dark:bg-gray-900 rounded-2xl border-2 border-gray-200 dark:border-gray-700 active:border-blue-500 dark:active:border-blue-600 active:bg-blue-50 dark:active:bg-blue-900/30"
                    >
                        <View className="p-6">
                            {/* Header */}
                            <View className="flex-row items-center justify-between mb-4">
                                <View className="flex-row items-center gap-3">
                                    <View className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl items-center justify-center">
                                        <Text className="text-3xl">🛍️</Text>
                                    </View>
                                    <View>
                                        <Text className="text-xl font-bold text-gray-900 dark:text-white">
                                            eBay Research
                                        </Text>
                                        <Text className="text-sm text-green-600 dark:text-green-400 font-medium">
                                            Recommended
                                        </Text>
                                    </View>
                                </View>
                                <View className="bg-blue-100 dark:bg-blue-900/50 px-3 py-1 rounded-full">
                                    <Text className="text-blue-700 dark:text-blue-300 font-semibold text-xs">
                                        LIVE DATA
                                    </Text>
                                </View>
                            </View>

                            {/* Description */}
                            <Text className="text-gray-700 dark:text-gray-300 text-sm mb-4 leading-5">
                                Get accurate pricing based on real marketplace listings from eBay Germany.
                                Analyzes new, refurbished, and used condition prices.
                            </Text>

                            {/* Features */}
                            <View className="space-y-2">
                                <View className="flex-row items-center gap-2">
                                    <View className="w-1.5 h-1.5 rounded-full bg-blue-500 dark:bg-blue-400" />
                                    <Text className="text-xs text-gray-600 dark:text-gray-400">
                                        Real-time marketplace data
                                    </Text>
                                </View>
                                <View className="flex-row items-center gap-2">
                                    <View className="w-1.5 h-1.5 rounded-full bg-blue-500 dark:bg-blue-400" />
                                    <Text className="text-xs text-gray-600 dark:text-gray-400">
                                        Multiple condition analysis
                                    </Text>
                                </View>
                                <View className="flex-row items-center gap-2">
                                    <View className="w-1.5 h-1.5 rounded-full bg-blue-500 dark:bg-blue-400" />
                                    <Text className="text-xs text-gray-600 dark:text-gray-400">
                                        Statistical outlier removal
                                    </Text>
                                </View>
                            </View>

                            {/* Action Indicator */}
                            <View className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800">
                                <View className="flex-row items-center justify-between">
                                    <Text className="text-blue-600 dark:text-blue-400 font-semibold text-sm">
                                        Start eBay Research
                                    </Text>
                                    <Text className="text-blue-600 dark:text-blue-400 text-xl">→</Text>
                                </View>
                            </View>
                        </View>
                    </TouchableOpacity>

                    {/* AI Research Card (Disabled) */}
                    <TouchableOpacity
                        onPress={handleAIResearch}
                        disabled={true}
                        className="bg-white dark:bg-gray-900 rounded-2xl border-2 border-gray-200 dark:border-gray-700 opacity-60"
                    >
                        <View className="p-6">
                            {/* Header */}
                            <View className="flex-row items-center justify-between mb-4">
                                <View className="flex-row items-center gap-3">
                                    <View className="w-14 h-14 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl items-center justify-center">
                                        <Text className="text-3xl">🤖</Text>
                                    </View>
                                    <View>
                                        <Text className="text-xl font-bold text-gray-900 dark:text-white">
                                            AI Research
                                        </Text>
                                        <Text className="text-sm text-gray-500 dark:text-gray-500 font-medium">
                                            Coming Soon
                                        </Text>
                                    </View>
                                </View>
                                <View className="bg-purple-100 dark:bg-purple-900/50 px-3 py-1 rounded-full">
                                    <Text className="text-purple-700 dark:text-purple-300 font-semibold text-xs">
                                        BETA
                                    </Text>
                                </View>
                            </View>

                            {/* Description */}
                            <Text className="text-gray-700 dark:text-gray-300 text-sm mb-4 leading-5">
                                Advanced AI-powered pricing analysis using machine learning to predict
                                optimal prices based on market trends and product characteristics.
                            </Text>

                            {/* Features */}
                            <View className="space-y-2">
                                <View className="flex-row items-center gap-2">
                                    <View className="w-1.5 h-1.5 rounded-full bg-purple-500 dark:bg-purple-400" />
                                    <Text className="text-xs text-gray-600 dark:text-gray-400">
                                        Machine learning predictions
                                    </Text>
                                </View>
                                <View className="flex-row items-center gap-2">
                                    <View className="w-1.5 h-1.5 rounded-full bg-purple-500 dark:bg-purple-400" />
                                    <Text className="text-xs text-gray-600 dark:text-gray-400">
                                        Market trend analysis
                                    </Text>
                                </View>
                                <View className="flex-row items-center gap-2">
                                    <View className="w-1.5 h-1.5 rounded-full bg-purple-500 dark:bg-purple-400" />
                                    <Text className="text-xs text-gray-600 dark:text-gray-400">
                                        Competitive pricing insights
                                    </Text>
                                </View>
                            </View>

                            {/* Coming Soon Banner */}
                            <View className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800">
                                <View className="bg-gray-100 dark:bg-gray-800 rounded-lg p-3">
                                    <Text className="text-gray-600 dark:text-gray-400 text-xs text-center font-medium">
                                        🚀 This feature is under development
                                    </Text>
                                </View>
                            </View>
                        </View>
                    </TouchableOpacity>
                </View>

                {/* Bottom Spacing */}
                <View className="h-6" />
            </ScrollView>
        </View>
    );
}