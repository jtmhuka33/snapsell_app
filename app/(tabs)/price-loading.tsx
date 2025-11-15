import { View, Text, ActivityIndicator, TouchableOpacity } from "react-native";
import { useEffect, useState } from "react";
import { router, useLocalSearchParams } from "expo-router";
import { researchEbayPrices } from "@/helpers/ebayPriceResearcher";
import { ProductAnalysis } from "@/types/product";

export default function PriceLoading() {
    const params = useLocalSearchParams();
    const analysisResult: ProductAnalysis = JSON.parse(params.analysisResult as string);

    const [status, setStatus] = useState("Connecting to eBay...");
    const [error, setError] = useState<string | null>(null);

    const handleBack = () => {
        if (router.canGoBack()) {
            router.back();
        }
    };

    useEffect(() => {
        researchPrices();
    }, []);

    const researchPrices = async () => {
        try {
            setStatus("Searching for new listings...");
            await new Promise(resolve => setTimeout(resolve, 500));

            setStatus("Searching for refurbished listings...");
            await new Promise(resolve => setTimeout(resolve, 500));

            setStatus("Searching for used listings...");
            await new Promise(resolve => setTimeout(resolve, 500));

            setStatus("Calculating price ranges...");
            const priceResults = await researchEbayPrices(analysisResult);

            // Navigate to price selection screen
            router.replace({
                pathname: '/(tabs)/price-selection',
                params: {
                    analysisResult: JSON.stringify(analysisResult),
                    priceResults: JSON.stringify(priceResults)
                }
            });
        } catch (err) {
            console.error('Price research error:', err);
            setError(err instanceof Error ? err.message : 'Failed to research prices');
        }
    };

    if (error) {
        return (
            <View className="flex-1 bg-white justify-center items-center px-6">
                {/* Back Button */}
                <TouchableOpacity
                    onPress={handleBack}
                    className="absolute top-12 left-4 p-2 z-10"
                >
                    <Text className="text-2xl">←</Text>
                </TouchableOpacity>

                <Text className="text-6xl mb-4">❌</Text>
                <Text className="text-xl font-bold text-gray-800 mb-2">
                    Error Researching Prices
                </Text>
                <Text className="text-gray-600 text-center mb-6">
                    {error}
                </Text>
                <Text className="text-sm text-gray-500 text-center mb-6">
                    Please check your eBay API credentials and try again
                </Text>
                <TouchableOpacity
                    onPress={handleBack}
                    className="bg-blue-500 px-6 py-3 rounded-lg"
                >
                    <Text className="text-white font-semibold">Go Back</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <View className="flex-1 bg-white justify-center items-center px-6">
            {/* Back Button */}
            <TouchableOpacity
                onPress={handleBack}
                className="absolute top-12 left-4 p-2 z-10"
            >
                <Text className="text-2xl">←</Text>
            </TouchableOpacity>

            <View className="mb-8">
                <Text className="text-6xl text-center mb-4">💰</Text>
                <ActivityIndicator size="large" color="#3B82F6" />
            </View>

            <Text className="text-2xl font-bold text-gray-800 mb-2 text-center">
                Researching Prices
            </Text>

            <Text className="text-gray-600 text-center mb-8">
                {status}
            </Text>

            <View className="bg-blue-50 rounded-lg p-4 w-full">
                <Text className="text-sm text-blue-800 text-center">
                    Analyzing {analysisResult.product.manufacturer} {analysisResult.product.title}
                </Text>
            </View>

            <View className="mt-8 space-y-2">
                <View className="flex-row items-center gap-2">
                    <View className="w-2 h-2 rounded-full bg-green-500" />
                    <Text className="text-sm text-gray-600">Searching eBay listings</Text>
                </View>
                <View className="flex-row items-center gap-2">
                    <View className="w-2 h-2 rounded-full bg-blue-500" />
                    <Text className="text-sm text-gray-600">Comparing prices by condition</Text>
                </View>
                <View className="flex-row items-center gap-2">
                    <View className="w-2 h-2 rounded-full bg-purple-500" />
                    <Text className="text-sm text-gray-600">Calculating averages</Text>
                </View>
            </View>
        </View>
    );
}