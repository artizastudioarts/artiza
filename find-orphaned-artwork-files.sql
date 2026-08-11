-- Safe, read-only — just shows you which files in the "artwork" bucket
-- are orphaned (no product, homepage video, or carousel image currently
-- points to them). Doesn't delete anything.
--
-- Run this first, review the list, THEN delete those specific files
-- manually via Storage -> artwork bucket in the dashboard.

with used_urls as (
  select image_url as url from products where image_url is not null
  union
  select unnest(image_urls) as url from products
  union
  select video_url as url from home_content where video_url is not null
  union
  select image_url as url from home_carousel_images
),
used_paths as (
  select split_part(url, '/artwork/', 2) as path from used_urls
)
select o.name as orphaned_file
from storage.objects o
where o.bucket_id = 'artwork'
  and o.name not like 'reviews/%'
  and o.name not in (select path from used_paths)
order by o.name;
