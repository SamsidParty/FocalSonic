/** Whether a URL is an S3 presigned one (Apple serves a new one, with a new signature, on every fetch). */
export function isPresignedUrl(url?: string): boolean {
    return !!url && url.includes("X-Amz-Credential=");
}

/** Whether a presigned URL is past (or within 60s of) its X-Amz-Date + X-Amz-Expires. */
export function isPresignedExpired(url: string): boolean {
    try {
        const params = new URL(url).searchParams;
        const date = params.get("X-Amz-Date"); // YYYYMMDDTHHMMSSZ
        const expires = Number(params.get("X-Amz-Expires"));
        if (!date || !Number.isFinite(expires)) return true;
        const iso = `${date.slice(0, 4)}-${date.slice(4, 6)}-${date.slice(6, 8)}`
            + `T${date.slice(9, 11)}:${date.slice(11, 13)}:${date.slice(13, 15)}Z`;
        const start = Date.parse(iso);
        if (Number.isNaN(start)) return true;
        return Date.now() > start + expires * 1000 - 60_000;
    } catch {
        return true;
    }
}
