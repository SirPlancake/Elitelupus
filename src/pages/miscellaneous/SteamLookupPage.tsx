export default function Page() {
    return (
        <main className="relative flex min-h-full w-full items-center justify-center overflow-hidden text-white">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(99,102,241,0.22),transparent_38%)]" />
            <div className="absolute left-1/2 top-1/2 h-72 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full bg-indigo-500/10 blur-3xl" />

            <section className="relative mx-auto flex w-full max-w-2xl flex-col items-center px-6 py-16 text-center">
                <h1 className="bg-linear-to-b from-indigo-300 to-indigo-400 bg-clip-text text-6xl font-black tracking-tight text-transparent sm:text-7xl">
                    Under Construction!
                </h1>

                <p className="mt-5 max-w-md text-sm leading-6 text-zinc-400 sm:text-base">
                    Seems like you've found a page that is under construction. Who knows when <a className="font-mono">/steam-lookup</a> will be functional.
                </p>
            </section>
        </main>
    );
};