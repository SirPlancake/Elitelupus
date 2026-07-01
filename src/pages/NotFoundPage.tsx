import * as ReactRouter from "react-router-dom";
import * as Lucide from "lucide-react";

export default function Page() {
    const Navigate = ReactRouter.useNavigate();

    function PreviousPage() {
        if (window.history.length > 1) {
            Navigate(-1);
            return;
        };

        Navigate("/", {
            replace: true
        });
    };

    return (
        <main className="relative flex min-h-full w-full items-center justify-center overflow-hidden text-white">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(99,102,241,0.22),transparent_38%)]" />
            <div className="absolute left-1/2 top-1/2 h-72 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full bg-indigo-500/10 blur-3xl" />

            <section className="relative mx-auto flex w-full max-w-2xl flex-col items-center px-6 py-16 text-center">
                <h1 className="bg-linear-to-b from-indigo-300 to-indigo-400 bg-clip-text text-6xl font-black tracking-tight text-transparent sm:text-7xl">
                    Uh oh!
                </h1>

                <p className="mt-5 max-w-md text-sm leading-6 text-zinc-400 sm:text-base">
                    The page you're looking for does not exist, was moved, or the link is broken. Please try again later or click one of the buttons below to continue elsewhere.
                </p>

                <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                    <ReactRouter.Link to="/" className="inline-flex items-center justify-center gap-2 rounded-lg border border-indigo-500/40 bg-indigo-500/10 px-5 py-2.5 text-sm font-semibold text-indigo-200 transition hover:border-indigo-400/70 hover:bg-indigo-500/20 hover:text-white">
                        <Lucide.Home className="h-4 w-4" />
                        Go Home
                    </ReactRouter.Link>

                    <button type="button" onClick={PreviousPage} className="cursor-pointer inline-flex items-center justify-center gap-2 rounded-lg border border-zinc-800 bg-zinc-900/80 px-5 py-2.5 text-sm font-semibold text-zinc-300 transition hover:border-white/10 hover:bg-white/10 hover:text-white">
                        <Lucide.ArrowLeft className="h-4 w-4" />
                        Go Back
                    </button>
                </div>
            </section>
        </main>
    );
};