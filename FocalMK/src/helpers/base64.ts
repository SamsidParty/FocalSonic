export function uint8ArrayToBase64(buffer: Uint8Array): string {
    if (buffer.toBase64) {
        return buffer.toBase64();
    }

    let binary = "";
    const len = buffer.byteLength;
    for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(buffer[i]);
    }
    return btoa(binary);
}

export function base64ToUint8Array(base64: string): Uint8Array {
    if (Uint8Array.fromBase64) {
        return Uint8Array.fromBase64(base64);
    }

    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
}