-- 为 litigation_parties 表添加 is_primary 字段
ALTER TABLE litigation_parties ADD COLUMN is_primary BOOLEAN DEFAULT 0;

-- 为现有数据设置主要当事人（每个案件每个类型的第一个主体）
UPDATE litigation_parties
SET is_primary = 1
WHERE id IN (
  SELECT MIN(id)
  FROM litigation_parties
  GROUP BY case_id, party_type
);
