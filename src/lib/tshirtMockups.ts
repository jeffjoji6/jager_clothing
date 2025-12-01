/**
 * T-Shirt Mockup Templates
 * Returns flat t-shirt SVG images (not person wearing) for mockup editor
 */

export const getTShirtMockupImage = (color: string, side: "front" | "back"): string => {
  return generateTShirtSVG(color, side);
};

/**
 * Generate a simple SVG t-shirt mockup - flat t-shirt template
 */
export const generateTShirtSVG = (color: string, side: "front" | "back"): string => {
  const isDark = color.toLowerCase() === "black" || color.toLowerCase().includes("gray") || color.toLowerCase().includes("acid");
  const fillColor = isDark ? "#1a1a1a" : color === "White" ? "#ffffff" : "#808080";
  const strokeColor = isDark ? "#ffffff" : "#000000";
  const strokeWidth = 2;
  
  // Oversized T-shirt SVG - flat view
  const svg = `
    <svg width="600" height="800" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 800">
      <!-- Background -->
      <rect width="600" height="800" fill="${fillColor}" stroke="${strokeColor}" stroke-width="${strokeWidth}"/>
      
      <!-- Oversized T-shirt Front/Back Shape -->
      <g stroke="${strokeColor}" stroke-width="${strokeWidth}" fill="${fillColor}">
        <!-- Main body -->
        <path d="M 150 50 
                 L 200 120 
                 L 400 120 
                 L 450 50
                 L 550 80
                 L 550 750
                 L 50 750
                 L 50 80
                 Z" />
        
        <!-- Left sleeve -->
        <path d="M 50 80 
                 Q 20 100 20 160
                 L 20 200
                 Q 20 240 50 240
                 L 150 120
                 Z" />
        
        <!-- Right sleeve -->
        <path d="M 550 80 
                 Q 580 100 580 160
                 L 580 200
                 Q 580 240 550 240
                 L 450 120
                 Z" />
        
        <!-- Neck opening -->
        <ellipse cx="300" cy="100" rx="60" ry="50" stroke="${strokeColor}" stroke-width="${strokeWidth}" fill="${fillColor}"/>
        
        <!-- Side seams -->
        <line x1="150" y1="120" x2="150" y2="750" stroke="${strokeColor}" stroke-width="${strokeWidth * 0.5}" opacity="0.3"/>
        <line x1="450" y1="120" x2="450" y2="750" stroke="${strokeColor}" stroke-width="${strokeWidth * 0.5}" opacity="0.3"/>
        
        <!-- Bottom hem -->
        <line x1="50" y1="750" x2="550" y2="750" stroke="${strokeColor}" stroke-width="${strokeWidth}"/>
      </g>
      
      ${side === "back" ? `
        <!-- Back label area -->
        <rect x="280" y="140" width="40" height="30" fill="${fillColor}" stroke="${strokeColor}" stroke-width="1" opacity="0.5"/>
        <text x="300" y="160" text-anchor="middle" fill="${strokeColor}" font-family="Arial, sans-serif" font-size="12" opacity="0.5">BACK</text>
      ` : `
        <!-- Chest area indicator (subtle) -->
        <circle cx="300" cy="250" r="3" fill="${strokeColor}" opacity="0.2"/>
      `}
    </svg>
  `.trim();
  
  return `data:image/svg+xml;base64,${btoa(svg)}`;
};

