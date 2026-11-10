const media = '/studio/drafts/life-u12-media/';
const item = (prompt, key, why, evidence = '', options = []) => ({prompt,key,why,evidence,options});
const yesNo = (prompt,key,evidence,why) => item(prompt,key,why,evidence,['Yes','No']);
export const sourceHash = '68c6ef152a35c148be4cb75911066142bc341619df0bc9bf6076aac20638f502';
export const passage = [
  "Randall Monroe is a scientist and he used to work for NASA. One day he started a blog called What if…? Every week people send Randall questions about unlikely or impossible things, and Randall gives scientific answers. Here are some What if…? questions about weather and nature.",
  "If you were in a submarine, you'd be safe because you'd be underwater. However, lightning usually hits the tallest thing, so if you were on a flat surface, like in a boat on the sea, you wouldn't be as safe.",
  "You wouldn't be safe if your head was above the water. Lightning might hit you. And if the lightning hit the water near you, the electrical energy would spread outwards across the water.",
  "The rain would break the glass if you drove at the speed of sound. But if you did that, the car would take off! Rain wouldn't break the glass if you drove at a normal speed. But in freezing temperatures, hail would break the windscreen if you drove fast. In fact, that sometimes happens in some parts of the world."
];
export const reports = [
  ["Randall and the blog","Where did he work before? What kind of questions does he get? What does he use to answer?","Randall used to work for ___. Readers ask about ___. He answers using ___.","NASA · unlikely or impossible situations · scientific facts","used to work for NASA"],
  ["Submarine or boat","Which is safer in the article? Why is a boat less safe?","A ___ is safer because ___. A boat is less safe because ___.","Submarine · below the water · lightning usually hits the tallest thing","lightning usually hits the tallest thing"],
  ["Swimmer and lightning","What could happen above the water? What happens if lightning hits nearby?","If your head was above the water, ___. If lightning hit nearby, ___.","Lightning might hit you · electrical energy would spread across the water","the electrical energy would spread outwards across the water"],
  ["Rain, hail and glass","What happens at normal speed in rain? When can hail break the glass?","At normal speed, rain ___. In freezing temperatures, if you drove fast, hail ___.","Rain would not break the glass · hail could break the windscreen","hail would break the windscreen if you drove fast"]
];
export const act4 = [
 yesNo("Does Randall work for NASA?","No","used to work for NASA","Used to describes his former job."),
 yesNo("Do people send in questions about things that really happened?","No","questions about unlikely or impossible things","The questions describe imagined situations."),
 yesNo("Does Randall use scientific facts to answer the questions?","Yes","Randall gives scientific answers","He explains the situations using science."),
 yesNo("Are you safer from lightning on a submarine than on a boat?","Yes","you'd be safe because you'd be underwater","The submarine is underwater in the scenario. The boat is exposed at the surface."),
 yesNo("Can the electricity from lightning move across water?","Yes","the electrical energy would spread outwards across the water","The prediction explicitly describes energy spreading across the water."),
 yesNo("Can hail break a car windscreen?","Yes","hail would break the windscreen if you drove fast","The article gives freezing temperatures and fast driving as conditions.")
];
const speaking = [
 item("Would you live in another country if you could? Where would you move to? Why?","I’d move to Japan because I love the food.","The reply gives a hypothetical choice and a reason.","I’d move … because …"),
 item("If you could meet someone famous, who would it be? What would you ask him or her?","I’d meet a wildlife photographer and ask how they get so close to animals.","The reply names a person and gives a follow-up question.","I’d meet … and ask …"),
 item("If you won a lot of money, would you stop working or studying? How would you spend the money?","I’d keep studying, and I’d spend some of the money on a trip.","The reply addresses both questions using would.","I’d keep … and I’d spend …")
];
export function buildLesson({warmup,leadIn,reading}){
 const step=(id,title,instruction,extra={})=>({id,title,instruction,...extra});
 const readingStep=(id,title,instruction,extra={})=>step(id,title,instruction,{reading:true,...extra});
 return [
 step('cover','Unit 12 · Nature','Life · Pre-intermediate',{image:media+'storm.jpg',hero:true}),
 step('warm-up',warmup==='mime'?'Mime and Guess':warmup==='hot-seat'?'Hot Seat':'Picture Detective',
 warmup==='mime'?'Groups of four · 30 seconds. One person acts out an outdoor action. Guess the whole phrase, then swap roles.':warmup==='hot-seat'?'Two teams · 30 seconds. One player faces away. Describe a weather word without saying it. Change the guesser each round.':'Pairs · 30 seconds. Spot three details in the picture. Take turns saying what you see.',{
 image:media+'storm.jpg', timer:30,open:true,
 items:[item(warmup==='mime'?'What action did your team see?':warmup==='hot-seat'?'What weather word did your team guess?':'What can you see?',warmup==='mime'?'They are taking photos.':warmup==='hot-seat'?'Flood.':'I can see a tornado and dark clouds.','Use the action, definition or visible detail to support your answer.','Life, p. 141')]}),
 step('lead-in',leadIn==='audio'?'Who would follow a storm?':'What would you do?',leadIn==='audio'?'Pairs · Predict who might follow a storm and why. Listen to the opening of Track 093 and compare.':'Pairs · 45 seconds. Look at the photo. Tell your partner what you would do if you saw this storm.',{image:media+'storm.jpg',audio:leadIn==='audio'?media+'track-093.mp3':null,timer:45,open:true,items:[leadIn==='audio'?item('Who might follow the storm and why?','A scientist might follow it to study how it forms.','Give a person and a reason. Then listen for the two groups.','Track 093 · scientists and ordinary people'):item('Would you move closer or go away? Why?','I’d go away because a tornado can be dangerous.','Give a choice and a reason.','The photograph shows a tornado.')]}),
 step('opener-listen','Storm chasers · p. 141','Listen to Track 093. Write your answers, compare with a partner and listen again.',{audio:media+'track-093.mp3',open:true,items:[
 item('What do most people do when a tornado is coming?','They drive in the opposite direction.','They try to get away from the tornado.','Track 093 · drive in the opposite direction'),
 item('What type of people are storm chasers?','Some are scientists. Others are ordinary people.','The recording identifies two groups.','Track 093 · scientists and ordinary people'),
 item('What do storm chasers do?','Scientists study how tornadoes form. Others try to take good photos.','The two groups have different aims.','Track 093 · learn how tornadoes form / get good photos'),
 item('What is a common time of day to see a tornado?','Between 4 p.m. and 9 p.m.','Listen for the two time expressions.','Track 093 · between 4 p.m. and 9 p.m.'),
 item('Why are tornadoes dangerous?','They are unpredictable and can destroy houses and trees. Some storm chasers have died.','The recording describes unpredictability and consequences.','Track 093 · unpredictable / destroy houses and trees')
 ]}),
 step('opener-talk','Would you be a storm chaser?','Pairs · 45 seconds. Ask why people chase storms. Then tell your partner whether you would do it.',{timer:45,open:true,items:[item('Would you like to be a storm chaser? Why or why not?','I wouldn’t because I would be worried about getting too close.','State a choice and give a reason.','Use one idea from the photo or listening.')]}),
 step('12a','12A · What if …?','Discussing unlikely situations with real science',{image:media+'lightning.jpg',hero:true}),
 step('aims','Aims','By the end of the lesson, you will be able to …',{notes:[
 ['Knowledge','Recognise four types of extreme weather.','Identify the form and meaning of the second conditional.'],
 ['Skills','Use information from the article to answer six Yes/No questions.','Use the second conditional in a pair discussion about hopes and dreams.'],
 ['Attitude','Listen to and record information from each group member.','Give your partner time to answer and ask one relevant follow-up question.']]}),
 step('act1','Act 1 · Extreme weather','Match the four photos to the weather words. Compare with a partner and point to a detail.',{image:media+'weather.jpg',items:[
 item('Photo A','snowstorm','The snow reduces visibility along the road.','Photo A',['flood','hail','snowstorm','thunder and lightning']),
 item('Photo B','flood','Water covers the area around the buildings.','Photo B',['flood','hail','snowstorm','thunder and lightning']),
 item('Photo C','thunder and lightning','The bright flash is lightning.','Photo C',['flood','hail','snowstorm','thunder and lightning']),
 item('Photo D','hail','The objects in the hands are pieces of ice.','Photo D',['flood','hail','snowstorm','thunder and lightning'])
 ]}),
 step('act2','Act 2 · Talk about your weather','Think individually, then compare with a partner. Start with the weather you can see today.',{open:true,items:[
 item('Which parts of the world often have this extreme weather?','Places with very cold winters can get snowstorms.','Name a region or a climate and link it to an event.','Use the weather words from Act 1.'),
 item('Which events happen in your country? When?','We sometimes get floods during the rainy season.','Give an event and a time of year.','Use your local experience.'),
 item('What’s the weather like today? Is it normal for the season?','It’s cloudy and humid. That’s normal for this season here.','Describe today and compare it with a normal day.','Look outside or use a local observation.')
 ]}),
 readingStep('act3','Act 3 · Read for gist','Skim the whole article. Decide what kind of questions Randall answers.',{items:[item('What kind of questions does Randall answer?','Questions about unlikely or impossible situations.','The opening paragraph gives the purpose of the blog.','questions about unlikely or impossible things')]}),
 ...(reading==='jigsaw' ? [
 readingStep('read-part','Read your part','Individually · 2 minutes. Select your number. Find the required details and underline one useful phrase.',{report:'read',timer:120}),
 readingStep('meet-number','Meet your number','Pairs · 90 seconds. Sit with someone who has the same number. Compare your notes with the text and agree on what to report.',{report:'meet',timer:90}),
 readingStep('return-report','Return and report','Home groups · 2 minutes. Each person reports for 30 seconds. Listeners note the key details from parts 1–4.',{report:'return',timer:120})
 ] : [
 readingStep('scan','Scan for details','Individually · 2 minutes. Use the four prompts to find details across the whole article.',{report:'return',timer:120}),
 readingStep('compare','Compare and justify','Pairs · 90 seconds. Compare notes and point to one sentence that settles a disagreement.',{report:'meet',timer:90})
 ]),
 readingStep('act4','Act 4 · Yes or No','Answer all six questions individually. Use the passage to check after you have tried.',{items:act4}),
 step('act5','Act 5 · Second conditional','Pairs: identify the condition and result. Then choose the four rules individually.',{notes:[['From the article',passage[2].split(' And if ')[1].replace(/^the/,'If the')]],items:[
 item('Which is the usual pattern?','if + past simple, would + base verb','The if-clause gives the condition and would introduces the result.','if … hit / would spread',['if + past simple, would + base verb','if + present simple, will + base verb']),
 item('What kind of situations does it describe?','Unlikely or impossible situations','The speaker imagines a situation.','The lightning scenario is hypothetical.',['Real situations','Unlikely or impossible situations']),
 item('What time does the situation refer to?','Present or future','The past form marks distance from reality here.','The imagined strike is a possible scenario.',['The past','Present or future']),
 item('When do we normally separate the clauses with a comma?','When the if-clause comes first','The comma marks the end of the introductory if-clause.','If … hit the water near you, …',['When the if-clause comes first','When the if-clause comes second'])
 ]}),
 step('act6','Act 6 · Build the sentences','Pairs. Arrange each set of chunks, then write the sentence.',{items:[
 item("If / time, / I / had / you / help / I / with / your / ’d / homework","If I had time, I’d help you with your homework.","Put the if-clause first and add a comma.","If I had time"),
 item("You / need / help / wouldn’t / listened / class / if / you / in","You wouldn’t need help if you listened in class.","Start with the result. The if-clause follows.","wouldn’t need"),
 item("Would / you / for / ask / friends / your / money / if / didn’t / you / have / any","Would you ask your friends for money if you didn’t have any?","In a question, would comes before the subject.","Would you ask"),
 item("I / ancient / Rome / ’d / visit / if / time / travel / possible / was","I’d visit ancient Rome if time travel was possible.","The result comes first and the if-clause gives the condition.","’d visit / if … was"),
 item("They / use / translator / a / wouldn’t / English / they / if / spoke","They wouldn’t use a translator if they spoke English.","Use would not plus a base verb in the result.","wouldn’t use"),
 item("If / business, / a / new / started / you / would / produce / what / you","If you started a new business, what would you produce?","The main clause is a wh-question.","what would you produce")
 ]}),
 step('act7','Act 7 · The Gulf Stream','Complete the paragraph individually. Compare your verb choices with a partner.',{items:[
 item('If the Gulf Stream ___ (stop) flowing, Europe ___ (be) very different.','stopped / would be','Use past simple in the if-clause and would in the result.','If the Gulf Stream …'),
 item('Countries like Great Britain ___ (become) much colder.','would become','This is a consequence of the imagined change.','… Europe would be very different.'),
 item('If the sea was colder, spring and summer ___ (not / last) as long.','wouldn’t last','Use wouldn’t + base verb for a negative result.','If the sea was colder'),
 item('Farmers ___ (not / be able to) produce certain types of food and heating costs ___ (go up).','wouldn’t be able to / would go up','Both describe consequences of the same hypothesis.','… produce certain types of food / heating costs'),
 item('If we ___ (not / have) the Gulf Stream, many Europeans ___ (have to) change the way they live.','didn’t have / would have to','Negative past simple gives the condition. Would introduces the consequence.','If we … the Gulf Stream')
 ]}),
 step('act8','Act 8 · Imagine the opposite','Write individually. Swap with a partner and check the condition, result and meaning.',{items:[
 item('It doesn’t rain here, so the land is very dry.','If it rained, the land wouldn’t be as dry.','Imagine rain and reverse the result.','doesn’t rain / very dry'),
 item('The river never floods, so we don’t have to leave our homes.','If the river flooded, we would have to leave our homes.','Reverse the condition and result.','never floods / don’t have to leave'),
 item('We don’t get hot temperatures, so we don’t need air conditioning.','If we got hot temperatures, we would need air conditioning.','Got gives the imagined condition.','don’t get / don’t need'),
 item('We check the forecast every day because there are sudden tornadoes.','If there weren’t sudden tornadoes, we wouldn’t have to check the forecast all the time.','Imagine the tornadoes were absent.','there are sudden tornadoes'),
 item('It doesn’t snow here in winter, so we can drive to work every day.','If it snowed here in winter, we wouldn’t be able to drive to work every day.','Reverse the condition and describe the result.','doesn’t snow / can drive')
 ]}),
 step('act9','Act 9 · Listen and shadow','Count would, wouldn’t and ’d. Compare with a partner, then replay and say the lines just behind the speakers.',{audio:media+'track-095.mp3',items:[
 item('How many examples do you hear in total?','8','Count two would, two wouldn’t and four ’d forms.','Would you move …? · I’d love it … · I’d go … · Would you? · I wouldn’t want … · I’d find … · I wouldn’t … · I’d spend …')
 ]}),
 step('act10','Act 10 · Hopes and dreams','Think for 30 seconds. Work in pairs. Ask, answer and add one follow-up question.',{timer:30,open:true,items:speaking}),
 step('exit','Exit ticket','Write one new What if …? question and answer it with a reason.',{open:true,items:[item('What would you do if the summers became much hotter?','If the summers became much hotter, I’d spend more time indoors because it would be cooler.','The answer gives an imagined condition, a result and a reason.','If + past simple / would + base verb')]}),
 step('thanks','Thank you','Life 12A · What if …?',{image:media+'lightning.jpg',hero:true})
 ];
}
