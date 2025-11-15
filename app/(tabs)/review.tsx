import {View, Text, TouchableOpacity, TextInput, ScrollView} from "react-native";
import {useEffect, useState} from "react";
import {router, useLocalSearchParams} from "expo-router";
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withTiming,
    Easing,
} from 'react-native-reanimated';

type Step = 'title' | 'manufacturer' | 'description';

export default function Review() {
    const params = useLocalSearchParams();
    const analysisResult = JSON.parse(params.analysisResult as string);

    const [step, setStep] = useState<Step>('title');
    const [isEditing, setIsEditing] = useState(false);

    const [title, setTitle] = useState(analysisResult.product.title);
    const [manufacturer, setManufacturer] = useState(analysisResult.product.manufacturer);
    const [description, setDescription] = useState(analysisResult.product.description);

    // Animation values
    const fadeAnim = useSharedValue(0);

    useEffect(() => {
        // Fade in when step changes
        fadeAnim.value = 0;
        fadeAnim.value = withTiming(1, {
            duration: 800,
            easing: Easing.out(Easing.ease),
        });
    }, [step]);

    const animatedStyle = useAnimatedStyle(() => {
        return {
            opacity: fadeAnim.value,
        };
    });

    const handleBack = () => {
        // If editing, cancel edit
        if (isEditing) {
            setIsEditing(false);
            return;
        }

        // If not on first step, go to previous step
        if (step === 'description') {
            setStep('manufacturer');
            return;
        }
        if (step === 'manufacturer') {
            setStep('title');
            return;
        }

        // On first step, go back to previous screen
        if (router.canGoBack()) {
            router.back();
        }
    };

    const handleNo = () => {
        setIsEditing(true);
    };

    const handleYes = async () => {
        if (step === 'title') {
            setStep('manufacturer');
            setIsEditing(false);
        } else if (step === 'manufacturer') {
            setStep('description');
            setIsEditing(false);
        } else if (step === 'description') {
            // All steps complete - navigate to price analysis
            setIsEditing(false);

            // Update the analysis result with edited values
            const updatedAnalysis = {
                product: {
                    title,
                    manufacturer,
                    description,
                }
            };

            router.push({
                pathname: '/(tabs)/price-loading',
                params: {
                    analysisResult: JSON.stringify(updatedAnalysis)
                }
            });
        }
    }

    const handleSaveEdit = () => {
        let value = '';
        if (step === 'title') value = title;
        else if (step === 'manufacturer') value = manufacturer;
        else if (step === 'description') value = description;

        if (value.trim()) {
            setIsEditing(false);
        }
    };

    const getCurrentValue = () => {
        if (step === 'title') return title;
        if (step === 'manufacturer') return manufacturer;
        if (step === 'description') return description;
        return '';
    };

    const getCurrentLabel = () => {
        if (step === 'title') return 'Product Title';
        if (step === 'manufacturer') return 'Manufacturer';
        if (step === 'description') return 'Description';
        return '';
    };

    const handleValueChange = (text: string) => {
        if (step === 'title') setTitle(text);
        else if (step === 'manufacturer') setManufacturer(text);
        else if (step === 'description') setDescription(text);
    };

    return (
        <ScrollView className="flex-1 bg-white dark:bg-black">
            <View className="px-6 py-8">
                {/* Header with Back Button */}
                <View className="flex-row items-center mb-2">
                    <TouchableOpacity
                        onPress={handleBack}
                        className="mr-3 p-2 -ml-2"
                    >
                        <Text className="text-2xl">←</Text>
                    </TouchableOpacity>
                    <Text className="text-3xl font-bold text-gray-900 dark:text-white flex-1">
                        Review Product Details
                    </Text>
                </View>
                <Text className="text-sm text-gray-600 dark:text-gray-400 mb-8 ml-12">
                    Step {step === 'title' ? '1' : step === 'manufacturer' ? '2' : '3'} of 3
                </Text>

                <Animated.View style={animatedStyle} className="mb-8">
                    <Text className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                        {getCurrentLabel()}
                    </Text>

                    {!isEditing ? (
                        <View className="bg-gray-50 dark:bg-gray-900 rounded-2xl p-6">
                            <Text className="text-base text-gray-800 dark:text-gray-200 mb-4">
                                {getCurrentValue()}
                            </Text>
                            <Text className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                                Is this correct?
                            </Text>
                            <View className="flex-row gap-3">
                                <TouchableOpacity
                                    onPress={handleNo}
                                    className="flex-1 bg-gray-200 dark:bg-gray-800 py-3 rounded-xl"
                                >
                                    <Text className="text-center font-semibold text-gray-900 dark:text-white">
                                        No, Edit
                                    </Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    onPress={handleYes}
                                    className="flex-1 bg-blue-500 py-3 rounded-xl"
                                >
                                    <Text className="text-center font-semibold text-white">
                                        Yes, Continue
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    ) : (
                        <View>
                            <TextInput
                                value={getCurrentValue()}
                                onChangeText={handleValueChange}
                                multiline={step === 'description'}
                                numberOfLines={step === 'description' ? 6 : 1}
                                className="bg-white dark:bg-gray-900 border-2 border-blue-500 rounded-xl p-4 text-base text-gray-900 dark:text-white mb-4"
                                placeholder={`Enter ${getCurrentLabel().toLowerCase()}`}
                                placeholderTextColor="#9CA3AF"
                            />
                            <TouchableOpacity
                                onPress={handleSaveEdit}
                                className="bg-blue-500 py-3 rounded-xl"
                            >
                                <Text className="text-center font-semibold text-white">
                                    Save Changes
                                </Text>
                            </TouchableOpacity>
                        </View>
                    )}
                </Animated.View>

                {/* Progress Indicator */}
                <View className="flex-row justify-center gap-2 mt-8">
                    <View
                        className={`h-2 w-12 rounded-full ${step === 'title' ? 'bg-blue-500' : 'bg-gray-300 dark:bg-gray-700'}`}/>
                    <View
                        className={`h-2 w-12 rounded-full ${step === 'manufacturer' ? 'bg-blue-500' : 'bg-gray-300 dark:bg-gray-700'}`}/>
                    <View
                        className={`h-2 w-12 rounded-full ${step === 'description' ? 'bg-blue-500' : 'bg-gray-300 dark:bg-gray-700'}`}/>
                </View>
            </View>
        </ScrollView>
    );
}