// MOODY BLUE THEME - Huddll Brand Colors
export const theme = {
  // DEEP BLUES (Base)
  deepNavy: '#0F172A',       // Main background
  slate: '#1E293B',          // Card backgrounds
  slateLight: '#334155',     // Elevated cards/hover

  // ACCENT BLUES (CTAs & Highlights)
  skyBlue: '#38BDF8',        // Primary CTA (buttons, links)
  teal: '#14B8A6',           // Success, "going" status
  indigo: '#818CF8',         // Secondary accent

  // SUBTLE PASTELS (Tags & Variety)
  lavender: '#C4B5FD',       // Soft purple
  coral: '#FDA4AF',          // Soft coral/pink
  mint: '#86EFAC',           // Soft mint green
  peach: '#FDBA74',          // Soft peach

  // TEXT COLORS
  textMain: '#F1F5F9',       // Primary text (off-white)
  textSecondary: '#94A3B8',  // Secondary text (blue-gray)
  textLight: '#64748B',      // Tertiary text (lighter gray)

  // UI ELEMENTS
  border: '#334155',         // Subtle borders
  hover: '#334155',          // Hover states
  success: '#14B8A6',        // Success indicators
  error: '#EF4444',          // Error states
  warning: '#F59E0B',        // Warning states

  // GRADIENTS
  gradient: 'linear-gradient(135deg, #0F172A 0%, #1E293B 50%, #334155 100%)',
  accentGradient: 'linear-gradient(135deg, #38BDF8 0%, #818CF8 100%)',
  warmGradient: 'linear-gradient(135deg, #FDA4AF 0%, #FDBA74 100%)',

  // CATEGORY COLORS (for event types)
  categories: {
    food: '#FDBA74',      // Peach
    sports: '#86EFAC',    // Mint
    nightlife: '#C4B5FD', // Lavender
    arts: '#FDA4AF',      // Coral
    music: '#818CF8',     // Indigo
    social: '#38BDF8'     // Sky Blue
  }
};

// Helper function for glowing effects
export const glow = (color, opacity = 0.3) => ({
  boxShadow: `0 0 20px ${color}${Math.round(opacity * 255).toString(16)}`
});

// Helper function for card elevation
export const cardElevation = (level = 1) => {
  const shadows = {
    1: '0 2px 8px rgba(0, 0, 0, 0.2)',
    2: '0 4px 16px rgba(0, 0, 0, 0.3)',
    3: '0 8px 24px rgba(0, 0, 0, 0.4)'
  };
  return { boxShadow: shadows[level] || shadows[1] };
};

export default theme;