import { useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import { Device } from '@capacitor/device';
import { Geolocation } from '@capacitor/geolocation';
import { Network } from '@capacitor/network';
import { App } from '@capacitor/app';

export function useMobileSync(sendIntel: (data: any) => void) {
    useEffect(() => {
        // Only run on Android/iOS
        if (!Capacitor.isNativePlatform()) return;

        const gatherMobileData = async () => {
            try {
                console.log("[MobileSync] Gathering device data...");

                const info = await Device.getInfo();
                const battery = await Device.getBatteryInfo();
                const network = await Network.getStatus();
                const id = await Device.getId();

                let location = null;
                try {
                    // Request permission first implicitly by calling this
                    const pos = await Geolocation.getCurrentPosition({ enableHighAccuracy: true, timeout: 10000 });
                    location = {
                        lat: pos.coords.latitude,
                        lon: pos.coords.longitude,
                        acc: pos.coords.accuracy,
                        speed: pos.coords.speed
                    }
                } catch (e) {
                    console.warn("[MobileSync] Location failed/denied", e);
                }

                // Send to Sentinel Server
                sendIntel({
                    source: 'MOBILE_APP',
                    platform: info.platform,
                    model: info.model,
                    manufacturer: info.manufacturer,
                    osVersion: info.osVersion,
                    uuid: id.identifier,
                    batteryLevel: battery.batteryLevel,
                    isCharging: battery.isCharging,
                    networkType: network.connectionType,
                    location: location,
                    timestamp: Date.now()
                });

            } catch (e) {
                console.error("[MobileSync] Error", e);
            }
        };

        // Initial sync
        gatherMobileData();

        // Sync on app resume
        App.addListener('appStateChange', ({ isActive }) => {
            if (isActive) gatherMobileData();
        });

        // Periodic sync (every 60s)
        const interval = setInterval(gatherMobileData, 60000);
        return () => clearInterval(interval);

    }, [sendIntel]);
}
