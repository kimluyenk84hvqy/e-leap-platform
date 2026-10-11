let readyPromise=null;

export async function ensureMarkingSchema(sql){
  if(readyPromise)return readyPromise;
  readyPromise=(async()=>{
    await sql`CREATE TABLE IF NOT EXISTS grading_reviews (
      submission_id UUID PRIMARY KEY,
      assignment_id UUID NOT NULL,
      class_id UUID NOT NULL,
      reviewer_id UUID,
      state TEXT NOT NULL DEFAULT 'in-review',
      rubric_scores JSONB NOT NULL DEFAULT '{}'::jsonb,
      overall_comment TEXT,
      strengths JSONB NOT NULL DEFAULT '[]'::jsonb,
      priorities JSONB NOT NULL DEFAULT '[]'::jsonb,
      annotations JSONB NOT NULL DEFAULT '[]'::jsonb,
      ai_draft JSONB,
      revision INTEGER NOT NULL DEFAULT 1,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`;
    await sql`CREATE TABLE IF NOT EXISTS grading_history (
      grading_history_id BIGSERIAL PRIMARY KEY,
      submission_id UUID NOT NULL,
      assignment_id UUID NOT NULL,
      class_id UUID NOT NULL,
      actor_user_id UUID,
      action TEXT NOT NULL,
      state TEXT,
      score DOUBLE PRECISION,
      max_score DOUBLE PRECISION,
      rubric_scores JSONB,
      feedback TEXT,
      review_snapshot JSONB NOT NULL DEFAULT '{}'::jsonb,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`;
    await sql`CREATE INDEX IF NOT EXISTS idx_grading_reviews_assignment ON grading_reviews(assignment_id,state,updated_at)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_grading_history_submission ON grading_history(submission_id,created_at)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_grading_history_class ON grading_history(class_id,created_at)`;
  })().catch(err=>{readyPromise=null;throw err;});
  return readyPromise;
}
