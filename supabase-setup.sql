-- Supabase에서 아래 SQL을 실행하여 테이블을 생성하세요
-- (Supabase 대시보드 → SQL Editor 에서 실행)

CREATE TABLE calculations (
  id BIGSERIAL PRIMARY KEY,
  before_price NUMERIC NOT NULL,
  after_price NUMERIC NOT NULL,
  retracement_382 NUMERIC NOT NULL,
  retracement_500 NUMERIC NOT NULL,
  retracement_618 NUMERIC NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 누구나 읽고 쓸 수 있도록 RLS 정책 설정 (공개 앱용)
ALTER TABLE calculations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "누구나 읽기 가능" ON calculations
  FOR SELECT USING (true);

CREATE POLICY "누구나 저장 가능" ON calculations
  FOR INSERT WITH CHECK (true);
