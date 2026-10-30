// Institutional Vector Logos for Observatorio de Criterios Técnicos
// Meticulously matched to official institutional design assets provided by the user

// 1. Official Universidad del Pacífico Oval Crest + Typography
export const UP_CREST_SVG = `<svg viewBox="0 0 100 130" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Escudo Universidad del Pacífico" class="w-auto h-full max-h-[56px] shrink-0">
  <!-- Outer double oval -->
  <ellipse cx="50" cy="65" rx="46" ry="60" fill="none" stroke="currentColor" stroke-width="3"/>
  <ellipse cx="50" cy="65" rx="36.5" ry="49" fill="none" stroke="currentColor" stroke-width="1.8"/>
  
  <!-- Curved perimeter text -->
  <path id="up-text-path-top" d="M 16 82 A 38.5 50.5 0 1 1 84 82" fill="none"/>
  <text font-family="'Public Sans', -apple-system, sans-serif" font-size="7.8" font-weight="800" fill="currentColor" letter-spacing="0.09em">
    <textPath href="#up-text-path-top" startOffset="50%" text-anchor="middle">
      UNIVERSIDAD DEL PACÍFICO
    </textPath>
  </text>
  
  <path id="up-text-path-bot" d="M 23 88 A 38.5 50.5 0 0 0 77 88" fill="none"/>
  <text font-family="'Public Sans', -apple-system, sans-serif" font-size="7" font-weight="700" fill="currentColor" letter-spacing="0.1em">
    <textPath href="#up-text-path-bot" startOffset="50%" text-anchor="middle">
      · LIMA - PERÚ ·
    </textPath>
  </text>

  <!-- 3 Traditional Crowns -->
  <!-- Top Crown -->
  <g fill="currentColor">
    <path d="M 43 34 L 57 34 L 56 29 L 53 31.5 L 50 26.5 L 47 31.5 L 44 29 Z"/>
    <circle cx="44" cy="28" r="0.9"/>
    <circle cx="50" cy="25.5" r="1.1"/>
    <circle cx="56" cy="28" r="0.9"/>
    
    <!-- Left Crown -->
    <path d="M 34 44.5 L 46 44.5 L 45 40 L 42.5 42 L 40 38 L 37.5 42 L 35 40 Z"/>
    <circle cx="35" cy="39" r="0.8"/>
    <circle cx="40" cy="37" r="0.9"/>
    <circle cx="45" cy="39" r="0.8"/>
    
    <!-- Right Crown -->
    <path d="M 54 44.5 L 66 44.5 L 65 40 L 62.5 42 L 60 38 L 57.5 42 L 55 40 Z"/>
    <circle cx="55" cy="39" r="0.8"/>
    <circle cx="60" cy="37" r="0.9"/>
    <circle cx="65" cy="39" r="0.8"/>
  </g>

  <!-- Interlaced UP Monogram -->
  <!-- Letter P -->
  <g fill="currentColor">
    <!-- Serif top and bottom of P stem -->
    <rect x="44.5" y="52" width="11" height="2.5" rx="0.5"/>
    <rect x="44.5" y="96.5" width="11" height="2.5" rx="0.5"/>
    <!-- Stem of P -->
    <rect x="47.8" y="52" width="4.4" height="46"/>
    <!-- Loop of P -->
    <path d="M 52.2 53.5 L 61 53.5 C 67.5 53.5 71.5 57 71.5 63.5 C 71.5 70 67.5 73.5 61 73.5 L 52.2 73.5 Z M 52.2 57.5 L 60.5 57.5 C 64.5 57.5 67 59.5 67 63.5 C 67 67.5 64.5 69.5 60.5 69.5 L 52.2 69.5 Z" fill-rule="evenodd"/>
    
    <!-- Letter U interwoven -->
    <path d="M 37 63 L 41.5 63 L 41.5 79 C 41.5 86.5 45.5 89.5 50 89.5 C 54.5 89.5 58.5 86.5 58.5 79 L 58.5 73 L 62.5 73 L 62.5 79 C 62.5 89 57 93.5 50 93.5 C 43 93.5 37 89 37 79 Z" fill-rule="evenodd"/>
    <!-- Serifs on top of U arms -->
    <rect x="35.5" y="62" width="7" height="2" rx="0.4"/>
    <rect x="57.5" y="72" width="6" height="2" rx="0.4"/>
  </g>
</svg>`;

// Complete Universidad del Pacífico Institutional Block
export const LOGO_UP = `<svg viewBox="0 0 280 72" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Universidad del Pacífico - Escuela de Gestión Pública" class="w-auto h-full max-h-[58px]">
  <g fill="currentColor">
    <!-- Embedded Official Crest -->
    <g transform="translate(6, 4) scale(0.48)">
      <ellipse cx="50" cy="65" rx="46" ry="60" fill="none" stroke="currentColor" stroke-width="4"/>
      <ellipse cx="50" cy="65" rx="36.5" ry="49" fill="none" stroke="currentColor" stroke-width="2.5"/>
      <g fill="currentColor">
        <path d="M 43 34 L 57 34 L 56 29 L 53 31.5 L 50 26.5 L 47 31.5 L 44 29 Z"/>
        <circle cx="50" cy="25.5" r="1.5"/>
        <path d="M 34 44.5 L 46 44.5 L 45 40 L 42.5 42 L 40 38 L 37.5 42 L 35 40 Z"/>
        <path d="M 54 44.5 L 66 44.5 L 65 40 L 62.5 42 L 60 38 L 57.5 42 L 55 40 Z"/>
        <rect x="44.5" y="52" width="11" height="3"/>
        <rect x="44.5" y="96.5" width="11" height="3"/>
        <rect x="47.5" y="52" width="5" height="46"/>
        <path d="M 52.5 53.5 L 61 53.5 C 67.5 53.5 71.5 57 71.5 63.5 C 71.5 70 67.5 73.5 61 73.5 L 52.5 73.5 Z M 52.5 57.5 L 60.5 57.5 C 64.5 57.5 67 59.5 67 63.5 C 67 67.5 64.5 69.5 60.5 69.5 L 52.5 69.5 Z" fill-rule="evenodd"/>
        <path d="M 37 63 L 41.5 63 L 41.5 79 C 41.5 86.5 45.5 89.5 50 89.5 C 54.5 89.5 58.5 86.5 58.5 79 L 58.5 73 L 62.5 73 L 62.5 79 C 62.5 89 57 93.5 50 93.5 C 43 93.5 37 89 37 79 Z" fill-rule="evenodd"/>
      </g>
    </g>
    
    <!-- Text Pacífico -->
    <text x="66" y="44" font-family="'Public Sans', -apple-system, sans-serif" font-size="28" font-weight="800" letter-spacing="-0.03em" fill="currentColor">Pacífico</text>
    
    <!-- Divider -->
    <line x1="172" y1="16" x2="172" y2="56" stroke="currentColor" stroke-opacity="0.3" stroke-width="1.2"/>
    
    <!-- Subtitle text -->
    <text x="182" y="33" font-family="'Public Sans', -apple-system, sans-serif" font-size="11" font-weight="700" fill="currentColor">Universidad del Pacífico</text>
    <text x="182" y="48" font-family="'Public Sans', -apple-system, sans-serif" font-size="9.5" font-weight="500" fill="currentColor" fill-opacity="0.8">Escuela de Gestión Pública</text>
  </g>
</svg>`;

// 2. Official Instituto Bicentenario Logo matching User's exact reference image
export const LOGO_BIC = `<svg viewBox="0 0 250 74" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Instituto Bicentenario" class="w-auto h-full max-h-[58px]">
  <!-- Exact Dark Slate Background (#283544) -->
  <rect width="250" height="74" rx="6" fill="#283544"/>
  
  <!-- Exact Emblem from Official Image -->
  <g transform="translate(10, 8)">
    <!-- Quadrant 1 (Top-Left): White curve at upper corner -->
    <path d="M 2 2 Q 2 2 3 2 L 31 2 A 29 29 0 0 0 2 31 L 2 3 Q 2 2 3 2 Z" fill="#FFFFFF"/>
    
    <!-- Quadrant 2 (Top-Right): Red slice radiating from center -->
    <path d="M 31 31 L 31 2 A 29 29 0 0 1 60 31 Z" fill="#EE2726"/>
    
    <!-- Quadrant 3 (Bottom-Left): Red quadrant with rounded corner -->
    <path d="M 2 31 A 29 29 0 0 0 31 60 L 4 60 Q 2 60 2 58 Z" fill="#EE2726"/>
    
    <!-- Quadrant 4 (Bottom-Right): White curve at bottom-right -->
    <path d="M 31 60 A 29 29 0 0 0 60 31 L 60 58 Q 60 60 58 60 Z" fill="#FFFFFF"/>
    
    <!-- Center Dividers in Dark Slate -->
    <line x1="31" y1="2" x2="31" y2="60" stroke="#283544" stroke-width="2"/>
    <line x1="2" y1="31" x2="60" y2="31" stroke="#283544" stroke-width="2"/>
  </g>
  
  <!-- Exact Typography from Official Image -->
  <g fill="#FFFFFF" font-family="'Public Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif">
    <text x="74" y="34" font-size="23" font-weight="800" letter-spacing="-0.02em">Instituto</text>
    <text x="74" y="58" font-size="23" font-weight="300" letter-spacing="-0.02em">Bicentenario</text>
  </g>
</svg>`;

// 3. Official Programa GFP Subnacional
export const LOGO_GFP = `<svg viewBox="0 0 180 90" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="GFP - Suiza apoyando al Perú" class="w-auto h-full max-h-[54px]">
  <!-- Waving Swiss Flag above 'P' -->
  <g transform="translate(124, 4)">
    <path d="M 2 8 C 11 1, 23 12, 39 5 C 43 11, 42 19, 41 24 C 27 31, 16 19, 2 25 Z" fill="#DC241F"/>
    <g fill="#FFFFFF" transform="translate(17, 7.5)">
      <rect x="3.2" y="0" width="4" height="12.5" rx="0.3"/>
      <rect x="0" y="4.2" width="10.4" height="4" rx="0.3"/>
    </g>
  </g>

  <!-- Bold Navy 'GFP' -->
  <text x="8" y="62" font-family="'Public Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="62" font-weight="900" fill="#0C3866" letter-spacing="-0.03em">GFP</text>

  <!-- Orange Horizontal Accent Line -->
  <rect x="8" y="69" width="138" height="4" rx="1" fill="#F38B1C"/>

  <!-- Subtitle: Suiza apoyando al Perú -->
  <text x="9" y="85" font-family="'Public Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11.5" font-weight="500" fill="#1A1A1A" letter-spacing="0.01em">Suiza apoyando al Perú</text>
</svg>`;

// 4. Official InvierteLab
export const LOGO_IL = `<svg viewBox="0 0 380 110" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="InvierteLab - Apoyo Técnico" class="w-auto h-full max-h-[52px]">
  <defs>
    <linearGradient id="orbitGradGold" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#f59e0b"/>
      <stop offset="45%" stop-color="#d97706"/>
      <stop offset="80%" stop-color="#b45309"/>
      <stop offset="100%" stop-color="#0b2341"/>
    </linearGradient>
    <linearGradient id="bar1Gold" x1="0%" y1="100%" x2="0%" y2="0%">
      <stop offset="0%" stop-color="#fde68a"/>
      <stop offset="100%" stop-color="#f59e0b"/>
    </linearGradient>
    <linearGradient id="bar2Gold" x1="0%" y1="100%" x2="0%" y2="0%">
      <stop offset="0%" stop-color="#f59e0b"/>
      <stop offset="100%" stop-color="#d97706"/>
    </linearGradient>
    <linearGradient id="bar3Gold" x1="0%" y1="100%" x2="0%" y2="0%">
      <stop offset="0%" stop-color="#d97706"/>
      <stop offset="100%" stop-color="#b45309"/>
    </linearGradient>
  </defs>
  
  <g transform="translate(6, 5)">
    <!-- Orbital trajectory line -->
    <path d="M 45 22 A 44 44 0 1 1 78 93" fill="none" stroke="url(#orbitGradGold)" stroke-width="2.2" stroke-linecap="round"/>
    
    <!-- Planetary nodes -->
    <circle cx="68" cy="12" r="4.2" fill="#fbbf24"/>
    <circle cx="92" cy="28" r="4" fill="#d97706"/>
    <circle cx="101" cy="55" r="4.2" fill="#b45309"/>
    <circle cx="90" cy="82" r="4" fill="#0b2341"/>

    <!-- Crescent main curve -->
    <path d="M 42 39 A 28 28 0 1 1 86 58 L 76 57 A 18 18 0 1 0 44 48 Z" fill="#0b2341"/>
    
    <!-- Central eye / pupil -->
    <circle cx="63" cy="52" r="12.5" fill="#0b2341"/>
    <circle cx="67" cy="48" r="3.5" fill="#f59e0b"/>
    <circle cx="68" cy="47" r="1.5" fill="#ffffff"/>
    
    <!-- Dispersion pixels (left) in gold, amber, and navy -->
    <rect x="6" y="57" width="6" height="6" fill="#d97706"/>
    <rect x="6" y="36" width="3.5" height="3.5" fill="#f59e0b"/>
    <rect x="27" y="33" width="3.5" height="3.5" fill="#fbbf24"/>
    <rect x="14" y="49" width="5.5" height="5.5" fill="#d97706"/>
    <rect x="14" y="65" width="3.5" height="3.5" fill="#0b2341"/>
    <rect x="21" y="56" width="6" height="6" fill="#b45309"/>
    <rect x="21" y="41" width="6" height="6" fill="#f59e0b"/>
    <rect x="22" y="30" width="5" height="5" fill="#fbbf24"/>
    <rect x="29" y="48" width="6" height="6" fill="#d97706"/>
    <rect x="29" y="56" width="6" height="6" fill="#78350f"/>
    <rect x="37" y="33" width="5" height="5" fill="#0b2341"/>
    <rect x="37" y="41" width="5.5" height="5.5" fill="#0b2341"/>
    <rect x="37" y="49" width="6" height="6" fill="#f59e0b"/>
    <rect x="37" y="56" width="6" height="6" fill="#d97706"/>
    <rect x="38" y="63" width="4.5" height="4.5" fill="#0b2341"/>
    
    <!-- Ascending bars in gold & navy -->
    <path d="M 49 87 L 54 87 L 54 94 L 49 92 Z" fill="url(#bar1Gold)"/>
    <rect x="56" y="82" width="5.5" height="12" rx="1" fill="url(#bar2Gold)"/>
    <rect x="63" y="77" width="6" height="18" rx="1" fill="url(#bar3Gold)"/>
    <rect x="71" y="63" width="7" height="32" rx="1" fill="#0b2341"/>
  </g>

  <!-- Typography: Invierte in Navy, Lab in Gold/Amber -->
  <g transform="translate(126, 0)">
    <text x="0" y="68" font-family="'Montserrat', 'Public Sans', 'Segoe UI', sans-serif" font-size="46">
      <tspan fill="#0b2341" font-weight="600">Invierte</tspan><tspan fill="#d97706" font-weight="800">Lab</tspan>
    </text>
  </g>
</svg>`;

export interface Sponsor {
  id: string;
  name: string;
  subtitle: string;
  svg: string;
  imageSrc?: string;
  cardClass: string;
  footerClass: string;
}

export const SPONSORS: Sponsor[] = [
  {
    id: "bicentenario",
    name: "Instituto Bicentenario",
    subtitle: "Investigación y políticas públicas",
    svg: LOGO_BIC,
    imageSrc: "/logos/bicentenariopng.png",
    cardClass: "bg-white border-slate-200 shadow-xs",
    footerClass: "bg-white border-white/30 shadow-xs"
  },
  {
    id: "gfp",
    name: "Programa GFP Subnacional",
    subtitle: "Cooperación Suiza · SECO",
    svg: LOGO_GFP,
    imageSrc: "/logos/GFC.png",
    cardClass: "bg-white border-slate-200 shadow-xs",
    footerClass: "bg-white border-white/30 shadow-xs"
  },
  {
    id: "inviertelab",
    name: "InvierteLab",
    subtitle: "Iniciativa y soporte técnico",
    svg: LOGO_IL,
    imageSrc: "/logos/inviertelab.png?v=4",
    cardClass: "bg-white border-slate-200 shadow-xs",
    footerClass: "bg-white border-white/30 shadow-xs"
  }
];
