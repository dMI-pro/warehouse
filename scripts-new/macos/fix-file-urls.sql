-- Нормализация products.images к object keys (products/....webp)
-- Убирает http(s)://... и префикс /minio/<bucket>/

UPDATE products
SET images = ARRAY(
  SELECT
    CASE
      WHEN img ~ '^https?://' THEN
        regexp_replace(
          regexp_replace(img, '^https?://[^/]+', ''),
          '^/?(minio/)?antiquar-products/',
          ''
        )
      WHEN img LIKE '/minio/antiquar-products/%' THEN
        substring(img from length('/minio/antiquar-products/') + 1)
      WHEN img LIKE 'minio/antiquar-products/%' THEN
        substring(img from length('minio/antiquar-products/') + 1)
      WHEN img LIKE '/antiquar-products/%' THEN
        substring(img from length('/antiquar-products/') + 1)
      WHEN img LIKE 'antiquar-products/%' THEN
        substring(img from length('antiquar-products/') + 1)
      WHEN img LIKE '/%' THEN
        substring(img from 2)
      ELSE img
    END
  FROM unnest(images) AS img
  WHERE img IS NOT NULL AND btrim(img) <> ''
)
WHERE images IS NOT NULL
  AND cardinality(images) > 0
  AND EXISTS (
    SELECT 1 FROM unnest(images) AS img
    WHERE img ~ '^https?://'
       OR img LIKE '/minio/%'
       OR img LIKE 'minio/%'
       OR img LIKE '/antiquar-products/%'
       OR img LIKE 'antiquar-products/%'
  );
