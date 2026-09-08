/**
 * La regla de contrasena, en un solo sitio.
 *
 * El minimo de 6 lo impone Firebase (`createUserWithEmailAndPassword`), asi que
 * no es una eleccion nuestra: si se baja, el registro falla del lado del
 * proveedor con un mensaje en ingles que el estudiante no entiende. Vivia
 * repetida en el registro, en la creacion de cuenta del docente y en el
 * restablecimiento, y en los tres sitios solo se comprobaba al enviar.
 */
export const PASSWORD_MIN = 6

/**
 * Devuelve el error de la contrasena, o null si es valida.
 *
 * `tocado` evita gritarle a quien todavia no ha escrito nada: mientras el campo
 * este vacio y sin visitar no hay error que mostrar, aunque tampoco sea valida.
 */
export function passwordError(password: string, tocado = true): string | null {
  if (!tocado && password.length === 0) return null
  if (password.length === 0) return "Escribe una contraseña."
  if (password.length < PASSWORD_MIN) {
    return `La contraseña debe tener al menos ${PASSWORD_MIN} caracteres.`
  }
  return null
}

/** El texto de ayuda que acompana al campo antes de que haya error. */
export const PASSWORD_HINT = `Mínimo ${PASSWORD_MIN} caracteres.`
