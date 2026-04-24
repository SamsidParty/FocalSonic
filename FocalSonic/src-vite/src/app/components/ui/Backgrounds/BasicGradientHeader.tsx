export default function BasicGradientHeader({ bgColor }: { bgColor: string }) {
    return (
        <div
            style={{
                background: `linear-gradient(to bottom, ${bgColor} 0%, color-mix(in oklab, ${bgColor}, black 10%) 100%)`,
                opacity: (!bgColor ? "0" : "0.7"),
                transition: "opacity 1s ease",
            }}
            className="absolute inset-0 w-full h-full"
        />
    );
}