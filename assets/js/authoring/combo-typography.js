/* E-LEAP Teaching Combo typography contract, 16:9 projection defaults.
 * Design metadata only. It never stores or reveals textbook answer values.
 * School/instructor-specific overrides may be added after visual approval.
 */
export const COMBO_TYPOGRAPHY=Object.freeze({
 fontFamily:'Poppins, Arial, sans-serif',
 zones:Object.freeze({
  slideTitle:{px:48,color:'#113D2B',weight:800},
  stepTitle:{px:32,color:'#134632',weight:800},
  instruction:{px:30,color:'#193D2D',weight:700},
  question:{px:32,color:'#173F2E',weight:800},
  learningText:{px:27,color:'#203A30',weight:600},
  passage:{px:26,color:'#203A30',weight:500},
  option:{px:27,color:'#203A30',weight:600},
  sentenceSupport:{px:27,color:'#174F37',weight:650},
  learnerResponse:{px:27,color:'#173F2E',weight:600},
  key:{px:34,color:'#103B2B',background:'#D4F28B',weight:800},
  evidence:{px:25,color:'#174B35',background:'#EDF8EE',weight:600},
  why:{px:25,color:'#174B35',background:'#EDF8EE',weight:600},
  functionLabel:{px:18,color:'#3A6650',weight:800},
  stepNavigation:{px:19,color:'#194E36',weight:700}
 })
});
export function comboTypographyStyle(){
 const z=COMBO_TYPOGRAPHY.zones;
 const vars={
  '--combo-title-size':z.slideTitle.px+'px','--combo-title-color':z.slideTitle.color,
  '--combo-step-size':z.stepTitle.px+'px','--combo-step-color':z.stepTitle.color,
  '--combo-instruction-size':z.instruction.px+'px','--combo-instruction-color':z.instruction.color,
  '--combo-question-size':z.question.px+'px','--combo-question-color':z.question.color,
  '--combo-body-size':z.learningText.px+'px','--combo-body-color':z.learningText.color,
  '--combo-passage-size':z.passage.px+'px',
  '--combo-option-size':z.option.px+'px',
  '--combo-support-size':z.sentenceSupport.px+'px',
  '--combo-response-size':z.learnerResponse.px+'px',
  '--combo-key-size':z.key.px+'px','--combo-key-color':z.key.color,'--combo-key-bg':z.key.background,
  '--combo-evidence-size':z.evidence.px+'px','--combo-evidence-color':z.evidence.color,
  '--combo-why-size':z.why.px+'px',
  '--combo-label-size':z.functionLabel.px+'px',
  '--combo-nav-size':z.stepNavigation.px+'px'
 };
 return Object.entries(vars).map(([k,v])=>k+':'+v).join(';');
}
