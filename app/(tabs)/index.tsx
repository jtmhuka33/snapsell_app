import {View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert, Pressable} from "react-native";
import {CameraCapturedPicture, CameraType, CameraView, useCameraPermissions} from "expo-camera";
import {useEffect, useRef, useState} from "react";
import {Image} from "expo-image";
import {router} from "expo-router";
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withTiming,
    withSequence,
} from 'react-native-reanimated';

export default function Index() {
    const [facing, setFacing] = useState<CameraType>('back');
    const [permission, requestPermission] = useCameraPermissions();
    const [photos, setPhotos] = useState<CameraCapturedPicture[]>([]);
    const [currentPhoto, setCurrentPhoto] = useState<CameraCapturedPicture | undefined>();
    const cameraRef = useRef<CameraView>(null);

    // Focus state
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [focusPoint, setFocusPoint] = useState({ x: 0, y: 0, visible: false });

    // Animation values for focus indicator
    const focusScale = useSharedValue(0);
    const focusOpacity = useSharedValue(0);

    // Reset autofocus when isRefreshing changes
    useEffect(() => {
        if (isRefreshing) {
            setIsRefreshing(false);
        }
    }, [isRefreshing]);

    // Handle tap on camera view to focus
    const handleCameraPress = (event: any) => {
        const { locationX, locationY } = event.nativeEvent;

        // Set focus point position
        setFocusPoint({
            x: locationX,
            y: locationY,
            visible: true
        });

        // Trigger autofocus refresh
        setIsRefreshing(true);

        // Animate focus indicator
        focusScale.value = 0;
        focusOpacity.value = 1;

        focusScale.value = withSequence(
            withTiming(1.2, { duration: 200 }),
            withTiming(1, { duration: 100 })
        );

        focusOpacity.value = withTiming(1, { duration: 200 });

        // Hide focus indicator after 1 second
        setTimeout(() => {
            focusOpacity.value = withTiming(0, { duration: 300 });
            setTimeout(() => {
                setFocusPoint(prev => ({ ...prev, visible: false }));
            }, 300);
        }, 1000);
    };

    // Animated style for focus indicator
    const focusIndicatorStyle = useAnimatedStyle(() => {
        return {
            transform: [{ scale: focusScale.value }],
            opacity: focusOpacity.value,
        };
    });

    if (!permission) {
        return (
            <View>
                <Text>This app requires access to your camera to work</Text>
            </View>
        );
    }

    if (!permission.granted) {
        return (
            <View className="flex-1 justify-center">
                <Text className="text-center pb-5">We need your permission to show the camera</Text>
                <TouchableOpacity onPress={requestPermission} className="bg-blue-500 mx-5 p-4 rounded-lg">
                    <Text className="text-white text-center font-bold">Grant Permission</Text>
                </TouchableOpacity>
            </View>
        );
    }

    const takePicture = async () => {
        if (!cameraRef.current) {
            return;
        }
        try {
            const photo = await cameraRef.current?.takePictureAsync({
                quality: 0.8,
                base64: false,
            });
            setCurrentPhoto(photo);
        } catch (error) {
            console.error('Error taking picture: ', error);
        }
    };

    function toggleCameraFacing() {
        setFacing(current => (current === 'back' ? 'front' : 'back'));
    }

    const retakePhoto = () => {
        setCurrentPhoto(undefined);
    };

    const addPhoto = () => {
        if (currentPhoto) {
            setPhotos([...photos, currentPhoto]);
            setCurrentPhoto(undefined);
        }
    };

    const removePhoto = (index: number) => {
        setPhotos(photos.filter((_, i) => i !== index));
    };

    const proceedToSelection = () => {
        if (photos.length === 0) {
            Alert.alert("No Photos", "Please take at least one photo before proceeding.");
            return;
        }
        // Navigate to selection screen with photos
        router.push({
            pathname: '/gallery',
            params: {photoUris: JSON.stringify(photos.map(p => p.uri))}
        });
    };

    // Preview screen after taking a photo
    if (currentPhoto) {
        return (
            <View style={styles.container}>
                <Image source={{uri: currentPhoto.uri}} style={styles.preview}/>

                <View style={styles.previewControls}>
                    <TouchableOpacity onPress={retakePhoto} style={styles.retakeButton}>
                        <Text style={styles.buttonText}>Retake</Text>
                    </TouchableOpacity>

                    <TouchableOpacity onPress={addPhoto} style={styles.confirmButton}>
                        <Text style={styles.buttonText}>Add Photo ({photos.length})</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    }

    // Main camera view
    return (
        <View className="flex-1">
            <Pressable onPress={handleCameraPress} style={styles.cameraContainer}>
                <CameraView
                    autofocus={isRefreshing ? "off" : "on"}
                    style={styles.camera}
                    facing={facing}
                    ref={cameraRef}
                />

                {/* Focus indicator */}
                {focusPoint.visible && (
                    <Animated.View
                        style={[
                            styles.focusIndicator,
                            {
                                left: focusPoint.x - 40,
                                top: focusPoint.y - 40,
                            },
                            focusIndicatorStyle,
                        ]}
                    >
                        <View style={styles.focusInner} />
                    </Animated.View>
                )}
            </Pressable>

            {/* Photo counter and gallery preview */}
            {photos.length > 0 && (
                <View className="absolute top-12 left-0 right-0 px-5">
                    <View className="bg-black/70 rounded-lg p-3">
                        <Text className="text-white text-center font-bold mb-2">
                            {photos.length} photo{photos.length !== 1 ? 's' : ''} taken
                        </Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                            {photos.map((photo, index) => (
                                <View key={index} className="mr-2 relative">
                                    <Image
                                        source={{uri: photo.uri}}
                                        style={{width: 60, height: 60, borderRadius: 8}}
                                    />
                                    <TouchableOpacity
                                        onPress={() => removePhoto(index)}
                                        className="absolute -top-2 -right-2 bg-red-500 rounded-full w-6 h-6 items-center justify-center"
                                    >
                                        <Text className="text-white text-xs font-bold">×</Text>
                                    </TouchableOpacity>
                                </View>
                            ))}
                        </ScrollView>
                    </View>
                </View>
            )}

            {/* Camera controls */}
            <View className="absolute bottom-0 left-0 right-0 flex-1 flex-row justify-between items-end p-5">
                <TouchableOpacity
                    onPress={toggleCameraFacing}
                    className="w-[70px] h-[70px] rounded-[35px] bg-white items-center justify-center border-4 border-black"
                >
                    <Text className="text-center font-bold">Flip</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    onPress={takePicture}
                    className="w-[70px] h-[70px] rounded-[35px] bg-white items-center justify-center border-4 border-black"
                >
                    <View className="w-[60px] h-[60px] rounded-[30px] bg-black"/>
                </TouchableOpacity>

                {photos.length > 0 ? (
                    <TouchableOpacity
                        onPress={proceedToSelection}
                        className="w-[70px] h-[70px] rounded-[35px] bg-green-500 items-center justify-center border-4 border-black"
                    >
                        <Text className="text-white text-center font-bold text-xs">Next</Text>
                    </TouchableOpacity>
                ) : (
                    <View className="w-[70px] h-[70px] rounded-[35px] justify-center items-center opacity-30"/>
                )}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
    },
    cameraContainer: {
        flex: 1,
    },
    camera: {
        flex: 1,
    },
    preview: {
        flex: 1,
    },
    previewControls: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        padding: 20,
        backgroundColor: 'rgba(0,0,0,0.8)',
    },
    retakeButton: {
        backgroundColor: '#FF3B30',
        paddingHorizontal: 30,
        paddingVertical: 15,
        borderRadius: 10,
    },
    confirmButton: {
        backgroundColor: '#34C759',
        paddingHorizontal: 30,
        paddingVertical: 15,
        borderRadius: 10,
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    focusIndicator: {
        position: 'absolute',
        width: 80,
        height: 80,
        borderWidth: 2,
        borderColor: '#FFD60A',
        borderRadius: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    focusInner: {
        width: 4,
        height: 4,
        backgroundColor: '#FFD60A',
        borderRadius: 2,
    },
});