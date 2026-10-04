export const E_LEAP_THEME_PRESETS={
  'E-LEAP Classic':{fontFamily:'Poppins',titleSize:36,bodySize:18,textColor:'#173f38',accentColor:'#0d7d6d',backgroundColor:'#ffffff'},
  'Kids':{fontFamily:'Poppins',titleSize:38,bodySize:19,textColor:'#243746',accentColor:'#e46f2b',backgroundColor:'#fffdf8'},
  'Teen':{fontFamily:'Poppins',titleSize:36,bodySize:18,textColor:'#17223b',accentColor:'#5865f2',backgroundColor:'#ffffff'},
  'Academic':{fontFamily:'Arial',titleSize:34,bodySize:17,textColor:'#202a31',accentColor:'#2f667d',backgroundColor:'#ffffff'},
  'Exam':{fontFamily:'Arial',titleSize:32,bodySize:17,textColor:'#1f2933',accentColor:'#334e68',backgroundColor:'#ffffff'}
};
export const E_LEAP_THEME_DEFAULT={preset:'E-LEAP Classic',...E_LEAP_THEME_PRESETS['E-LEAP Classic'],density:'standard'};
export const E_LEAP_TYPOGRAPHY_TOKENS={headingXL:{min:32,max:48,default:36},headingL:{min:26,max:40,default:30},body:{min:16,max:22,default:18},caption:{min:12,max:16,default:14}};
export const E_LEAP_ALLOWED_FONTS=['Poppins','Arial','Georgia','Times New Roman'];
export function applyThemePreset(theme={},preset='E-LEAP Classic'){return {...E_LEAP_THEME_DEFAULT,...theme,...(E_LEAP_THEME_PRESETS[preset]||E_LEAP_THEME_PRESETS['E-LEAP Classic']),preset};}
