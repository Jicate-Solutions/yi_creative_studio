'use client'

export function ExamplePostersSection() {
    const examples = [1, 2, 3, 4]

    return (
        <section className="py-20 bg-slate-50/50">
            <div className="container px-4 mx-auto">
                <div className="flex items-center justify-center gap-4 mb-16">
                    <div className="h-px bg-slate-300 w-16 md:w-32" />
                    <h2 className="text-3xl md:text-4xl font-bold text-[#1e3a8a] text-center">
                        Example Event Posters
                    </h2>
                    <div className="h-px bg-slate-300 w-16 md:w-32" />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {examples.map((ex, i) => (
                        <div key={i} className="aspect-[3/4] bg-slate-200/80 border border-slate-300 relative group">
                            {/* Cross Lines for Placeholder Effect */}
                            <div className="absolute inset-0" style={{
                                backgroundImage: 'linear-gradient(to top right, transparent calc(50% - 1px), #94a3b8 calc(50%), transparent calc(50% + 1px)), linear-gradient(to top left, transparent calc(50% - 1px), #94a3b8 calc(50%), transparent calc(50% + 1px))',
                                opacity: 0.2
                            }} />

                            {/* Center Text */}
                            <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-4">
                                <p className="text-slate-500 text-lg font-medium">
                                    Event Poster<br />Example
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    )
}
