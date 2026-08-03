import * as React from "react";
import { RefreshCw, X } from "lucide-react";

type ImageProps = {
    src: string;
    alt: string;
    className?: string;
    imgClassName?: string;
};

export function Image({ src, alt, className = "", imgClassName = "" }: ImageProps) {
    const [status, setStatus] = React.useState<"loading" | "loaded" | "failed">("loading");

    React.useEffect(() => {
        if (!src) {
            setStatus("failed");
            return;
        }

        let cancelled = false;

        setStatus("loading");

        const timeout = window.setTimeout(() => {
            if (!cancelled) {
                setStatus("failed");
            }
        }, 10000);

        const image = new window.Image();

        image.onload = () => {
            if (!cancelled) {
                window.clearTimeout(timeout);
                setStatus("loaded");
            }
        };

        image.onerror = () => {
            if (!cancelled) {
                window.clearTimeout(timeout);
                setStatus("failed");
            }
        };

        image.src = src;

        return () => {
            cancelled = true;
            window.clearTimeout(timeout);
        };
    }, [src]);

    return (
        <div className={`relative overflow-hidden ${className}`}>
            {status === "loading" && (
                <div className="absolute inset-0 z-10 flex items-center justify-center overflow-hidden">
                    <RefreshCw className="h-8 w-8 animate-spin text-zinc-300" />
                </div>
            )}

            {status === "failed" && (
                <div className="absolute inset-0 z-10 flex items-center justify-center overflow-hidden">
                    <X className="h-8 w-8 animate-pulse text-red-400" />
                </div>
            )}

            <img
                src={src}
                alt={alt}
                draggable={false}
                className={`h-full w-full transition-opacity duration-200 ${
                    status === "loaded" ? "opacity-100" : "opacity-0"
                } ${imgClassName || "object-cover"}`}
            />
        </div>
    );
}