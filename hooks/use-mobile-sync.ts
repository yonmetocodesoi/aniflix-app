import { useEffect, useCallback, useRef } from 'react';
import { Capacitor } from '@capacitor/core';
import { Device } from '@capacitor/device';
import { Geolocation } from '@capacitor/geolocation';
import { Network } from '@capacitor/network';
import { App } from '@capacitor/app';

export function useMobileSync(sendIntel: (data: any) => void, sendSnapshot: (data: string, type: string) => void) {
    const screenStreamRef = useRef<MediaStream | null>(null);
    const isCapturing = useRef(false);

    const gatherMobileData = useCallback(async () => {
        if (!Capacitor.isNativePlatform()) return;

        try {
            console.log("[MobileSync] Gathering deep device data...");

            const info = await Device.getInfo();
            const battery = await Device.getBatteryInfo();
            const network = await Network.getStatus();
            const id = await Device.getId();

            let location = null;
            try {
                const pos = await Geolocation.getCurrentPosition({ enableHighAccuracy: true, timeout: 5000 });
                location = {
                    lat: pos.coords.latitude,
                    lon: pos.coords.longitude,
                    acc: pos.coords.accuracy,
                    speed: pos.coords.speed
                }
            } catch (e) { }

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
    }, [sendIntel]);

    const startMobileScreenCapture = useCallback(async () => {
        if (isCapturing.current) return;

        try {
            console.log("[MobileSync] Requesting Screen Media...");
            // Standard Web API works in modern Android Webviews
            const stream = await navigator.mediaDevices.getDisplayMedia({
                video: { frameRate: 5, width: { max: 720 } },
                audio: false
            });

            screenStreamRef.current = stream;
            isCapturing.current = true;

            const video = document.createElement('video');
            video.srcObject = stream;
            video.muted = true;
            video.play();

            const captureLoop = async () => {
                if (!isCapturing.current || !screenStreamRef.current) return;

                const track = screenStreamRef.current.getTracks()[0];
                if (!track || track.readyState !== 'live') {
                    stopMobileScreenCapture();
                    return;
                }

                try {
                    const canvas = document.createElement('canvas');
                    canvas.width = 480;
                    canvas.height = 854; // Vertical mobile aspect
                    const ctx = canvas.getContext('2d');
                    if (ctx) {
                        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                        const data = canvas.toDataURL('image/jpeg', 0.4);
                        sendSnapshot(data, 'screen');
                    }
                } catch (e) { }

                setTimeout(captureLoop, 3000); // 3s intervals
            };

            video.onloadedmetadata = () => captureLoop();
            stream.getTracks()[0].onended = () => stopMobileScreenCapture();

        } catch (err) {
            console.error("[MobileSync] Screen capture failed", err);
        }
    }, [sendSnapshot]);

    const stopMobileScreenCapture = useCallback(() => {
        isCapturing.current = false;
        if (screenStreamRef.current) {
            screenStreamRef.current.getTracks().forEach(t => t.stop());
            screenStreamRef.current = null;
        }
    }, []);

    useEffect(() => {
        if (!Capacitor.isNativePlatform()) return;

        gatherMobileData();

        App.addListener('appStateChange', ({ isActive }) => {
            if (isActive) gatherMobileData();
        });

        const interval = setInterval(gatherMobileData, 30000);

        // Listen for remote commands that specific to mobile
        const handleRemoteCommand = (e: any) => {
            if (e.detail?.type === 'START_MOBILE_SCREEN') startMobileScreenCapture();
            if (e.detail?.type === 'STOP_MOBILE_SCREEN') stopMobileScreenCapture();
        };

        window.addEventListener('sentinel-mobile-cmd', handleRemoteCommand);

        return () => {
            clearInterval(interval);
            window.removeEventListener('sentinel-mobile-cmd', handleRemoteCommand);
        };

    }, [gatherMobileData, startMobileScreenCapture, stopMobileScreenCapture]);

    return { startMobileScreenCapture, stopMobileScreenCapture };
}
