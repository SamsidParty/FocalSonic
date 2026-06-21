export default function BlurredHeader({ bgImage, loaded }: { bgImage: string, loaded: boolean }) {
    return (
        <div
            style={{
                backgroundImage: `url(${bgImage})`,        
                backgroundRepeat: "repeat-y",
                backgroundSize: "100% auto",
                transition: "opacity 1s ease",
                animation: "blurredHeaderAnimation 15s ease-in-out infinite",
            }}
            className={`absolute inset-0 w-full h-full blur-3xl ${!loaded ? "opacity-0" : "opacity-70"}`}
        />
    );
}