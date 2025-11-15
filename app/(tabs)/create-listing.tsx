import {View, Text, TouchableOpacity} from "react-native";
import {router} from "expo-router";

export default function CreateListing() {
    const handleBack = () => {
        if (router.canGoBack()) {
            router.back();
        }
    };

    return (
        <View className="flex-1 bg-white">
            {/* Header with Back Button */}
            <View className="p-4 border-b border-gray-200">
                <View className="flex-row items-center">
                    <TouchableOpacity
                        onPress={handleBack}
                        className="mr-3 p-2 -ml-2"
                    >
                        <Text className="text-2xl">←</Text>
                    </TouchableOpacity>
                    <Text className="text-2xl font-bold text-gray-800">Create Listing</Text>
                </View>
            </View>

            <View className="flex-1 items-center justify-center">
                <Text className="text-gray-600">Listing creation coming soon...</Text>
            </View>
        </View>
    )
}