/**
 * Style Preview Components
 * Visual representations for each poster style
 */

interface StylePreviewProps {
  className?: string
}

export const StylePreviews: Record<string, React.FC<StylePreviewProps>> = {
  gradient: ({ className = '' }) => (
    <div className={`absolute inset-0 bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500 ${className}`} />
  ),

  flat: ({ className = '' }) => (
    <div className={`absolute inset-0 grid grid-cols-2 grid-rows-2 ${className}`}>
      <div className="bg-blue-500" />
      <div className="bg-yellow-500" />
      <div className="bg-pink-500" />
      <div className="bg-green-500" />
    </div>
  ),

  glass: ({ className = '' }) => (
    <div className={`absolute inset-0 ${className}`}>
      <div className="absolute inset-0 bg-gradient-to-br from-blue-400/20 to-purple-400/20 backdrop-blur-md" />
      <div className="absolute inset-4 border-2 border-white/30 rounded-xl" />
      <div className="absolute inset-8 border border-white/20 rounded-lg" />
    </div>
  ),

  photography: ({ className = '' }) => (
    <div className={`absolute inset-0 bg-gradient-to-br from-slate-700 via-slate-600 to-slate-500 ${className}`}>
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-white/40 rounded-lg">
          <div className="absolute inset-2 border-2 border-white/30" />
        </div>
      </div>
    </div>
  ),

  geometric: ({ className = '' }) => (
    <div className={`absolute inset-0 bg-gradient-to-br from-indigo-500 to-purple-600 ${className}`}>
      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100">
        <polygon points="50,10 90,90 10,90" fill="rgba(255,255,255,0.2)" />
        <polygon points="30,30 70,30 50,70" fill="rgba(255,255,255,0.3)" />
        <circle cx="50" cy="50" r="15" fill="rgba(255,255,255,0.25)" />
      </svg>
    </div>
  ),

  typography: ({ className = '' }) => (
    <div className={`absolute inset-0 bg-gradient-to-br from-slate-900 to-slate-800 ${className}`}>
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-6xl font-black text-white/20 leading-none">Aa</div>
      </div>
      <div className="absolute top-4 left-4 text-4xl font-bold text-white/30">T</div>
      <div className="absolute bottom-4 right-4 text-5xl font-extrabold text-white/25">A</div>
    </div>
  ),

  '3d': ({ className = '' }) => (
    <div className={`absolute inset-0 bg-gradient-to-br from-cyan-500 to-blue-600 ${className}`}>
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="relative w-20 h-20">
          <div className="absolute inset-0 bg-white/30 transform rotate-45 translate-y-2" />
          <div className="absolute inset-0 bg-white/40 transform -rotate-12 translate-x-2" />
          <div className="absolute inset-0 bg-white/50" />
        </div>
      </div>
    </div>
  ),

  illustration: ({ className = '' }) => (
    <div className={`absolute inset-0 bg-gradient-to-br from-amber-200 to-orange-300 ${className}`}>
      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100">
        <path d="M20,50 Q30,30 40,50 T60,50" stroke="rgba(0,0,0,0.3)" strokeWidth="2" fill="none" />
        <circle cx="25" cy="25" r="8" fill="rgba(255,100,100,0.6)" />
        <circle cx="75" cy="75" r="6" fill="rgba(100,100,255,0.6)" />
        <path d="M50,20 L60,40 L40,40 Z" fill="rgba(100,200,100,0.5)" />
      </svg>
    </div>
  ),

  minimalist: ({ className = '' }) => (
    <div className={`absolute inset-0 bg-white ${className}`}>
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-16 h-16 border-4 border-black" />
    </div>
  ),

  neon: ({ className = '' }) => (
    <div className={`absolute inset-0 bg-black ${className}`}>
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-1/2 h-1 bg-pink-500 shadow-[0_0_10px_#ec4899,0_0_20px_#ec4899]" />
        <div className="absolute top-1/2 left-1/4 w-1/2 h-1 bg-cyan-500 shadow-[0_0_10px_#06b6d4,0_0_20px_#06b6d4]" />
        <div className="absolute top-3/4 left-1/4 w-1/2 h-1 bg-purple-500 shadow-[0_0_10px_#a855f7,0_0_20px_#a855f7]" />
      </div>
    </div>
  ),

  duotone: ({ className = '' }) => (
    <div className={`absolute inset-0 ${className}`}>
      <div className="absolute inset-0 bg-blue-600" />
      <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/70 to-transparent" />
      <div className="absolute inset-0 mix-blend-multiply bg-gradient-radial from-transparent to-blue-900/50" />
    </div>
  ),

  watercolor: ({ className = '' }) => (
    <div className={`absolute inset-0 bg-gradient-to-br from-pink-100 to-purple-100 ${className}`}>
      <div className="absolute top-4 left-4 w-24 h-24 rounded-full bg-pink-300/40 blur-xl" />
      <div className="absolute bottom-8 right-8 w-32 h-32 rounded-full bg-purple-300/40 blur-2xl" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-28 h-28 rounded-full bg-blue-300/30 blur-xl" />
    </div>
  ),

  'line-art': ({ className = '' }) => (
    <div className={`absolute inset-0 bg-white ${className}`}>
      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100">
        <circle cx="50" cy="30" r="15" stroke="black" strokeWidth="1.5" fill="none" />
        <path d="M35,45 L50,70 L65,45" stroke="black" strokeWidth="1.5" fill="none" />
        <line x1="50" y1="70" x2="50" y2="85" stroke="black" strokeWidth="1.5" />
        <line x1="40" y1="85" x2="60" y2="85" stroke="black" strokeWidth="1.5" />
      </svg>
    </div>
  ),

  metallic: ({ className = '' }) => (
    <div className={`absolute inset-0 ${className}`}>
      <div className="absolute inset-0 bg-gradient-to-br from-slate-300 via-slate-400 to-slate-500" />
      <div className="absolute inset-0 bg-gradient-to-tl from-transparent via-white/30 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-br from-transparent via-black/20 to-black/30" />
    </div>
  ),

  'paper-cut': ({ className = '' }) => (
    <div className={`absolute inset-0 bg-gradient-to-br from-red-500 to-orange-500 ${className}`}>
      <div className="absolute inset-4 bg-yellow-400 shadow-[0_4px_6px_rgba(0,0,0,0.3)]" />
      <div className="absolute inset-8 bg-pink-400 shadow-[0_6px_8px_rgba(0,0,0,0.4)]" />
      <div className="absolute inset-12 bg-purple-400 shadow-[0_8px_10px_rgba(0,0,0,0.5)]" />
    </div>
  ),

  monochrome: ({ className = '' }) => (
    <div className={`absolute inset-0 bg-gradient-to-br from-black via-gray-600 to-white ${className}`} />
  ),
}

export default StylePreviews
