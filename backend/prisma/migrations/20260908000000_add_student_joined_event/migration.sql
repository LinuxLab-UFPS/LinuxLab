-- AlterEnum: matricularse por el vinculo de invitacion no es lo mismo que ser
-- matriculado por el docente, y la bitacora debe distinguirlos. Sin este valor
-- el evento fallaba al escribirse y la inscripcion quedaba sin registrar.
--
-- Va con IF NOT EXISTS porque el valor pudo anadirse a mano al diagnosticar el
-- incidente: sin esa guarda, la migracion falla con 42710 en cualquier base
-- donde ya se haya aplicado, y ese fallo bloquea el arranque del backend.
ALTER TYPE "EventType" ADD VALUE IF NOT EXISTS 'student_joined';
