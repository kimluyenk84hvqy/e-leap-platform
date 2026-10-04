/**
 * E-LEAP Role Control Contract — LOCKED before U2.1
 * This file is the single source of truth for role-visible controls.
 * Do not rename/reorder/reassign controls except to fix a confirmed defect.
 */
export const ROLE_CONTROL_CONTRACT = Object.freeze({
  teacher: Object.freeze({
    activity: Object.freeze(['check','reset','reveal']),
    classroom: Object.freeze(['presentation','timer','responses','live']),
    utility: Object.freeze([])
  }),
  admin: Object.freeze({
    activity: Object.freeze(['check','reset','reveal']),
    classroom: Object.freeze(['presentation','timer','responses','live']),
    utility: Object.freeze(['edit'])
  }),
  student: Object.freeze({
    activity: Object.freeze(['check','reset','submit','score']),
    classroom: Object.freeze([]),
    utility: Object.freeze([])
  }),
  guest: Object.freeze({
    activity: Object.freeze(['check','reset','score']),
    classroom: Object.freeze([]),
    utility: Object.freeze([])
  }),
  presentation: Object.freeze({
    activity: Object.freeze(['reveal','reset']),
    classroom: Object.freeze(['exit-presentation']),
    utility: Object.freeze([])
  })
});

export const ROLE_CONTROL_SEMANTICS = Object.freeze({
  check: 'Evaluate the current activity state without submitting it.',
  reset: 'Restore the current activity to its initial state.',
  reveal: 'Show the answer/model answer. Teacher/Admin/Presentation only.',
  submit: 'Submit the current student attempt to Responses/Progress.',
  score: 'Show correct / total / percentage; unanswered stays in the denominator.',
  presentation: 'Enter presentation mode.',
  'exit-presentation': 'Exit presentation mode.',
  timer: 'Open classroom timer controls.',
  responses: 'Open the teacher Responses hub.',
  live: 'Open Live Class / QR controls.',
  edit: 'Open Edit in Studio/content administration when permitted.'
});

export const LOCKED_ROLE_CONTROL_VERSION = 'R4-RC1.4.5';
