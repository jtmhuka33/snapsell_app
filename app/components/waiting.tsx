import React, {useEffect} from 'react';
import {View, Text} from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withRepeat,
    withSequence,
    withTiming,
    Easing,
} from 'react-native-reanimated';

export default function Waiting() {
    const scale = useSharedValue(1);
    const opacity = useSharedValue(0.6);
    const dot1Opacity = useSharedValue(0.3);
    const dot2Opacity = useSharedValue(0.3);
    const dot3Opacity = useSharedValue(0.3);

    useEffect(() => {
        scale.value = withRepeat(
            withSequence(
                withTiming(1.15, {
                    duration: 2000,
                    easing: Easing.bezier(0.4, 0.0, 0.6, 1.0),
                }),
                withTiming(1, {
                    duration: 2000,
                    easing: Easing.bezier(0.4, 0.0, 0.6, 1.0),
                })
            ),
            -1,
            false
        );

        opacity.value = withRepeat(
            withSequence(
                withTiming(1, {
                    duration: 2000,
                    easing: Easing.bezier(0.4, 0.0, 0.6, 1.0),
                }),
                withTiming(0.6, {
                    duration: 2000,
                    easing: Easing.bezier(0.4, 0.0, 0.6, 1.0),
                })
            ),
            -1,
            false
        );

        dot1Opacity.value = withRepeat(
            withSequence(
                withTiming(1, {duration: 600}),
                withTiming(0.3, {duration: 600})
            ),
            -1,
            false
        );

        dot2Opacity.value = withRepeat(
            withSequence(
                withTiming(0.3, {duration: 200}),
                withTiming(1, {duration: 600}),
                withTiming(0.3, {duration: 600})
            ),
            -1,
            false
        );

        dot3Opacity.value = withRepeat(
            withSequence(
                withTiming(0.3, {duration: 400}),
                withTiming(1, {duration: 600}),
                withTiming(0.3, {duration: 600})
            ),
            -1,
            false
        );
    }, []);

    const animatedCircleStyle = useAnimatedStyle(() => {
        return {
            transform: [{scale: scale.value}],
            opacity: opacity.value,
        };
    });

    const dot1Style = useAnimatedStyle(() => {
        return {
            opacity: dot1Opacity.value,
        };
    });

    const dot2Style = useAnimatedStyle(() => {
        return {
            opacity: dot2Opacity.value,
        };
    });

    const dot3Style = useAnimatedStyle(() => {
        return {
            opacity: dot3Opacity.value,
        };
    });

    return (
        <View className="flex-1 bg-white items-center justify-center">
            <Animated.View
                style={animatedCircleStyle}
                className="w-40 h-40 rounded-full bg-indigo-400 items-center justify-center shadow-lg"
            >
                <View
                    className="absolute rounded-full bg-indigo-300"
                    style={{width: 120, height: 120, borderRadius: 60}}
                />
                <View className="absolute w-20 h-20 rounded-full bg-indigo-200"/>
                <View
                    className="absolute rounded-full bg-indigo-100"
                    style={{width: 50, height: 50, borderRadius: 25}}
                />
                <View className="w-8 h-8 items-center justify-center">
                    <View className="w-5 h-5 bg-white rounded-full shadow-md"/>
                </View>
            </Animated.View>

            <View className="mt-12 flex-row items-center">
                <Text className="text-gray-700 text-lg font-medium">
                    Analyzing your image
                </Text>
                <View className="flex-row ml-1">
                    <Animated.Text style={dot1Style} className="text-2xl text-gray-700 font-bold">
                        .
                    </Animated.Text>
                    <Animated.Text style={dot2Style} className="text-2xl text-gray-700 font-bold">
                        .
                    </Animated.Text>
                    <Animated.Text style={dot3Style} className="text-2xl text-gray-700 font-bold">
                        .
                    </Animated.Text>
                </View>
            </View>

            <Text className="text-gray-400 text-sm mt-4 text-center px-8">
                AI is processing your request
            </Text>
        </View>
    );
}