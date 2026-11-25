import json, pathlib, uuid, copy, hashlib, re
import sys
root=pathlib.Path(sys.argv[1] if len(sys.argv)>1 else '.'); html=(root/'U4.2_FINAL_AUDITORIUM.html').read_text(); d=json.JSONDecoder().raw_decode(html.split('const D=',1)[1])[0]; models=json.JSONDecoder().raw_decode(html.split('const animalModels=',1)[1])[0]; orig=json.loads((root/'U4.2_ELEAP_NATIVE.json').read_text()); assets={}; screens=[]; audit=[]
def uid(s):return str(uuid.uuid5(uuid.NAMESPACE_URL,'eleap:u4.2:'+s))
def photo(key,alt):
 src=d['images'].get(key) or d['assets'][key]; data=src.split(',',1)[1]; h=hashlib.sha256(data.encode()).hexdigest(); aid='document:'+uid(h); assets[aid]={'id':aid,'name':key.replace(':','-')+'.jpg','type':'image/jpeg','base64':data}; return {'type':'image','content':{'assetId':aid,'alt':alt,'caption':'','fit':'contain'}}
def text(t):return {'type':'text','content':{'text':t,'role':'body'}}
def screen(title,stage,instruction,blocks,**kw):return dict(title=title,stage=stage,instruction=instruction,layout='standard',blocks=blocks,**kw)
identity=dict(institution='VIETNAM MILITARY MEDICAL UNIVERSITY',faculty='FACULTY OF FOREIGN LANGUAGES',lessonCode='UNIT 4.2')
screens.append(screen('As and Like','Cover','',[photo('tiger-family','Tiger and cub')],functional={'type':'lesson-part-cover','variant':'photo-right','values':dict(identity,lessonTitle='AS AND LIKE',course='OBJECTIVE FIRST B2',lecturer='Lecturer: M.A. Nguyen Tuan Anh',subtitle='Grammar · Vocabulary · Writing')}))
aims=['Distinguish the uses of as and like.','Identify compound adjectives and time expressions.','Apply target language in B2 transformations.','Construct a coherent exam-style essay.','Participate actively in pair and group tasks.','Demonstrate respect for wildlife through discussion.']
screens.append(screen('Aims of the lesson','Aims','By the end of the lesson, you will be able to:',[text('\n'.join(aims))],certified={'family':'aims','variant':'three-cards','values':dict(zip(['knowledge1','knowledge2','skills1','skills2','attitudes1','attitudes2'],aims))}))
# Exact writing evidence tuples embedded in FINAL.
writing={('Writing Folder 2 · Analyse','Read the model'):[('When zoos first opened','The paragraph develops the zoo note; the following paragraph develops farming. No separate paragraph develops the required wildlife-under-threat note.')]}
# Extract arrays directly; no source rewriting.
for title,tab,marker in [('Writing Folder 2 · Produce','Model','attachWritingEvidence(stage.querySelector(\'.source-text\'),[[0,\'I believe')]:
 start=html.index(marker)+len("attachWritingEvidence(stage.querySelector('.source-text'),")
 # JS strings here are single quoted, Python literal parser supports them
 import ast
 end=html.index(']]);',start)+2
 writing[(title,tab)]=[(q,w) for _,q,w in ast.literal_eval(html[start:end])]
for gi,g in enumerate(d['groups']):
 blocks=[]; steps=[]
 for ti,t in enumerate(g['tabs']):
  step=f'tab-{ti+1}';steps.append(dict(id=step,label=t['title'],instruction=t['instruction'])); bs=copy.deepcopy(t['blocks']);
  if g['title']=='Compound adjectives' and t['title']=='Observe':bs.insert(1,photo('polar-bear','Polar bear'))
  if g['title']=='Parts of animals':
   key={'Parrot':'parrot','Bear':'polar-bear','Tiger':'tiger-family'}.get(t['title'])
   if key:bs.insert(0,photo(key,t['title']));bs.insert(1,text('Point to each body part you select and explain its function.'))
   if t['title']=='Rhino':bs.insert(0,text('Picture the rhinoceros: identify the parts at the front of its head and at the rear of its body.'))
   if t['title']=='Describe':
    bs=[text('Choose an animal.\nis characterised by …\nis distinguished by …\nbe well adapted to …\nIts … enable it to …\nUnlike …, it relies on …')]
    for name,model in models.items():
     key={'Parrot':'parrot','Bear':'polar-bear','Tiger':'tiger-family'}.get(name)
     if key:bs.append(photo(key,name))
     bs.append({'type':'writing','activity':{'prompt':'Describe & identify: '+name,'modelAnswer':model,'rubric':''}})
  for bi,b in enumerate(bs):
   if b['type']=='image' and b['content']['assetId'] not in assets:b=photo(b['content']['assetId'],b['content']['alt'])
   a=b.get('activity'); tag=f'{gi}-{ti}-{bi}';b['id']='block-'+uid(tag); 
   if a is not None:
    a['id']='activity-'+uid(tag);a['type']=b['type'];
    if b['type']=='fill':
     for j,x in enumerate(a['items']):
      x.setdefault('id',str(j+1));
      if x.get('why'):a.setdefault('evidenceByItem',{})[x['id']]={'why':x['why']}
    if a.get('evidence') or a.get('why'):a['evidenceByItem']={'choice':{'quote':a.get('evidence',''),'why':a.get('why','')}}
   if len(g['tabs'])>1:b['comboStep']=step
   blocks.append(b)
  if (g['title'],t['title']) in writing:
   selected=[b for b in blocks if b.get('comboStep')==step and b['type']=='mcq'];
   for b,(q,w) in zip(selected,writing[(g['title'],t['title'])]):b['activity']['evidenceByItem']={'choice':{'quote':q,'why':w}}
  if g['title']=='Writing Folder 2 · Analyse' and t['title']=='Cohesion':
   quotes=json.JSONDecoder().raw_decode(html.split('const quotes=',1)[1].replace("'",'"'))[0] if False else None
   import ast
   for var in ['quotes','reasons']:
    raw=html.split('const '+var+'=',1)[1].split('];',1)[0]+']';
    if var=='quotes':qs=ast.literal_eval(raw)
    else:rs=ast.literal_eval(raw)
   fill=next(b for b in blocks if b.get('comboStep')==step and b['type']=='fill');
   for x,q,w in zip(fill['activity']['items'],qs,rs):fill['activity'].setdefault('evidenceByItem',{})[x['id']]={'quote':q,'why':w}
 kw={'composite':{'steps':steps}} if len(steps)>1 else {}; screens.append(screen(g['title'], 'Reading' if gi==2 else 'Writing' if gi in [8,9] else g['title'],steps[0]['instruction'],blocks,**kw))
 audit.append({'title':g['title'],'tabs':len(steps),'sourceBlocks':sum(len(t['blocks']) for t in g['tabs']),'mappedBlocks':len(blocks)})
screens.append(screen('Thank you','Thank You','',[photo('tiger-family','Tiger and cub in green habitat')],functional={'type':'thank-you','variant':'photo-hero','values':dict(identity,closingMessage='Thank you!',subtitle='Keep learning. Keep protecting wildlife.')}))
review=copy.deepcopy(orig['review']);review['notes']=review.get('notes',[])+['Reconstructed from U4.2_FINAL_AUDITORIUM.html, not independently verified against textbook.','Rhino photograph not embedded in FINAL; no offline replacement supplied.','Describe uses four separate model responses pending exact image-selection interaction.','Writing evidence display and layout require Studio acceptance.'];review.pop('status',None)
pkg=dict(schema=orig['schema'],lessonNumber=orig['lessonNumber'],courseProfileId='objective-first-b2',title=orig['title'],designProfile='objective-b2',screens=screens,assets=list(assets.values()),review=review)
for i,s in enumerate(screens):s['id']='screen-'+uid(str(i));
assert len(screens)==14 and sum(len(s.get('composite',{}).get('steps',[0])) for s in screens)==48
(root/'U4.2_GOLDEN_BLUEPRINT_R5_1.json').write_text(json.dumps(pkg,ensure_ascii=False,indent=2));print('slides',len(screens),'states',48,'assets',len(assets),'blocks',sum(len(s['blocks']) for s in screens));print(audit)
