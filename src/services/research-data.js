const API_BASE = '/api/research';

function safeJson(value) {
  try {
    return JSON.parse(JSON.stringify(value));
  } catch {
    return null;
  }
}

function makeClientEventId(prefix = 'event') {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return `${prefix}-${crypto.randomUUID()}`;
  }

  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    credentials: 'same-origin',
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    }
  });

  let payload = null;

  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  if (!response.ok) {
    const error = new Error(
      payload?.error || `Research API request failed: ${response.status}`
    );

    error.status = response.status;
    error.payload = payload;

    throw error;
  }

  return payload;
}

export async function sendResearchEvent({
  clientEventId = null,
  sessionId = null,
  teacherId = null,
  classId = null,
  participantId = null,
  lessonId,
  activityId = null,
  eventType,
  answer = null,
  isCorrect = null,
  score = null,
  occurredAt = null,
  metadata = {}
}) {
  if (!lessonId || !eventType) {
    throw new Error('lessonId and eventType are required');
  }

  return request('/events', {
    method: 'POST',
    body: JSON.stringify({
      clientEventId:
        clientEventId || makeClientEventId(eventType),
      sessionId,
      teacherId,
      classId,
      participantId,
      lessonId,
      activityId,
      eventType,
      answer: safeJson(answer),
      isCorrect,
      score,
      occurredAt,
      metadata: safeJson(metadata) || {}
    })
  });
}

export async function getResearchEvents(query = {}) {
  const params = new URLSearchParams();

  Object.entries(query).forEach(([key, value]) => {
    if (
      value !== undefined &&
      value !== null &&
      value !== ''
    ) {
      params.set(key, String(value));
    }
  });

  const suffix = params.toString()
    ? `?${params.toString()}`
    : '';

  return request(`/events${suffix}`);
}

export async function getResearchClasses(query = {}) {
  const params = new URLSearchParams();

  Object.entries(query).forEach(([key, value]) => {
    if (
      value !== undefined &&
      value !== null &&
      value !== ''
    ) {
      params.set(key, String(value));
    }
  });

  const suffix = params.toString()
    ? `?${params.toString()}`
    : '';

  return request(`/classes${suffix}`);
}

export async function getResearchSessions(query = {}) {
  const params = new URLSearchParams();

  Object.entries(query).forEach(([key, value]) => {
    if (
      value !== undefined &&
      value !== null &&
      value !== ''
    ) {
      params.set(key, String(value));
    }
  });

  const suffix = params.toString()
    ? `?${params.toString()}`
    : '';

  return request(`/sessions${suffix}`);
}

export async function joinResearchSession({
  joinCode,
  studentUserId = null,
  participantCode = null,
  displayName = null
}) {
  return request('/participants', {
    method: 'POST',
    body: JSON.stringify({
      joinCode,
      studentUserId,
      participantCode,
      displayName
    })
  });
}

export function createResearchContext({
  sessionId = null,
  teacherId = null,
  classId = null,
  participantId = null,
  lessonId
}) {
  if (!lessonId) {
    throw new Error('lessonId is required');
  }

  return {
    sessionId,
    teacherId,
    classId,
    participantId,
    lessonId,

    send(event) {
      return sendResearchEvent({
        sessionId,
        teacherId,
        classId,
        participantId,
        lessonId,
        ...event
      });
    }
  };
}
