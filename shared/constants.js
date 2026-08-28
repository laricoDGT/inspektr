/**
 * Inspektr — Shared Constants
 */

// Message action types
export const ACTIONS = {
  TOGGLE_TOOL: 'TOGGLE_TOOL',
  GET_TAB_STATE: 'GET_TAB_STATE',
  ACTIVATE_FONT_DETECTOR: 'ACTIVATE_FONT_DETECTOR',
  DEACTIVATE_FONT_DETECTOR: 'DEACTIVATE_FONT_DETECTOR',
  SCAN_FONTS: 'SCAN_FONTS',
};

// Tool identifiers
export const TOOLS = {
  FONT_DETECTOR: 'font-detector',
  COLOR_PICKER: 'color-picker',       // planned
  IMAGE_INSPECTOR: 'image-inspector', // planned
};

// Top Google Fonts (used for detection)
export const GOOGLE_FONTS = new Set([
  'Roboto', 'Open Sans', 'Lato', 'Montserrat', 'Oswald', 'Raleway',
  'PT Sans', 'Merriweather', 'Nunito', 'Playfair Display', 'Poppins',
  'Ubuntu', 'Mukti', 'Fira Sans', 'Noto Sans', 'Source Sans Pro',
  'Titillium Web', 'Inconsolata', 'Oxygen', 'Droid Sans', 'Crimson Text',
  'Cabin', 'Arimo', 'Josefin Sans', 'Libre Baskerville', 'Pacifico',
  'Lobster', 'Dancing Script', 'Shadows Into Light', 'Indie Flower',
  'Amatic SC', 'Caveat', 'Sacramento', 'Great Vibes', 'Satisfy',
  'Comfortaa', 'Righteous', 'Baloo 2', 'Chakra Petch', 'Inter',
  'Plus Jakarta Sans', 'DM Sans', 'Space Grotesk', 'Outfit', 'Sora',
  'Lexend', 'Manrope', 'Albert Sans', 'Figtree', 'Onest',
  'Work Sans', 'Rubik', 'Mulish', 'Quicksand', 'Barlow',
  'Exo 2', 'Exo', 'Kanit', 'Prompt', 'Sarabun',
  'Noto Serif', 'Libre Franklin', 'EB Garamond', 'Cormorant Garamond',
  'Cormorant', 'Lora', 'PT Serif', 'Source Serif Pro', 'Bitter',
  'Spectral', 'Arvo', 'Domine', 'Gentium Basic', 'Cardo',
  'JetBrains Mono', 'Fira Code', 'Source Code Pro', 'Space Mono',
  'Roboto Mono', 'IBM Plex Mono', 'Courier Prime', 'Share Tech Mono',
  'Overpass Mono', 'DM Mono', 'Anonymous Pro', 'Nanum Gothic Coding',
]);

// System fonts (not Google Fonts)
export const SYSTEM_FONTS = new Set([
  '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Helvetica Neue',
  'Arial', 'Helvetica', 'Verdana', 'Georgia', 'Times New Roman',
  'Trebuchet MS', 'Impact', 'Comic Sans MS', 'Courier New', 'Lucida Console',
  'Monaco', 'Menlo', 'Consolas', 'system-ui', 'ui-sans-serif',
  'ui-serif', 'ui-monospace', 'ui-rounded', 'sans-serif', 'serif',
  'monospace', 'cursive', 'fantasy',
]);

// Design tokens (mirrored in CSS)
export const DESIGN = {
  ACCENT: '#7C6FE0',
  ACCENT_2: '#4ECDC4',
  BG: '#0F1117',
  SURFACE: '#1A1D27',
  TEXT: '#E8EAF0',
};
