export default function BlurredHeader({ bgImage, loaded }: { bgImage: string, loaded: boolean }) {
    return (
        <div
            style={{
                backgroundImage: `url(${bgImage})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
                transition: "opacity 1s ease",
            }}
            className={`absolute inset-0 w-full h-full blur-3xl ${!loaded ? "opacity-0" : "opacity-70"}`}
        />
    );
}