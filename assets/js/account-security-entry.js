(function(){
  if(window.__ELEAP_ACCOUNT_SECURITY_ENTRY__)return;
  window.__ELEAP_ACCOUNT_SECURITY_ENTRY__=true;
  let tries=0;
  const timer=setInterval(()=>{
    tries++;
    const side=document.querySelector('.side-bottom');
    const user=window.ELEAPCurrentUser;
    if(side&&user&&['admin','teacher','student'].includes(user.role)){
      clearInterval(timer);
      if(document.getElementById('accountSecurityBtn'))return;
      const btn=document.createElement('button');
      btn.className='auth-entry';
      btn.id='accountSecurityBtn';
      btn.type='button';
      btn.textContent=user.role==='student'?'Change PIN':'Change password';
      const signOut=document.getElementById('signOutBtn');
      if(signOut)side.insertBefore(btn,signOut);else side.appendChild(btn);
      btn.onclick=()=>location.href='change-password.html';
    }else if(tries>80)clearInterval(timer);
  },125);
})();
