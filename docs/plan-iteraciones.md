# Plan de iteraciones — fuente canónica

**Proyecto:** LinuxLab UFPS
**Uso:** contexto único para redactar y revisar los SRS de cada iteración y el
capítulo de implementación. Si hay discrepancia entre este documento y un SRS,
manda este documento.

---

## 1. Orden y contenido de las iteraciones

| N.º | Módulo | Casos de uso | RF / RNF | Duración declarada |
|-----|--------|--------------|----------|--------------------|
| 1 | Acceso y control de roles | CU01, CU02, CU03, CU04 | RNF-04 | 28 jun – 12 jul 2026 |
| 2 | Contenido académico y entorno Linux | CU11, CU12, CU14 | RNF-01, RNF-02, RNF-03, RNF-06, RNF-07, RNF-08 | 13 jul – 26 jul 2026 |
| 3 | Gestión docente y grupos de laboratorio | CU05, CU06, CU07, CU08, CU09, CU10 | — | 27 jul – 9 ago 2026 |
| 4 | Actividades y evaluación | CU13, CU15, CU16, CU17, CU18, CU19, CU20 | — | 10 ago – 23 ago 2026 |
| 5 | Seguimiento, auditoría y cierre | CU21, CU22, CU23, CU24, CU25, CU26, CU27 | RNF-05 | 24 ago – 5 sep 2026 |

Total: 27 casos de uso, 8 requerimientos no funcionales. CU02 incluye el RF-05
(control de roles), que es transversal a las rutas protegidas.

## 2. Extensión del modelo de datos por iteración

El diagrama de cada SRS es **acumulado** y marca con `classDef nueva` las
entidades que aparecen en ese ciclo.

| Iteración | Entidades nuevas | Notas |
|-----------|------------------|-------|
| 1 | `User`, `Student`, `Teacher`, `LinuxAccount`, `Job` | `Job` respalda la cola de aprovisionamiento que el alta de usuario/docente encola. `LinuxAccount` nace con `linux_provisioned = false`. |
| 2 | `Settings` | Preferencias del entorno (tema y tipografía de terminal, RF-19). `LinuxAccount` se materializa (`linux_provisioned = true`). El acceso de la terminal se valida por sesión y cuenta aprovisionada; el alcance por curso no pertenece a este ciclo. |
| 3 | `Group`, `Enrollment`, `TopicProgress`, `LessonView` | La matrícula habilita el avance del temario (CU11) y el aprovisionamiento por grupo. La terminal pasa a validar matrícula activa, la cuenta del estudiante se crea dentro del grupo Unix del curso y el teardown se ejecuta al archivar o finalizar. |
| 4 | `TopicActivity`, `TopicSubmission`, `GroupActivity`, `GroupSubmission`, `SubmissionAutoDetail`, `SubmissionManualDetail` | Banco de actividades, evaluación automática y revisión manual. |
| 5 | `Certificate`, `InstructorCertificate`, `AuditEvent` | Cierre del curso, certificados y consulta de bitácora. |

## 3. Atribución de pruebas por iteración

| Iteración | Suites | Pruebas |
|-----------|--------|---------|
| 1 | `tests/auth`, `tests/admin/registrarDocente` | 21 |
| 2 | `tests/preferences` (7), `tests/terminal` (HTTP 3, entorno 6, heartbeat 3, wsAuth 4, gateway 7) | 30 |
| 3 | `tests/temario` (8, avance), `tests/groups` (provisión 2, acceso terminal 2), `tests/admin/gestionDocentes` (CU05: 3) + nuevos de grupos | 15+ |
| 4 | `tests/activities`, `tests/submissions` (por construir) | — |
| 5 | `tests/certificates`, `tests/audit` (por construir) | — |

Comandos: `npm run test:it1`, `npm run test:it2`, `npm run test:it3` (desde `backend/`).

Total del proyecto con las iteraciones 1–3: 66 pruebas en verde (21 + 30 + 15).

## 4. Reglas de coherencia

1. La numeración de CU es la del Anexo A (CU01..CU27) y la del cuerpo del documento; no se usan esquemas alternos.
2. Un CU pertenece a una sola iteración, según la tabla del punto 1.
3. Las entidades del modelo se introducen una sola vez (punto 2) y se conservan en los diagramas posteriores.
4. Los RF/RNF de cada ciclo son los de la tabla del punto 1; el backlog de cada SRS no repite CUs ni inventa RNF fuera de lista.
5. El avance del temario y la matrícula pertenecen a la iteración 3.
6. CU14 se reparte entre las iteraciones 2 y 3: la iteración 2 entrega el entorno y la cuenta personal; la iteración 3 el alcance por curso (matrícula activa, grupo Unix y teardown). Las pruebas que dependen de matrícula o grupo Unix viven en `tests/groups`.
