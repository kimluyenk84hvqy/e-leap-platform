export const E_LEAP_THEME_PRESETS={
  'VMMU Military Green':{fontFamily:'Poppins',titleSize:36,bodySize:18,textColor:'#183329',accentColor:'#2F6B4F',backgroundColor:'#F7FAF8',deepColor:'#1F4D3A',freshColor:'#2F6B4F',softColor:'#DDEBE3',institution:'VIETNAM MILITARY MEDICAL UNIVERSITY',faculty:'FACULTY OF FOREIGN LANGUAGES'},
  'E-LEAP Classic':{fontFamily:'Poppins',titleSize:36,bodySize:18,textColor:'#173f38',accentColor:'#0d7d6d',backgroundColor:'#ffffff'},
  'Kids':{fontFamily:'Poppins',titleSize:38,bodySize:19,textColor:'#243746',accentColor:'#e46f2b',backgroundColor:'#fffdf8'},
  'Teen':{fontFamily:'Poppins',titleSize:36,bodySize:18,textColor:'#17223b',accentColor:'#5865f2',backgroundColor:'#ffffff'},
  'Academic':{fontFamily:'Poppins',titleSize:34,bodySize:17,textColor:'#202a31',accentColor:'#2f667d',backgroundColor:'#ffffff'},
  'Exam':{fontFamily:'Poppins',titleSize:32,bodySize:17,textColor:'#1f2933',accentColor:'#334e68',backgroundColor:'#ffffff'}
};
export const E_LEAP_THEME_DEFAULT={preset:'VMMU Military Green',...E_LEAP_THEME_PRESETS['VMMU Military Green'],density:'standard'};
export const E_LEAP_TYPOGRAPHY_TOKENS={display:{min:40,max:64,default:52},headingXL:{min:32,max:48,default:36},headingL:{min:26,max:40,default:30},body:{min:16,max:22,default:18},caption:{min:12,max:16,default:14},ui:{min:13,max:17,default:15}};
export const E_LEAP_ALLOWED_FONTS=['Poppins','Arial','Georgia','Times New Roman'];
export const E_LEAP_VMMU_BRAND=Object.freeze({institution:'VIETNAM MILITARY MEDICAL UNIVERSITY',faculty:'FACULTY OF FOREIGN LANGUAGES',palette:{deep:'#1F4D3A',fresh:'#2F6B4F',accent:'#4F8A67',soft:'#DDEBE3',surface:'#F7FAF8',text:'#183329'}});
export function applyThemePreset(theme={},preset='VMMU Military Green'){return {...E_LEAP_THEME_DEFAULT,...theme,...(E_LEAP_THEME_PRESETS[preset]||E_LEAP_THEME_PRESETS['VMMU Military Green']),preset};}
