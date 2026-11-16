import { createTheme } from '@mui/material/styles';

// Palette Ciné Go inchangée (or #FFD700 sur fond très sombre) ;
// seuls les formes, typographies et composants évoluent vers un style « grand réseau ».
export const colors = {
  gold: '#FFD700',
  goldDark: '#E6A800',
  goldHover: '#FFA500',
  bg: '#0f1014',
  bgDeep: '#0a0a0e',
  paper: '#17181e',
  paperHigh: '#1c1d24',
  border: 'rgba(255, 255, 255, 0.08)',
  textMuted: 'rgba(255, 255, 255, 0.65)',
  textFaint: 'rgba(255, 255, 255, 0.45)',
  blue: '#90caf9',
};

// Titres condensés (style affiche de cinéma) + texte en Heebo, comme les grands réseaux
export const headingFont = '"Barlow Condensed", "Arial Narrow", "Helvetica", sans-serif';
export const bodyFont = '"Heebo", "Inter", "Helvetica", "Arial", sans-serif';

const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: { main: colors.gold, dark: colors.goldDark, light: '#FFE55C', contrastText: '#000000' },
    secondary: { main: colors.blue, dark: '#5d99c6', light: '#c3fdff', contrastText: '#000000' },
    background: { default: colors.bg, paper: colors.paper },
    text: { primary: '#FFFFFF', secondary: colors.textMuted },
    divider: colors.border,
    success: { main: '#34d399' },
    error: { main: '#f87171' },
  },
  shape: { borderRadius: 8 },
  typography: {
    fontFamily: bodyFont,
    h1: { fontFamily: headingFont, fontWeight: 700, fontSize: '3.75rem', lineHeight: 1, letterSpacing: '0' },
    h2: { fontFamily: headingFont, fontWeight: 700, fontSize: '2.5rem', lineHeight: 1.1 },
    h3: { fontFamily: headingFont, fontWeight: 700, fontSize: '2rem', lineHeight: 1.1 },
    h4: { fontFamily: headingFont, fontWeight: 700, fontSize: '1.75rem', lineHeight: 1.15 },
    h5: { fontFamily: headingFont, fontWeight: 700 },
    h6: { fontFamily: headingFont, fontWeight: 700 },
    overline: { fontWeight: 700, letterSpacing: '0.12em' },
    button: { textTransform: 'none', fontWeight: 500, fontSize: '1rem' },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: { body: { backgroundColor: colors.bg } },
    },
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: {
        // Boutons rectangulaires 48 px, coins à 6 px
        root: { borderRadius: 6, minHeight: 48, padding: '0 20px', transition: 'all 0.15s ease-out', whiteSpace: 'nowrap' },
        sizeLarge: { minHeight: 52, padding: '0 26px', fontSize: '1.05rem' },
        sizeSmall: { minHeight: 36, padding: '0 14px', fontSize: '0.9rem' },
        contained: { fontWeight: 700 },
        containedPrimary: {
          '&:hover': { backgroundColor: colors.goldHover },
        },
        outlined: {
          borderColor: 'rgba(255, 255, 255, 0.35)',
          color: '#FFFFFF',
          '&:hover': { borderColor: '#FFFFFF', backgroundColor: 'rgba(255, 255, 255, 0.06)' },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 6,
          backgroundImage: 'none',
          backgroundColor: colors.paper,
          border: `1px solid ${colors.border}`,
          boxShadow: 'none',
        },
      },
    },
    MuiPaper: { styleOverrides: { root: { backgroundImage: 'none' } } },
    MuiTextField: { defaultProps: { variant: 'outlined' } },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          backgroundColor: 'rgba(255, 255, 255, 0.04)',
          '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255, 255, 255, 0.14)' },
          '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255, 215, 0, 0.5)' },
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: colors.gold },
        },
      },
    },
    MuiChip: { styleOverrides: { root: { borderRadius: 32, fontWeight: 500, height: 40, paddingInline: 8 }, sizeSmall: { height: 26, paddingInline: 2 } } },
    MuiAlert: {
      styleOverrides: {
        root: { borderRadius: 10, border: '1px solid' },
        standardError: { borderColor: 'rgba(248, 113, 113, 0.3)', backgroundColor: 'rgba(248, 113, 113, 0.08)' },
        standardWarning: { borderColor: 'rgba(251, 191, 36, 0.3)', backgroundColor: 'rgba(251, 191, 36, 0.08)' },
        standardSuccess: { borderColor: 'rgba(52, 211, 153, 0.3)', backgroundColor: 'rgba(52, 211, 153, 0.08)' },
        standardInfo: { borderColor: 'rgba(144, 202, 249, 0.3)', backgroundColor: 'rgba(144, 202, 249, 0.08)' },
      },
    },
    MuiMenu: {
      styleOverrides: {
        paper: {
          borderRadius: 12,
          border: '1px solid rgba(255, 255, 255, 0.1)',
          backgroundColor: colors.paperHigh,
          boxShadow: '0 12px 40px rgba(0, 0, 0, 0.5)',
        },
      },
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: { backgroundColor: '#25262e', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: 8, fontSize: '0.75rem' },
        arrow: { color: '#25262e' },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: { borderRadius: 16, border: '1px solid rgba(255, 255, 255, 0.1)', backgroundColor: colors.paperHigh },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: { borderColor: colors.border },
        head: { fontWeight: 700, color: 'rgba(255, 255, 255, 0.85)' },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: { textTransform: 'none', fontWeight: 500, fontSize: '1.05rem', minHeight: 52, color: colors.textMuted },
      },
    },
  },
});

export default theme;
