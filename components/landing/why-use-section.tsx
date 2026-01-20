'use client'

export function WhyUseSection() {
    const benefits = [
        "Benefit or reason",
        "Benefit or reason",
        "Benefit",
        "Benefit or reason"
    ]

    return (
        <section className="py-20 bg-slate-50/50">
            <div className="container px-4 mx-auto">
                {/* Header - Centered with Lines */}
                <div className="flex items-center justify-center gap-4 mb-8">
                    <div className="h-px bg-slate-300 w-16 md:w-32" />
                    <h2 className="text-2xl md:text-3xl font-bold text-[#1e3a8a] text-center">
                        Why Use This Tool?
                    </h2>
                    <div className="h-px bg-slate-300 w-16 md:w-32" />
                </div>

                {/* Subtext */}
                <p className="text-slate-600 max-w-3xl mx-auto text-center leading-relaxed mb-12">
                    Short explainer about how Young Indians chapters can easily create professional posters for their events with the app.
                </p>

                {/* Bullets Row */}
                <div className="flex flex-wrap items-center justify-center gap-x-12 gap-y-6 bg-slate-100/50 py-8 rounded-xl">
                    {benefits.map((benefit, i) => (
                        <div key={i} className="flex items-center gap-3">
                            <div className="w-2.5 h-2.5 rounded-full bg-green-500" />
                            <span className="text-slate-600 font-medium">{benefit}</span>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    )
}
