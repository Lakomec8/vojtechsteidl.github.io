PRAGMA foreign_keys = ON;
-- Assign existing master PDF; no new upload or duplicate per student.
UPDATE student_profiles SET payload_json=json_insert(
  payload_json,'$.materials[#]',
  json_object(
    'title','Geometrie CERMAT — PDF noty a pracovní list',
    'meta','Přijímačky čtyřleté obory · 8 stran · 42 úloh s výsledky',
    'badge','PDF','badgeClass','pdf','kind','pdf',
    'date','2026-11-02','url','/student-portal/Library/matematika/Geometrie_CERMAT_4lete_2027_noty.pdf',
    'source','r2-library','libraryKey','library/matematika/Geometrie_CERMAT_4lete_2027_noty.pdf'
  )
), updated_at=CURRENT_TIMESTAMP
WHERE student_id IN ('adam','krystof')
  AND json_type(payload_json,'$.materials')='array'
  AND NOT EXISTS (
    SELECT 1 FROM json_each(student_profiles.payload_json,'$.materials') AS j
    WHERE json_extract(j.value,'$.libraryKey')='library/matematika/Geometrie_CERMAT_4lete_2027_noty.pdf'
       OR json_extract(j.value,'$.url')='/student-portal/Library/matematika/Geometrie_CERMAT_4lete_2027_noty.pdf'
  );

-- Put the notes first as the newest resource, keep all existing entries.
UPDATE student_profiles SET payload_json=json_set(
  payload_json,'$.materials',(
    SELECT json_group_array(json(item))
    FROM (
      SELECT json_set(
        value,'$.badge',
        CASE
          WHEN json_extract(value,'$.libraryKey')='library/matematika/Geometrie_CERMAT_4lete_2027_noty.pdf' THEN 'Aktuální PDF'
          WHEN json_extract(value,'$.badge') IN ('Aktuální PDF','Aktuální materiál','Nové PDF')
            THEN CASE WHEN json_extract(value,'$.kind')='interactive' THEN 'Interaktivní' ELSE 'PDF' END
          ELSE coalesce(json_extract(value,'$.badge'),'PDF')
        END
      ) AS item
      FROM json_each(student_profiles.payload_json,'$.materials')
      ORDER BY coalesce(json_extract(value,'$.date'),'') DESC,
               CASE WHEN json_extract(value,'$.libraryKey')='library/matematika/Geometrie_CERMAT_4lete_2027_noty.pdf' THEN 1 ELSE 0 END DESC,
               CAST(key AS INTEGER)
    )
  )
), updated_at=CURRENT_TIMESTAMP
WHERE student_id IN ('adam','krystof')
  AND json_type(payload_json,'$.materials')='array';
