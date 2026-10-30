import sharp from 'sharp';
import fs from 'fs';

// Ensure directory exists
if (!fs.existsSync('public/logos')) {
  fs.mkdirSync('public/logos', { recursive: true });
}

// 1. INSTITUTO BICENTENARIO (Exact replica of user's uploaded banner)
const bicentenarioSvg = `
<svg width="600" height="180" viewBox="0 0 600 180" xmlns="http://www.w3.org/2000/svg">
  <rect width="600" height="180" rx="10" fill="#283544"/>
  
  <!-- Emblem on Left -->
  <g transform="translate(30, 25)">
    <!-- Quadrant 1 (Top-Left): White curve -->
    <path d="M 5 5 L 62 5 A 57 57 0 0 0 5 62 Z" fill="#FFFFFF"/>
    
    <!-- Quadrant 2 (Top-Right): Red slice -->
    <path d="M 68 68 L 68 5 A 63 63 0 0 1 131 68 Z" fill="#EE2726"/>
    
    <!-- Quadrant 3 (Bottom-Left): Red rounded corner -->
    <path d="M 5 68 A 63 63 0 0 0 68 131 L 10 131 Q 5 131 5 126 Z" fill="#EE2726"/>
    
    <!-- Quadrant 4 (Bottom-Right): White curve -->
    <path d="M 68 131 A 63 63 0 0 0 131 68 L 131 126 Q 131 131 126 131 Z" fill="#FFFFFF"/>
    
    <!-- Dark separators -->
    <line x1="68" y1="5" x2="68" y2="131" stroke="#283544" stroke-width="6"/>
    <line x1="5" y1="68" x2="131" y2="68" stroke="#283544" stroke-width="6"/>
  </g>
  
  <!-- Typography matching the exact font weights and kerning -->
  <g fill="#FFFFFF" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Public Sans', sans-serif">
    <text x="185" y="82" font-size="56" font-weight="800" letter-spacing="-0.03em">Instituto</text>
    <text x="185" y="142" font-size="56" font-weight="300" letter-spacing="-0.03em">Bicentenario</text>
  </g>
</svg>
`;

// 2. UNIVERSIDAD DEL PACÍFICO - WHITE VERSION (For Header & Dark Backgrounds)
const pacificoWhiteSvg = `
<svg width="600" height="150" viewBox="0 0 600 150" xmlns="http://www.w3.org/2000/svg">
  <!-- Oval Seal on Left -->
  <g transform="translate(15, 12)" fill="#FFFFFF" stroke="#FFFFFF">
    <ellipse cx="58" cy="63" rx="46" ry="60" fill="none" stroke-width="4.5"/>
    <ellipse cx="58" cy="63" rx="36.5" ry="49" fill="none" stroke-width="2.5"/>
    
    <!-- Arched Text Top -->
    <path id="up-w-top" d="M 23 79 A 38 49 0 1 1 93 79" fill="none" stroke="none"/>
    <text font-family="-apple-system, sans-serif" font-size="7.8" font-weight="800" letter-spacing="0.1em" fill="#FFFFFF" stroke="none">
      <textPath href="#up-w-top" startOffset="50%" text-anchor="middle">
        UNIVERSIDAD DEL PACÍFICO
      </textPath>
    </text>
    
    <!-- Arched Text Bottom -->
    <path id="up-w-bot" d="M 30 86 A 38 49 0 0 0 86 86" fill="none" stroke="none"/>
    <text font-family="-apple-system, sans-serif" font-size="7" font-weight="700" letter-spacing="0.1em" fill="#FFFFFF" stroke="none">
      <textPath href="#up-w-bot" startOffset="50%" text-anchor="middle">
        · LIMA - PERÚ ·
      </textPath>
    </text>

    <!-- 3 Crowns -->
    <g fill="#FFFFFF" stroke="none">
      <path d="M 51 32 L 65 32 L 64 27 L 61 29.5 L 58 24.5 L 55 29.5 L 52 27 Z"/>
      <circle cx="58" cy="23.5" r="1.2"/>
      <circle cx="52" cy="26" r="1"/>
      <circle cx="64" cy="26" r="1"/>
      
      <path d="M 42 42.5 L 54 42.5 L 53 38 L 50.5 40 L 48 36 L 45.5 40 L 43 38 Z"/>
      <circle cx="48" cy="35" r="1"/>
      
      <path d="M 62 42.5 L 74 42.5 L 73 38 L 70.5 40 L 68 36 L 65.5 40 L 63 38 Z"/>
      <circle cx="68" cy="35" r="1"/>
    </g>

    <!-- UP Monogram -->
    <g fill="#FFFFFF" stroke="none">
      <rect x="52.5" y="50" width="11" height="3"/>
      <rect x="52.5" y="94.5" width="11" height="3"/>
      <rect x="55.5" y="50" width="5" height="46"/>
      <path d="M 60.5 51.5 L 69 51.5 C 75.5 51.5 79.5 55 79.5 61.5 C 79.5 68 75.5 71.5 69 71.5 L 60.5 71.5 Z M 60.5 55.5 L 68.5 55.5 C 72.5 55.5 75 57.5 75 61.5 C 75 65.5 72.5 67.5 68.5 67.5 L 60.5 67.5 Z" fill-rule="evenodd"/>
      <path d="M 45 61 L 49.5 61 L 49.5 77 C 49.5 84.5 53.5 87.5 58 87.5 C 62.5 87.5 66.5 84.5 66.5 77 L 66.5 71 L 70.5 71 L 70.5 77 C 70.5 87 65 91.5 58 91.5 C 51 91.5 45 87 45 77 Z" fill-rule="evenodd"/>
    </g>
  </g>

  <!-- Typography Right -->
  <g fill="#FFFFFF" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif">
    <text x="145" y="72" font-size="52" font-weight="800" letter-spacing="-0.03em">Pacífico</text>
    <line x1="335" y1="35" x2="335" y2="115" stroke="#FFFFFF" stroke-opacity="0.35" stroke-width="2"/>
    <text x="355" y="65" font-size="21" font-weight="700">Universidad del Pacífico</text>
    <text x="355" y="95" font-size="18" font-weight="400" fill="#CBD5E1">Escuela de Gestión Pública</text>
  </g>
</svg>
`;

// 3. UNIVERSIDAD DEL PACÍFICO - DARK/COLOR VERSION (For White Cards)
const pacificoDarkSvg = `
<svg width="600" height="150" viewBox="0 0 600 150" xmlns="http://www.w3.org/2000/svg">
  <!-- Oval Seal on Left in Black -->
  <g transform="translate(15, 12)" fill="#111827" stroke="#111827">
    <ellipse cx="58" cy="63" rx="46" ry="60" fill="none" stroke-width="4.5"/>
    <ellipse cx="58" cy="63" rx="36.5" ry="49" fill="none" stroke-width="2.5"/>
    
    <path id="up-d-top" d="M 23 79 A 38 49 0 1 1 93 79" fill="none" stroke="none"/>
    <text font-family="-apple-system, sans-serif" font-size="7.8" font-weight="800" letter-spacing="0.1em" fill="#111827" stroke="none">
      <textPath href="#up-d-top" startOffset="50%" text-anchor="middle">
        UNIVERSIDAD DEL PACÍFICO
      </textPath>
    </text>
    
    <path id="up-d-bot" d="M 30 86 A 38 49 0 0 0 86 86" fill="none" stroke="none"/>
    <text font-family="-apple-system, sans-serif" font-size="7" font-weight="700" letter-spacing="0.1em" fill="#111827" stroke="none">
      <textPath href="#up-d-bot" startOffset="50%" text-anchor="middle">
        · LIMA - PERÚ ·
      </textPath>
    </text>

    <g fill="#111827" stroke="none">
      <path d="M 51 32 L 65 32 L 64 27 L 61 29.5 L 58 24.5 L 55 29.5 L 52 27 Z"/>
      <circle cx="58" cy="23.5" r="1.2"/>
      <circle cx="52" cy="26" r="1"/>
      <circle cx="64" cy="26" r="1"/>
      <path d="M 42 42.5 L 54 42.5 L 53 38 L 50.5 40 L 48 36 L 45.5 40 L 43 38 Z"/>
      <circle cx="48" cy="35" r="1"/>
      <path d="M 62 42.5 L 74 42.5 L 73 38 L 70.5 40 L 68 36 L 65.5 40 L 63 38 Z"/>
      <circle cx="68" cy="35" r="1"/>
    </g>

    <g fill="#111827" stroke="none">
      <rect x="52.5" y="50" width="11" height="3"/>
      <rect x="52.5" y="94.5" width="11" height="3"/>
      <rect x="55.5" y="50" width="5" height="46"/>
      <path d="M 60.5 51.5 L 69 51.5 C 75.5 51.5 79.5 55 79.5 61.5 C 79.5 68 75.5 71.5 69 71.5 L 60.5 71.5 Z M 60.5 55.5 L 68.5 55.5 C 72.5 55.5 75 57.5 75 61.5 C 75 65.5 72.5 67.5 68.5 67.5 L 60.5 67.5 Z" fill-rule="evenodd"/>
      <path d="M 45 61 L 49.5 61 L 49.5 77 C 49.5 84.5 53.5 87.5 58 87.5 C 62.5 87.5 66.5 84.5 66.5 77 L 66.5 71 L 70.5 71 L 70.5 77 C 70.5 87 65 91.5 58 91.5 C 51 91.5 45 87 45 77 Z" fill-rule="evenodd"/>
    </g>
  </g>

  <!-- Typography Right -->
  <g fill="#0f172a" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif">
    <text x="145" y="72" font-size="52" font-weight="800" letter-spacing="-0.03em" fill="#0f172a">Pacífico</text>
    <line x1="335" y1="35" x2="335" y2="115" stroke="#94a3b8" stroke-width="2"/>
    <text x="355" y="65" font-size="21" font-weight="700" fill="#1e293b">Universidad del Pacífico</text>
    <text x="355" y="95" font-size="18" font-weight="500" fill="#475569">Escuela de Gestión Pública</text>
  </g>
</svg>
`;

// 4. PROGRAMA GFP SUBNACIONAL
const gfpSvg = `
<svg width="360" height="180" viewBox="0 0 360 180" xmlns="http://www.w3.org/2000/svg">
  <g transform="translate(248, 8)">
    <path d="M 4 16 C 22 2, 46 24, 78 10 C 86 22, 84 38, 82 48 C 54 62, 32 38, 4 50 Z" fill="#DC241F"/>
    <g fill="#FFFFFF" transform="translate(34, 15)">
      <rect x="6.4" y="0" width="8" height="25" rx="0.6"/>
      <rect x="0" y="8.4" width="20.8" height="8" rx="0.6"/>
    </g>
  </g>
  <text x="16" y="124" font-family="-apple-system, sans-serif" font-size="124" font-weight="900" fill="#0C3866" letter-spacing="-0.03em">GFP</text>
  <rect x="16" y="138" width="276" height="8" rx="2" fill="#F38B1C"/>
  <text x="18" y="170" font-family="-apple-system, sans-serif" font-size="23" font-weight="600" fill="#1A1A1A">Suiza apoyando al Perú</text>
</svg>
`;

// 5. INVIERTELAB
const invierteLabSvg = `
<svg width="420" height="120" viewBox="0 0 420 120" xmlns="http://www.w3.org/2000/svg">
  <rect x="4" y="12" width="96" height="96" rx="16" fill="#0B2341"/>
  <rect x="24" y="68" width="16" height="24" fill="#D4A62A"/>
  <rect x="44" y="52" width="16" height="40" fill="#D4A62A"/>
  <rect x="64" y="32" width="16" height="60" fill="#ffffff"/>
  
  <text x="120" y="74" font-family="-apple-system, sans-serif" font-size="46" fill="#0B2341">
    <tspan font-weight="400">Invierte</tspan><tspan font-weight="700">Lab</tspan>
  </text>
  <text x="120" y="98" font-family="-apple-system, sans-serif" font-size="17" font-weight="600" fill="#64748b" letter-spacing="0.08em">
    APOYO TÉCNICO
  </text>
</svg>
`;

async function buildLogos() {
  console.log('Generating high-resolution PNG image files in public/logos/ ...');
  
  await sharp(Buffer.from(bicentenarioSvg)).png().toFile('public/logos/bicentenario.png');
  console.log('✓ public/logos/bicentenario.png created');

  await sharp(Buffer.from(pacificoWhiteSvg)).png().toFile('public/logos/pacifico-white.png');
  console.log('✓ public/logos/pacifico-white.png created');

  await sharp(Buffer.from(pacificoDarkSvg)).png().toFile('public/logos/pacifico.png');
  console.log('✓ public/logos/pacifico.png created');

  await sharp(Buffer.from(gfpSvg)).png().toFile('public/logos/gfp.png');
  console.log('✓ public/logos/gfp.png created');

  await sharp(Buffer.from(invierteLabSvg)).png().toFile('public/logos/inviertelab.png');
  console.log('✓ public/logos/inviertelab.png created');

  console.log('All real PNG logo files successfully built!');
}

buildLogos().catch(console.error);
