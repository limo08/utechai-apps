// SVG icons as inline functions for OpenClaw download page

export function getClawLogo(size: number = 80): string {
  return `<svg width="${size}" height="${size}" viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="clawGrad" x1="256" y1="40" x2="256" y2="472" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stop-color="#FF6B6B"/>
        <stop offset="50%" stop-color="#F04D5A"/>
        <stop offset="100%" stop-color="#C1121F"/>
      </linearGradient>
      <filter id="glow">
        <feGaussianBlur stdDeviation="4" result="blur"/>
        <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
      </filter>
    </defs>
    <!-- Main claw body -->
    <path d="M256 60 C256 60 180 120 160 200 C140 280 150 340 170 380" stroke="url(#clawGrad)" stroke-width="18" stroke-linecap="round" fill="none" opacity="0.7"/>
    <path d="M256 60 C256 60 332 120 352 200 C372 280 362 340 342 380" stroke="url(#clawGrad)" stroke-width="18" stroke-linecap="round" fill="none" opacity="0.7"/>
    <!-- Center prong -->
    <path d="M256 60 C250 140 245 260 256 440 C267 260 262 140 256 60 Z" fill="url(#clawGrad)" opacity="0.85"/>
    <!-- Left prong tip -->
    <path d="M170 380 C170 380 140 400 125 380 C110 360 135 345 165 360" stroke="#F04D5A" stroke-width="14" stroke-linecap="round" fill="none"/>
    <!-- Right prong tip -->
    <path d="M342 380 C342 380 372 400 387 380 C402 360 377 345 347 360" stroke="#F04D5A" stroke-width="14" stroke-linecap="round" fill="none"/>
    <!-- Joints -->
    <circle cx="170" cy="380" r="10" fill="#F04D5A" filter="url(#glow)"/>
    <circle cx="342" cy="380" r="10" fill="#F04D5A" filter="url(#glow)"/>
    <circle cx="256" cy="60" r="12" fill="#FF6B6B" stroke="#F04D5A" stroke-width="3"/>
    <!-- Center glow -->
    <circle cx="256" cy="240" r="18" fill="#F04D5A" opacity="0.25">
      <animate attributeName="opacity" values="0.15;0.4;0.15" dur="2s" repeatCount="indefinite"/>
      <animate attributeName="r" values="16;22;16" dur="2s" repeatCount="indefinite"/>
    </circle>
  </svg>`;
}

export function getIconDownload(): string {
  return `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
    <polyline points="7 10 12 15 17 10"/>
    <line x1="12" y1="15" x2="12" y2="3"/>
  </svg>`;
}

export function getIconWindows(): string {
  return `<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
    <path d="M0 3.449L9.75 2.1v9.451H0m10.949-9.602L24 0v11.4H10.949M0 12.6h9.75v9.451L0 20.699M10.949 12.6H24V24l-12.9-1.801"/>
  </svg>`;
}

export function getIconApple(): string {
  return `<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
  </svg>`;
}

export function getIconShield(): string {
  return `<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#F04D5A" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
  </svg>`;
}

export function getIconCpu(): string {
  return `<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#F04D5A" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <rect x="4" y="4" width="16" height="16" rx="2" ry="2"/>
    <rect x="9" y="9" width="6" height="6"/>
    <line x1="9" y1="1" x2="9" y2="4"/>
    <line x1="15" y1="1" x2="15" y2="4"/>
    <line x1="9" y1="20" x2="9" y2="23"/>
    <line x1="15" y1="20" x2="15" y2="23"/>
    <line x1="20" y1="9" x2="23" y2="9"/>
    <line x1="20" y1="14" x2="23" y2="14"/>
    <line x1="1" y1="9" x2="4" y2="9"/>
    <line x1="1" y1="14" x2="4" y2="14"/>
  </svg>`;
}

export function getIconZap(): string {
  return `<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#F04D5A" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
  </svg>`;
}

export function getIconGlobe(): string {
  return `<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#F04D5A" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <circle cx="12" cy="12" r="10"/>
    <line x1="2" y1="12" x2="22" y2="12"/>
    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
  </svg>`;
}

export function getIconTerminal(): string {
  return `<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#F04D5A" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <polyline points="4 17 10 11 4 5"/>
    <line x1="12" y1="19" x2="20" y2="19"/>
  </svg>`;
}

export function getIconMonitor(): string {
  return `<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#F04D5A" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/>
    <line x1="8" y1="21" x2="16" y2="21"/>
    <line x1="12" y1="17" x2="12" y2="21"/>
  </svg>`;
}

export function getIconLock(): string {
  return `<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#F04D5A" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
  </svg>`;
}

export function getIconPuzzle(): string {
  return `<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#F04D5A" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M19.439 7.85c-.049.322.059.648.289.878l1.568 1.568c.47.47.706 1.087.706 1.704s-.235 1.233-.706 1.704l-1.611 1.611a.98.98 0 0 1-.837.276c-.47-.07-.802-.48-.968-.925a2.501 2.501 0 1 0-3.214 3.214c.446.166.855.497.925.968a.979.979 0 0 1-.276.837l-1.61 1.61a2.404 2.404 0 0 1-1.705.707 2.402 2.402 0 0 1-1.704-.706l-1.568-1.568a1.026 1.026 0 0 0-.877-.29c-.493.074-.84.504-1.02.968a2.5 2.5 0 1 1-3.237-3.237c.464-.18.894-.527.967-1.02a1.026 1.026 0 0 0-.289-.877l-1.568-1.568A2.402 2.402 0 0 1 1.998 12c0-.617.236-1.234.706-1.704L4.315 8.685a.98.98 0 0 1 .837-.276c.47.07.802.48.968.925a2.501 2.501 0 1 0 3.214-3.214c-.446-.166-.855-.497-.925-.968a.979.979 0 0 1 .276-.837l1.61-1.61a2.404 2.404 0 0 1 1.705-.707c.618 0 1.234.236 1.704.706l1.568 1.568c.23.23.556.338.877.29.493-.074.84-.504 1.02-.968a2.5 2.5 0 1 1 3.237 3.237c-.464.18-.894.527-.967 1.02z"/>
  </svg>`;
}

export function getIconLanguages(): string {
  return `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="m5 8 6 6"/>
    <path d="m4 14 6-6 2-3"/>
    <path d="M2 5h12"/>
    <path d="M7 2h1"/>
    <path d="m22 22-5-10-5 10"/>
    <path d="M14 18h6"/>
  </svg>`;
}

export function getIconSmartphone(): string {
  return `<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#F04D5A" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <rect x="5" y="2" width="14" height="20" rx="2" ry="2"/>
    <line x1="12" y1="18" x2="12.01" y2="18"/>
  </svg>`;
}
