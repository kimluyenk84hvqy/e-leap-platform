const KEY='mcdl:v0:progress';
export const progressStore={
  load(){try{return JSON.parse(localStorage.getItem(KEY))||{completed:[],attempts:[]}}catch{return{completed:[],attempts:[]}}},
  save(v){localStorage.setItem(KEY,JSON.stringify(v))},
  mark(sectionId){const p=this.load();if(!p.completed.includes(sectionId))p.completed.push(sectionId);this.save(p);return p},
  addAttempt(a){const p=this.load();p.attempts.unshift(a);this.save(p);return p},
  reset(){localStorage.removeItem(KEY)}
};
