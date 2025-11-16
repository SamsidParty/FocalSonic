import { Button } from "@/app/components/ui/button";
import { cn } from "@/lib/utils";
import { Play } from "lucide-react";
import React, { ComponentPropsWithoutRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import CoverArtImage from "../cover-art";

interface Children {
    children: React.ReactNode
}

type RootProps = ComponentPropsWithoutRef<"div">

function Root({ className, children, ...props }: RootProps) {
    return (
        <div className={cn("cursor-default", className)} {...props}>
            {children}
        </div>
    );
}

interface ImageWrapperProps extends Children {
    link: string,
    onClick: () => void,
    className?: string
}

function ImageWrapper({ children, link, onClick, className }: ImageWrapperProps) {
    return (
        <div className={cn("group flex-1 aspect-square rounded bg-border relative overflow-hidden", className)}>
            <Link
                to={link}
                data-testid="card-image-link"
                className="flex h-full w-full cursor-default"
                onClick={onClick}
            >
                {children}
            </Link>
        </div>
    );
}

interface ImageProps {
    src: string
    alt: string
    animationCatalogID?: string
    animationCatalogType?: "songs" | "albums"
    animated?: boolean
}

function Image({ src, alt, animationCatalogID, animationCatalogType, animated }: ImageProps) {
    return (
        <CoverArtImage
            src={src}
            alt={alt}
            animationCatalogID={animationCatalogID}
            animationCatalogType={animationCatalogType}
            animated={animated}
            effect="opacity"
            width="100%"
            height="100%"
            className="aspect-square object-cover w-full h-full absolute inset-0 z-0"
            data-testid="card-image"
        />
    );
}

interface PlayButtonProps {
    onClick: () => void
}

function PlayButton({ onClick }: PlayButtonProps) {
    return (
        <div className="w-full h-full p-2 flex justify-start items-end transition-all duration-300 absolute inset-0 z-10">
            <div className="absolute inset-0 bg-gradient-to-t from-[#00000090] to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300"/>
            <Button
                className="opacity-0 p-2 group-hover:opacity-75 transition-all duration-300 rounded-full w-8 h-8 z-20"
                variant="secondary"
                onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    onClick();
                }}
                data-testid="card-play-button"
            >
                <Play className="fill-foreground hover:scale-125 transition-transform duration-300" />
            </Button>
        </div>
    );
}

interface InfoWrapperProps extends Children {
    className?: string,
    style?: React.CSSProperties
}

function InfoWrapper({ children, className, style }: InfoWrapperProps) {
    return <div className={cn("flex flex-col cursor-default", className)} style={style}>{children}</div>;
}

interface TitleProps {
    link: string
    children: string,
    onClick: () => void
}

function Title({ link, children, onClick }: TitleProps) {
    return (
        <div className="w-full truncate" data-testid="card-title">
            <Link
                to={link}
                className="max-w-full truncate hover:underline leading-7 text-sm font-semibold"
                onClick={onClick}
                data-testid="card-title-link"
            >
                {children}
            </Link>
        </div>
    );
}

interface SubtitleProps {
    link?: string,
    onClick: () => void
    children: React.ReactNode
    enableLink?: boolean
    className?: string
}

function Subtitle({
    link,
    children,
    enableLink = true,
    className,
    onClick
}: SubtitleProps) {

    const navigate = useNavigate();

    return (
        <div onClick={() => { (onClick || (() => {}))(); link && enableLink && navigate(link); }} className="w-full">
            <p
                className={cn(
                    "leading-5 truncate text-xs opacity-60 -mt-1",
                    link && enableLink && "hover:underline cursor-pointer",
                    className,
                )}
                data-testid="card-subtitle"
            >
                {children}
            </p>
        </div>
    );
}

export const PreviewCard = {
    Root,
    ImageWrapper,
    Image,
    PlayButton,
    InfoWrapper,
    Title,
    Subtitle,
};
