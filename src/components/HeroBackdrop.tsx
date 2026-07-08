/**
 * Brand hero backdrop — pure SVG, no photo.
 * Dark athletic look: Jäger red speed bands, halftone texture and a giant
 * outlined wordmark. Inline so it inherits the page's Oswald heading font.
 */
export const HeroBackdrop = () => (
    <svg
        className="w-full h-full"
        viewBox="0 0 1920 1080"
        preserveAspectRatio="xMidYMid slice"
        aria-hidden="true"
    >
        <defs>
            <linearGradient id="hero-bg" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#0c0c0e" />
                <stop offset="55%" stopColor="#121316" />
                <stop offset="100%" stopColor="#0a0a0c" />
            </linearGradient>
            <linearGradient id="hero-band" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#8c1a13" />
                <stop offset="50%" stopColor="#af2018" />
                <stop offset="100%" stopColor="#7a150f" />
            </linearGradient>
            <radialGradient id="hero-glow" cx="0.2" cy="0.9" r="0.8">
                <stop offset="0%" stopColor="#af2018" stopOpacity="0.35" />
                <stop offset="60%" stopColor="#af2018" stopOpacity="0.08" />
                <stop offset="100%" stopColor="#af2018" stopOpacity="0" />
            </radialGradient>
            <pattern id="hero-dots" width="26" height="26" patternUnits="userSpaceOnUse">
                <circle cx="2" cy="2" r="1.4" fill="#ffffff" opacity="0.05" />
            </pattern>
        </defs>

        {/* Base */}
        <rect width="1920" height="1080" fill="url(#hero-bg)" />
        <rect width="1920" height="1080" fill="url(#hero-dots)" />

        {/* Speed bands, angled like a jersey sash */}
        <g transform="rotate(-14 960 540)">
            <rect x="-200" y="120" width="2400" height="26" fill="#ffffff" opacity="0.05" />
            <rect x="-200" y="560" width="2400" height="150" fill="url(#hero-band)" opacity="0.9" />
            <rect x="-200" y="722" width="2400" height="34" fill="#af2018" opacity="0.55" />
            <rect x="-200" y="768" width="2400" height="10" fill="#e5402e" opacity="0.5" />
            <rect x="-200" y="940" width="2400" height="60" fill="#ffffff" opacity="0.03" />
        </g>

        {/* Giant outlined wordmark */}
        <text
            x="960"
            y="430"
            textAnchor="middle"
            fontFamily="Oswald, 'Arial Narrow', sans-serif"
            fontWeight="700"
            fontSize="430"
            letterSpacing="18"
            fill="none"
            stroke="#ffffff"
            strokeWidth="2"
            opacity="0.09"
        >
            JÄGER
        </text>
        <text
            x="960"
            y="1010"
            textAnchor="middle"
            fontFamily="Oswald, 'Arial Narrow', sans-serif"
            fontWeight="700"
            fontSize="200"
            letterSpacing="30"
            fill="#ffffff"
            opacity="0.035"
        >
            CHASE · CONQUER · CREATE
        </text>

        {/* Red corner glow + top vignette */}
        <rect width="1920" height="1080" fill="url(#hero-glow)" />
        <rect width="1920" height="220" fill="#000000" opacity="0.35" />
    </svg>
);
