/* Shared learner-preview readiness checks for E-LEAP authoring.
 * Work-in-progress content stays in the Studio editor but is NOT projected.
 * This is a preview filter, not a replacement for the publish quality gate.
 */
const PLACEHOLDER=/\b(?:insert (?:the|your)|add (?:the|a) (?:reading|assigned|short lead)|paste or type|new slide|lesson title|option [ab]|item [12]|match [12]|sentence with a blank|key point [123]|media library or paste|template id|asset id|developer note|teacher should|content mapper)\b/i;
const value=x=>String(x??'').trim();
const meaningful=x=>value(x).length>0&&!PLACEHOLDER.test(value(x));
export function learnerBlockReady(block){
 if(!block||block.audience==='internal'||block.audience==='teacher')return false;
 const c=block.content||{},a=block.activity||{};
 switch(block.type){
  case 'text':return meaningful(c.text);
  case 'image':case 'audio':case 'video':return Boolean(value(c.assetId)||value(c.src));
  case 'vocabulary':return Array.isArray(c.items)&&c.items.length>0&&c.items.every(x=>meaningful(x.word)&&meaningful(x.meaning));
  case 'grammar-note':return meaningful(c.rule)&&meaningful(c.form)&&Array.isArray(c.examples)&&c.examples.some(meaningful);
  case 'mcq':case 'multi-select':case 'true-false':case 'listening':case 'video-question':
   return meaningful(a.prompt)&&Array.isArray(a.options)&&a.options.length>=2&&a.options.every(x=>meaningful(x.label))&&Array.isArray(a.answerKey)&&a.answerKey.length>0;
  case 'matching':return meaningful(a.prompt)&&Array.isArray(a.pairs)&&a.pairs.length>0&&a.pairs.every(x=>meaningful(x.left)&&meaningful(x.right));
  case 'fill':return meaningful(a.prompt)&&Array.isArray(a.items)&&a.items.length>0&&a.items.every(x=>meaningful(x.prompt)&&Array.isArray(x.answers)&&x.answers.some(meaningful));
  case 'ordering':return meaningful(a.prompt)&&Array.isArray(a.items)&&a.items.length>=2&&a.items.every(x=>meaningful(x.text));
  case 'categorising':return meaningful(a.prompt)&&Array.isArray(a.categories)&&a.categories.length>=2&&Array.isArray(a.items)&&a.items.length>0;
  case 'discussion':case 'writing':case 'speaking-record':case 'poll':return meaningful(a.prompt);
  case 'click-reveal':case 'flashcards':return Array.isArray(a.items)&&a.items.length>0&&a.items.every(x=>meaningful(x.question)&&meaningful(x.answer));
  default:return meaningful(a.prompt);
 }
}
export function incompleteLearnerBlocks(screen){
 return (screen.blocks||[]).filter(b=>!learnerBlockReady(b)&&b.audience!=='internal'&&b.audience!=='teacher');
}
