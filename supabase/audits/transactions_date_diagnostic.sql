BEGIN TRANSACTION READ ONLY;

-- Anonymous diagnostic for the rows flagged by remote_backend_audit.sql.
-- No identifiers or transaction content are returned.
WITH extracted AS (
  SELECT
    date,
    date_iso,
    type,
    CASE
      WHEN lower(btrim(origin)) IN ('manual', 'manuell', 'manuel', 'handmatig', 'manuale') THEN 'manual'
      WHEN lower(btrim(origin)) IN ('statement', 'extrato', 'extracto', 'kontoauszug', 'relevé', 'afschrift', 'estratto conto') THEN 'csv_import'
      ELSE 'other'
    END AS source,
    regexp_match(btrim(date), '^([0-9]{1,2})[[:space:]]+(.+)[[:space:]]+([0-9]{4})$') AS day_text_parts,
    regexp_match(btrim(date), '^([0-9]{4})-([0-9]{2})-([0-9]{2})$') AS iso_parts,
    regexp_match(btrim(date), '^([0-9]{1,2})[/.-]([0-9]{1,2})[/.-]([0-9]{4})$') AS numeric_parts,
    regexp_match(btrim(date), '^(.+)[[:space:]]+([0-9]{1,2}),?[[:space:]]+([0-9]{4})$') AS month_text_parts
  FROM public.transactions
), normalized AS (
  SELECT
    *,
    CASE lower(day_text_parts[2])
      WHEN 'january' THEN 1 WHEN 'janeiro' THEN 1 WHEN 'enero' THEN 1 WHEN 'januar' THEN 1 WHEN 'janvier' THEN 1 WHEN 'januari' THEN 1 WHEN 'gennaio' THEN 1
      WHEN 'february' THEN 2 WHEN 'fevereiro' THEN 2 WHEN 'febrero' THEN 2 WHEN 'februar' THEN 2 WHEN 'février' THEN 2 WHEN 'februari' THEN 2 WHEN 'febbraio' THEN 2
      WHEN 'march' THEN 3 WHEN 'março' THEN 3 WHEN 'marzo' THEN 3 WHEN 'märz' THEN 3 WHEN 'mars' THEN 3 WHEN 'maart' THEN 3
      WHEN 'april' THEN 4 WHEN 'abril' THEN 4 WHEN 'avril' THEN 4 WHEN 'aprile' THEN 4
      WHEN 'may' THEN 5 WHEN 'maio' THEN 5 WHEN 'mayo' THEN 5 WHEN 'mai' THEN 5 WHEN 'mei' THEN 5 WHEN 'maggio' THEN 5
      WHEN 'june' THEN 6 WHEN 'junho' THEN 6 WHEN 'junio' THEN 6 WHEN 'juni' THEN 6 WHEN 'juin' THEN 6 WHEN 'giugno' THEN 6
      WHEN 'july' THEN 7 WHEN 'julho' THEN 7 WHEN 'julio' THEN 7 WHEN 'juli' THEN 7 WHEN 'juillet' THEN 7 WHEN 'luglio' THEN 7
      WHEN 'august' THEN 8 WHEN 'agosto' THEN 8 WHEN 'augustus' THEN 8 WHEN 'août' THEN 8
      WHEN 'september' THEN 9 WHEN 'setembro' THEN 9 WHEN 'septiembre' THEN 9 WHEN 'septembre' THEN 9 WHEN 'settembre' THEN 9
      WHEN 'october' THEN 10 WHEN 'outubro' THEN 10 WHEN 'octubre' THEN 10 WHEN 'oktober' THEN 10 WHEN 'octobre' THEN 10 WHEN 'ottobre' THEN 10
      WHEN 'november' THEN 11 WHEN 'novembro' THEN 11 WHEN 'noviembre' THEN 11 WHEN 'novembre' THEN 11
      WHEN 'december' THEN 12 WHEN 'dezembro' THEN 12 WHEN 'diciembre' THEN 12 WHEN 'dezember' THEN 12 WHEN 'décembre' THEN 12 WHEN 'decembre' THEN 12 WHEN 'dicembre' THEN 12
      ELSE NULL
    END AS recognized_text_month
  FROM extracted
), divergences AS (
  SELECT *
  FROM normalized
  WHERE day_text_parts IS NULL
     OR recognized_text_month IS NULL
     OR day_text_parts[1]::integer <> extract(day FROM date_iso)::integer
     OR recognized_text_month <> extract(month FROM date_iso)::integer
     OR day_text_parts[3]::integer <> extract(year FROM date_iso)::integer
), classified AS (
  SELECT
    source,
    type AS transaction_type,
    date_iso IS NOT NULL AS date_iso_valid,
    CASE
      WHEN iso_parts IS NOT NULL THEN 'YYYY-MM-DD'
      WHEN numeric_parts IS NOT NULL AND position('/' IN date) > 0 THEN 'numeric_with_slashes'
      WHEN numeric_parts IS NOT NULL AND position('.' IN date) > 0 THEN 'numeric_with_dots'
      WHEN numeric_parts IS NOT NULL THEN 'numeric_with_hyphens'
      WHEN day_text_parts IS NOT NULL THEN 'day_text-month_year'
      WHEN month_text_parts IS NOT NULL THEN 'text-month_day_year'
      WHEN btrim(date) = '' THEN 'blank'
      ELSE 'unknown'
    END AS date_format_pattern,
    CASE
      WHEN iso_parts IS NOT NULL
       AND iso_parts[1]::integer = extract(year FROM date_iso)::integer
       AND iso_parts[2]::integer = extract(month FROM date_iso)::integer
       AND iso_parts[3]::integer = extract(day FROM date_iso)::integer
        THEN 'translation/localization'
      WHEN numeric_parts IS NOT NULL
       AND numeric_parts[1]::integer = extract(day FROM date_iso)::integer
       AND numeric_parts[2]::integer = extract(month FROM date_iso)::integer
       AND numeric_parts[3]::integer = extract(year FROM date_iso)::integer
        THEN 'translation/localization'
      WHEN numeric_parts IS NOT NULL
       AND numeric_parts[1]::integer = extract(month FROM date_iso)::integer
       AND numeric_parts[2]::integer = extract(day FROM date_iso)::integer
       AND numeric_parts[3]::integer = extract(year FROM date_iso)::integer
        THEN 'day/month order'
      WHEN day_text_parts IS NOT NULL AND recognized_text_month IS NOT NULL
       AND day_text_parts[1]::integer = extract(day FROM date_iso)::integer
       AND recognized_text_month = extract(month FROM date_iso)::integer
       AND day_text_parts[3]::integer = extract(year FROM date_iso)::integer
        THEN 'textual month'
      WHEN day_text_parts IS NOT NULL AND recognized_text_month IS NOT NULL
        THEN 'real day/month/year difference'
      WHEN month_text_parts IS NOT NULL
        THEN 'day/month order'
      WHEN day_text_parts IS NOT NULL
        THEN 'translation/localization'
      ELSE 'unknown format'
    END AS probable_cause
  FROM divergences
)
SELECT
  date_format_pattern,
  probable_cause,
  source,
  transaction_type,
  date_iso_valid,
  count(*)::bigint AS transaction_count
FROM classified
GROUP BY date_format_pattern, probable_cause, source, transaction_type, date_iso_valid
ORDER BY date_format_pattern, probable_cause, source, transaction_type, date_iso_valid;

ROLLBACK;
