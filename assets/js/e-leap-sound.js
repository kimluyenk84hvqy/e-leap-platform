(() => {
  let ctx = null;
  let enabled = localStorage.getItem("eleap_sound_enabled") !== "0";

  function getCtx(){
    if(!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
    if(ctx.state === "suspended") ctx.resume();
    return ctx;
  }
  function tone(freq, start, dur, gain=0.025, type="sine"){
    if(!enabled) return;
    const c=getCtx(), o=c.createOscillator(), g=c.createGain();
    o.type=type; o.frequency.value=freq;
    g.gain.setValueAtTime(0.0001,c.currentTime+start);
    g.gain.exponentialRampToValueAtTime(gain,c.currentTime+start+0.015);
    g.gain.exponentialRampToValueAtTime(0.0001,c.currentTime+start+dur);
    o.connect(g).connect(c.destination);
    o.start(c.currentTime+start); o.stop(c.currentTime+start+dur+0.02);
  }
  const api = {
    isEnabled:()=>enabled,
    setEnabled(v){ enabled=!!v; localStorage.setItem("eleap_sound_enabled", enabled?"1":"0"); },
    start(){ tone(523.25,0,.16,.025); tone(659.25,.11,.2,.02); },
    submit(){ tone(659.25,0,.12,.018); tone(783.99,.09,.16,.016); },
    warning(){ tone(587.33,0,.12,.014); },
    timeUp(){ tone(523.25,0,.18,.022); tone(392,.16,.28,.018); },
    reopen(){ tone(392,0,.12,.016); tone(523.25,.10,.18,.018); }
  };
  window.ELeapSound=api;
})();
