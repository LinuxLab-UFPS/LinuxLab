-- Reconstruye los eventos 'student_joined' que no se registraron por el bug
-- del enum. La matricula si quedo en Enrollment, asi que la fecha de creacion
-- de esa fila es la del evento perdido.
--
-- Es idempotente: el NOT EXISTS evita duplicar si se corre dos veces.
INSERT INTO "AuditEvent" (id, user_id, user_role, group_id, event_type, message, created_at, updated_at)
SELECT gen_random_uuid(),
       u.id,
       'student',
       e.group_id,
       'student_joined',
       'Se matriculó por vínculo en el curso ' || g.name || '.',
       e.created_at,
       now()
FROM "Enrollment" e
JOIN "User"  u ON u.id = e.student_id
JOIN "Group" g ON g.id = e.group_id
WHERE e.created_at >= TIMESTAMP '2026-09-08 00:00:00'
  AND NOT EXISTS (
    SELECT 1 FROM "AuditEvent" a
    WHERE a.user_id = u.id
      AND a.group_id = e.group_id
      AND a.event_type IN ('student_joined', 'student_registered')
  );
