'use client'

import { Users, Calendar, GraduationCap } from 'lucide-react'

export function WhoCanUseSection() {
    const personas = [
        {
            icon: Users,
            title: 'Yi Chapter Members',
            role: 'Noteable role',
            color: 'bg-[#1D4ED8]', // Blue
        },
        {
            icon: Calendar,
            title: 'Event Coordinators',
            role: 'Noteable role',
            color: 'bg-[#ea580c]', // Orange
        },
        {
            icon: GraduationCap,
            title: 'College Yi Teams',
            role: 'Noteable role',
            color: 'bg-[#94a3b8]', // Grey/Blue-ish
        },
        {
            icon: Users,
            title: 'Community Leaders',
            role: 'Noteable role',
            color: 'bg-[#16a34a]', // Green
        }
    ]

    return (
        <section className="py-20 bg-slate-50/50 relative">
            <div className="container px-4 mx-auto relative z-10">
                <div className="flex items-center justify-center gap-4 mb-16">
                    <div className="h-px bg-slate-300 w-16 md:w-32" />
                    <h2 className="text-3xl md:text-4xl font-bold text-[#1e3a8a] text-center">
                        Who Can Use It?
                    </h2>
                    <div className="h-px bg-slate-300 w-16 md:w-32" />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {personas.map((persona, i) => (
                        <div key={i} className={`${persona.color} p-6 rounded shadow-md flex items-center gap-4 text-white`}>
                            <div className="bg-white/20 p-2.5 rounded shrink-0">
                                <persona.icon className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h3 className="font-bold text-white text-base leading-tight">
                                    {persona.title}
                                </h3>
                                <p className="text-sm text-white/80 mt-0.5">
                                    {persona.role}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    )
}
