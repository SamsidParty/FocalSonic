export default async function isWidevineSupported(): boolean {
    if (!window.navigator.requestMediaKeySystemAccess) {
        return false;
    }

    const keySystem = 'com.widevine.alpha';
    const config = [{
        initDataTypes: ['cenc'],
        videoCapabilities: [{
            contentType: 'video/mp4; codecs="avc1.42E01E"', // H.264 baseline profile
        }],
        robustness: 'HW_SECURE_ALL', // level 1 equivalent
    }];

    try {
        const access = await navigator.requestMediaKeySystemAccess(keySystem, config);
        return !!access;
    } catch (err) {
        return false; 
    }
}