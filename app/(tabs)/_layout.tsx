import {Stack} from "expo-router";

export default function TabLayout() {
    return (
        <Stack
            screenOptions={{
                headerShown: false,
                animation: 'slide_from_right',
            }}
        >
            <Stack.Screen name="index" options={{headerShown: false}}/>
            <Stack.Screen name="gallery" options={{headerShown: false}}/>
            <Stack.Screen name="review" options={{headerShown: false}}/>
            <Stack.Screen name="price-loading" options={{headerShown: false}}/>
            <Stack.Screen name="price-selection" options={{headerShown: false}}/>
            <Stack.Screen name="create-listing" options={{headerShown: false}}/>
        </Stack>
    )
}