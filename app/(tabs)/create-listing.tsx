import { View, Text, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { ProductAnalysis } from "@/types/product";
import { useState } from "react";
import { createEbayListing, getEbayListingUrl } from "@/helpers/ebayListingCreator";
import { FontAwesome5, FontAwesome } from "@expo/vector-icons";
import { useColorScheme } from "@/hooks/use-color-scheme";

export default function CreateListing() {
    const colorScheme = useColorScheme();
    const isDark = colorScheme === 'dark';

    const params = useLocalSearchParams();
    const analysisResult: ProductAnalysis = JSON.parse(params.analysisResult as string);
    const selectedCondition = params.selectedCondition as string;
    const selectedPrice = JSON.parse(params.selectedPrice as string);

    console.log("selected Price", selectedPrice);
    const [isCreatingEbay, setIsCreatingEbay] = useState(false);

    const handleBack = () => {
        if (router.canGoBack()) {
            router.back();
        }
    };

    const handleFacebookListing = () => {
        Alert.alert(
            "Coming Soon",
            "Facebook Marketplace listing integration is coming soon!",
            [{ text: "OK" }]
        );
    };

    const handleEbayListing = async () => {
        Alert.alert(
            "Create eBay Listing?",
            `This will create a listing for ${analysisResult.product.title} at €${selectedPrice.median}.`,
            [
                {
                    text: "Cancel",
                    style: "cancel"
                },
                {
                    text: "Create",
                    onPress: async () => {
                        setIsCreatingEbay(true);
                        try {
                            const result = await createEbayListing({
                                product: analysisResult,
                                price: selectedPrice,
                                condition: selectedCondition as any,
                                quantity: 1
                            });

                            if (result.success && result.listingId) {
                                Alert.alert(
                                    "Success! 🎉",
                                    `Your listing has been created on eBay!`,
                                    [
                                        {
                                            text: "View Listing",
                                            onPress: () => {
                                                // In a real app, this would open the listing URL
                                                const url = getEbayListingUrl(result.listingId!);
                                                console.log('Listing URL:', url);
                                                Alert.alert("Listing URL", url);
                                            }
                                        },
                                        {
                                            text: "Done",
                                            onPress: () => router.push('/(tabs)')
                                        }
                                    ]
                                );
                            } else {
                                // Handle specific errors
                                let errorMessage = result.error || "Unknown error occurred";

                                if (errorMessage.includes("oauth") || errorMessage.includes("scope") || errorMessage.includes("token")) {
                                    Alert.alert(
                                        "OAuth Required",
                                        "To create eBay listings, you need to authenticate with your eBay seller account. This feature requires OAuth user authentication which isn't yet implemented in this version.\n\nThe app currently uses client credentials which only allow searching listings, not creating them.",
                                        [{ text: "OK" }]
                                    );
                                } else if (errorMessage.includes("policy") || errorMessage.includes("POLICY")) {
                                    Alert.alert(
                                        "Business Policies Required",
                                        "Before creating listings, you need to set up business policies (fulfillment, payment, and return policies) in your eBay seller account.\n\nPlease log in to your eBay seller account and create these policies first.",
                                        [{ text: "OK" }]
                                    );
                                } else {
                                    Alert.alert(
                                        "Error Creating Listing",
                                        `Failed to create listing on eBay:\n\n${errorMessage}`,
                                        [{ text: "OK" }]
                                    );
                                }
                            }
                        } catch (error) {
                            console.error('Error creating eBay listing:', error);
                            Alert.alert(
                                "Error",
                                "An unexpected error occurred while creating the listing. Please try again.",
                                [{ text: "OK" }]
                            );
                        } finally {
                            setIsCreatingEbay(false);
                        }
                    }
                }
            ]
        );
    };

    const getConditionDisplay = () => {
        const conditionMap: { [key: string]: { emoji: string; label: string } } = {
            'new': { emoji: '✨', label: 'New' },
            'refurbished': { emoji: '🔧', label: 'Refurbished' },
            'used': { emoji: '📦', label: 'Used' },
            'custom': { emoji: '💰', label: 'Custom Price' }
        };
        return conditionMap[selectedCondition] || { emoji: '📦', label: 'Used' };
    };

    const conditionDisplay = getConditionDisplay();

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
                            Create Listing
                        </Text>
                    </View>
                    <Text className="text-gray-600 dark:text-gray-400 ml-12">
                        Ready to list your item
                    </Text>
                </View>

                {/* Product Summary Card */}
                <View className="p-6">
                    <View className="bg-white dark:bg-gray-900 rounded-2xl border-2 border-gray-200 dark:border-gray-700 overflow-hidden">
                        {/* Header Section */}
                        <View className="bg-gradient-to-r from-blue-500 to-blue-600 p-6">
                            <Text className="text-white text-2xl font-bold mb-2">
                                {analysisResult.product.title}
                            </Text>
                            <Text className="text-blue-100 text-sm">
                                by {analysisResult.product.manufacturer}
                            </Text>
                        </View>

                        {/* Details Section */}
                        <View className="p-6">
                            {/* Description */}
                            <View className="mb-4">
                                <Text className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-2">
                                    Description
                                </Text>
                                <Text className="text-gray-700 dark:text-gray-300 leading-5">
                                    {analysisResult.product.description}
                                </Text>
                            </View>

                            {/* Condition & Price Grid */}
                            <View className="flex-row gap-3 mb-4">
                                {/* Condition */}
                                <View className="flex-1 bg-gray-50 dark:bg-gray-800 rounded-xl p-4">
                                    <Text className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-2">
                                        Condition
                                    </Text>
                                    <View className="flex-row items-center gap-2">
                                        <Text className="text-2xl">{conditionDisplay.emoji}</Text>
                                        <Text className="text-base font-bold text-gray-800 dark:text-white">
                                            {conditionDisplay.label}
                                        </Text>
                                    </View>
                                </View>

                                {/* Price */}
                                <View className="flex-1 bg-green-50 dark:bg-green-900/30 rounded-xl p-4">
                                    <Text className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-2">
                                        Listing Price
                                    </Text>
                                    <Text className="text-2xl font-bold text-green-600 dark:text-green-400">
                                        €{selectedPrice.median}
                                    </Text>
                                </View>
                            </View>

                            {/* Additional Info */}
                            {selectedCondition !== 'custom' && selectedPrice.count > 0 && (
                                <View className="bg-blue-50 dark:bg-blue-900/30 rounded-lg p-3">
                                    <Text className="text-xs text-blue-800 dark:text-blue-300">
                                        💡 Based on {selectedPrice.count} similar listing{selectedPrice.count !== 1 ? 's' : ''} on eBay
                                    </Text>
                                </View>
                            )}
                        </View>
                    </View>
                </View>

                {/* Listing Platforms Section */}
                <View className="px-6 pb-6">
                    <Text className="text-lg font-bold text-gray-800 dark:text-white mb-4">
                        Choose Where to List
                    </Text>

                    {/* eBay Button */}
                    <TouchableOpacity
                        onPress={handleEbayListing}
                        disabled={isCreatingEbay}
                        className="mb-4 rounded-2xl overflow-hidden border-2 border-gray-200 dark:border-gray-700 active:opacity-70"
                    >
                        <View className="bg-white dark:bg-gray-900 p-5">
                            <View className="flex-row items-center justify-between">
                                <View className="flex-row items-center gap-4 flex-1">
                                    {/* eBay Logo Background */}
                                    <View className="w-16 h-16 bg-blue-600 dark:bg-blue-500 rounded-xl items-center justify-center">
                                        <FontAwesome5
                                            name="ebay"
                                            size={32}
                                            color="white"
                                        />
                                    </View>

                                    <View className="flex-1">
                                        <Text className="text-xl font-bold text-gray-800 dark:text-white mb-1">
                                            List on eBay
                                        </Text>
                                        <Text className="text-sm text-gray-600 dark:text-gray-400">
                                            Reach millions of buyers worldwide
                                        </Text>
                                    </View>
                                </View>

                                {isCreatingEbay ? (
                                    <ActivityIndicator size="small" color={isDark ? "#60A5FA" : "#3B82F6"} />
                                ) : (
                                    <Text className="text-blue-500 dark:text-blue-400 text-2xl">→</Text>
                                )}
                            </View>
                        </View>
                    </TouchableOpacity>

                    {/* Facebook Marketplace Button */}
                    <TouchableOpacity
                        onPress={handleFacebookListing}
                        className="rounded-2xl overflow-hidden border-2 border-gray-200 dark:border-gray-700 active:opacity-70"
                    >
                        <View className="bg-white dark:bg-gray-900 p-5">
                            <View className="flex-row items-center justify-between">
                                <View className="flex-row items-center gap-4 flex-1">
                                    {/* Facebook Logo Background */}
                                    <View className="w-16 h-16 bg-blue-500 dark:bg-blue-600 rounded-xl items-center justify-center">
                                        <FontAwesome
                                            name="facebook"
                                            size={38}
                                            color="white"
                                        />
                                    </View>

                                    <View className="flex-1">
                                        <View className="mb-1">
                                            <Text className="text-xl font-bold text-gray-800 dark:text-white mb-1">
                                                Facebook Marketplace
                                            </Text>
                                            <View className="self-start bg-yellow-100 dark:bg-yellow-900/50 px-2 py-1 rounded">
                                                <Text className="text-xs font-bold text-yellow-700 dark:text-yellow-300">
                                                    SOON
                                                </Text>
                                            </View>
                                        </View>
                                        <Text className="text-sm text-gray-600 dark:text-gray-400">
                                            List locally and sell fast
                                        </Text>
                                    </View>
                                </View>

                                <Text className="text-gray-400 dark:text-gray-500 text-2xl">→</Text>
                            </View>
                        </View>
                    </TouchableOpacity>

                    {/* Info Banner */}
                    <View className="mt-6 bg-indigo-50 dark:bg-indigo-900/30 border-l-4 border-indigo-400 dark:border-indigo-600 p-4 rounded-r-lg">
                        <Text className="text-indigo-800 dark:text-indigo-300 text-xs font-semibold mb-1">
                            💡 Listing Tips:
                        </Text>
                        <Text className="text-indigo-700 dark:text-indigo-400 text-xs">
                            • Take clear, well-lit photos{'\n'}
                            • Be honest about condition{'\n'}
                            • Respond quickly to buyers{'\n'}
                            • Offer secure payment methods
                        </Text>
                    </View>
                </View>
            </ScrollView>
        </View>
    );
}