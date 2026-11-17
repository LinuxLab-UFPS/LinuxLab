/** Correo electronico con el formato historico del proyecto. */
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/**
 * Prioridades de aprovisionamiento. El orden jerarquico vive en el dato, no en
 * el codigo: docentes (10) antes que grupos (5) antes que estudiantes (1).
 */
const PRIORITIES = Object.freeze({
  TEACHER: 10,
  GROUP: 5,
  STUDENT: 1,
})

/**
 * Intensidad del curso que figura en los certificados. Es la misma para todos
 * los cursos porque todos siguen el mismo temario.
 */
const COURSE_HOURS = 80

module.exports = { EMAIL_REGEX, PRIORITIES, COURSE_HOURS }
