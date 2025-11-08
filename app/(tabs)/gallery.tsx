import {View, Text, TouchableOpacity, ScrollView, StyleSheet, Alert} from "react-native";
import {Image} from "expo-image";
import {useState} from "react";
import {router, useLocalSearchParams} from "expo-router";
import {imageAnalyzer} from "@/helpers/imageAnalyzer";
import Waiting from "@/app/components/waiting";

export default function Gallery() {
    const params = useLocalSearchParams();
    const photoUris = JSON.parse(params.photoUris as string) as string[];

    const [selectedPhotos, setSelectedPhotos] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    const togglePhotoSelection = (uri: string) => {
        if (selectedPhotos.includes(uri)) {
            setSelectedPhotos(selectedPhotos.filter(u => u !== uri));
        } else {
            setSelectedPhotos([...selectedPhotos, uri]);
        }
    };

    const selectAll = () => {
        setSelectedPhotos(photoUris);
    };

    const deselectAll = () => {
        setSelectedPhotos([]);
    };

    const analyzePhotos = async () => {
        if (selectedPhotos.length === 0) {
            Alert.alert("No Selection", "Please select at least one photo to analyze.");
            return;
        }

        setIsLoading(true);
        try {
            // Send ALL selected photos at once to get ONE unified response
            const result = await imageAnalyzer(selectedPhotos);

            console.log("Analysis result:", result);

            // Navigate to review screen with the analysis result
            router.push({
                pathname: '/(tabs)/review',
                params: {
                    analysisResult: JSON.stringify(result)
                }
            });
        } catch (error) {
            console.error("Error analyzing photos:", error);
            Alert.alert("Error", "Failed to analyze photos. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading) {
        return <Waiting/>;
    }

    return (
        <View className="flex-1 bg-white">
            {/* Header */}
            <View className="p-4 border-b border-gray-200">
                <Text className="text-2xl font-bold text-gray-800">Select Photos</Text>
                <Text className="text-gray-600 mt-1">
                    {selectedPhotos.length} of {photoUris.length} selected
                </Text>
            </View>

            {/* Quick Actions */}
            <View className="flex-row p-4 gap-2">
                <TouchableOpacity
                    onPress={selectAll}
                    className="flex-1 bg-blue-100 py-3 rounded-lg"
                >
                    <Text className="text-center text-blue-700 font-semibold">
                        Select All
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    onPress={deselectAll}
                    className="flex-1 bg-gray-100 py-3 rounded-lg"
                >
                    <Text className="text-center text-gray-700 font-semibold">
                        Deselect All
                    </Text>
                </TouchableOpacity>
            </View>

            {/* Photo Grid */}
            <ScrollView className="flex-1 p-4">
                <View className="flex-row flex-wrap gap-2">
                    {photoUris.map((uri, index) => {
                        const isSelected = selectedPhotos.includes(uri);
                        return (
                            <TouchableOpacity
                                key={index}
                                onPress={() => togglePhotoSelection(uri)}
                                className="relative"
                                style={styles.photoContainer}
                            >
                                <Image
                                    source={{uri}}
                                    style={styles.photo}
                                    contentFit="cover"
                                />
                                {isSelected && (
                                    <View style={styles.selectedOverlay}>
                                        <View className="w-8 h-8 bg-blue-500 rounded-full items-center justify-center">
                                            <Text className="text-white font-bold">✓</Text>
                                        </View>
                                    </View>
                                )}
                            </TouchableOpacity>
                        );
                    })}
                </View>
            </ScrollView>

            {/* Bottom Action Bar */}
            <View className="p-4 border-t border-gray-200">
                <TouchableOpacity
                    onPress={analyzePhotos}
                    disabled={selectedPhotos.length === 0}
                    className={`py-4 rounded-lg ${
                        selectedPhotos.length === 0 ? 'bg-gray-300' : 'bg-blue-500'
                    }`}
                >
                    <Text className={`text-center font-bold text-base ${
                        selectedPhotos.length === 0 ? 'text-gray-500' : 'text-white'
                    }`}>
                        Analyze Selected Photos ({selectedPhotos.length})
                    </Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    photoContainer: {
        width: '48%',
        aspectRatio: 1,
        borderRadius: 8,
        overflow: 'hidden',
    },
    photo: {
        width: '100%',
        height: '100%',
    },
    selectedOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(59, 130, 246, 0.3)',
        justifyContent: 'center',
        alignItems: 'center',
    },
});