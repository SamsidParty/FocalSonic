import { MD5 } from "crypto-js";

export const saltWord = "samsidparty-0ff00ffd-4f81-4fa1-a314-cc2b0f29b4fb";

export function genPasswordToken(password: string) {
    return MD5(`${password}${saltWord}`).toString();
}

export function genEncodedPassword(password: string) {
    return `enc:${toHex(password)}`;
}

export function toHex(s: string) {
    return s
        .split("")
        .map((c) => c.charCodeAt(0).toString(16))
        .join("");
}
