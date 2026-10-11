(()=>{
  const q=new URLSearchParams(location.search);
  const requested=q.get('lesson')||'';
  const U11=[
    {id:'s01',n:1,title:'Fashion Matters',interactive:true,activityType:'choice_text'},
    {id:'s02',n:2,title:'Speaking Questions',interactive:false},
    {id:'s03',n:3,title:'Speaking Strategy',interactive:true,activityType:'multi_text'},
    {id:'s04',n:4,title:'Topic Vocabulary',interactive:true,activityType:'text'},
    {id:'s05',n:5,title:'Describe & Compare',interactive:true,activityType:'text_or_audio'},
    {id:'s06',n:6,title:'Listening',interactive:true,activityType:'matching'},
    {id:'s07',n:7,title:'Transcript Focus',interactive:true,activityType:'text'},
    {id:'s08',n:8,title:'Phrasal Verbs Focus',interactive:false},
    {id:'s09',n:9,title:'Exercise 7',interactive:true,activityType:'matching'},
    {id:'s10',n:10,title:'Exercise 8',interactive:true,activityType:'six_blanks'},
    {id:'s11',n:11,title:'Exercise 9',interactive:true,activityType:'six_blanks_letter'},
    {id:'s12',n:12,title:'Advice to Emma',interactive:true,activityType:'text_or_audio'},
    {id:'s13',n:13,title:'Consolidation',interactive:true,activityType:'multi_text'},
    {id:'s14',n:14,title:'Exit Ticket',interactive:true,activityType:'exit_ticket'},
    {id:'s15',n:15,title:'Homework Extension',interactive:true,activityType:'text'},
    {id:'s16',n:16,title:'Lesson Complete',interactive:false}
  ];
  const U31=[
    {id:'hero',n:1,title:'Unit 3 · What’s your job?',interactive:false},
    {id:'aims',n:2,title:'Aims of the Lesson',interactive:false},
    {id:'s02',n:3,title:'Who is working here?',interactive:true,activityType:'choice_text'},
    {id:'s03',n:4,title:'Explore the Jobs',interactive:true,activityType:'matching'},
    {id:'s04',n:5,title:'Notice the Difference',interactive:true,activityType:'choice_text'},
    {id:'s05',n:6,title:'At the Shopping Mall',interactive:true,activityType:'listening'},
    {id:'s06',n:7,title:'Grammar Discovery',interactive:true,activityType:'choice_text'},
    {id:'s07',n:8,title:'Usually or Right Now?',interactive:true,activityType:'video'},
    {id:'s08',n:9,title:'Build the Tense Model',interactive:true,activityType:'matching'},
    {id:'s09',n:10,title:'Present Simple vs Present Continuous',interactive:false},
    {id:'s10',n:11,title:'Shopping Mall Practice',interactive:true,activityType:'text'},
    {id:'s11',n:12,title:'Sonia: Two Lives',interactive:true,activityType:'matching'},
    {id:'s12',n:13,title:'Speak about Sonia',interactive:true,activityType:'text_or_audio'},
    {id:'s13',n:14,title:'Sonia & Granny',interactive:true,activityType:'listening_text'},
    {id:'s14',n:15,title:'Action or State?',interactive:true,activityType:'choice_text'},
    {id:'s15',n:16,title:'Before the Rule',interactive:true,activityType:'matching'},
    {id:'s16',n:17,title:'Build the State-Verb Model',interactive:true,activityType:'matching'},
    {id:'s17',n:18,title:'State Verbs · Focus Mode',interactive:false},
    {id:'s18',n:19,title:'Error Doctor',interactive:true,activityType:'text'},
    {id:'s19',n:20,title:'Professional Transfer',interactive:true,activityType:'text_or_audio'},
    {id:'s20',n:21,title:'Exit Ticket',interactive:true,activityType:'exit_ticket'},
    {id:'thanks',n:22,title:'Thank You',interactive:false}
  ];
  const isU31=requested==='res-objective-pet-b1-u03-l01'||requested==='objective-pet-b1/u03/l01';
  window.ELEAP_LIVE_CONFIG={
    SUPABASE_URL:'https://xfisojqahojcsfrjjxab.supabase.co',
    SUPABASE_PUBLISHABLE_KEY:'sb_publishable_hp5IvBjk23I0KQ3AaAdaQg_eyZgszvz',
    RESOURCE_ID:isU31?'res-objective-pet-b1-u03-l01':'res-objective-first-b2-u01-l01',
    LESSON_ID:isU31?'objective-pet-b1/u03/l01':'objective-first-b2/u01/l01',
    POLL_MS:1200,
    DEFAULT_TIMER_SECONDS:90,
    SCREENS:isU31?U31:U11
  };
})();
