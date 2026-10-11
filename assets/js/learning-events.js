/** E-LEAP Learning Event Contract v1.0
 * Content emits normalized events; persistence is injected separately.
 * No lesson owns student history. This keeps content portable and research data central.
 */
export class ELeapLearningEvents {
  constructor({resourceId, context={}, sink=null, source='native'}={}) {
    if(!resourceId) throw new Error('resourceId is required.');
    this.resourceId=resourceId;
    this.context={mode:'self-study',...context};
    this.sink=sink;
    this.source=source;
  }
  create(eventType,{activityId=null,studentId=null,sessionId=null,payload={}}={}){
    return {
      eventId:(globalThis.crypto?.randomUUID?.() || `evt-${Date.now()}-${Math.random().toString(16).slice(2)}`),
      eventType,
      occurredAt:new Date().toISOString(),
      resourceId:this.resourceId,
      activityId, studentId, sessionId,
      context:{...this.context}, payload:{...payload}, source:this.source
    };
  }
  async emit(eventType, details={}){
    const event=this.create(eventType,details);
    if(this.sink) await this.sink.write(event);
    globalThis.dispatchEvent?.(new CustomEvent('e-leap:learning-event',{detail:event}));
    return event;
  }
}

/** Development-only sink. Production will replace this with authenticated API storage. */
export class LocalEventSink {
  constructor(key='e-leap-learning-events'){this.key=key;}
  async write(event){
    const rows=JSON.parse(localStorage.getItem(this.key)||'[]');
    rows.push(event); localStorage.setItem(this.key,JSON.stringify(rows.slice(-500)));
    return event;
  }
  read(){return JSON.parse(localStorage.getItem(this.key)||'[]');}
  clear(){localStorage.removeItem(this.key);}
}
