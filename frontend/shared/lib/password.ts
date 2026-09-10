/**
 * La regla de contrasena, preguntandosela a quien manda.
 *
 * El minimo de 6 lo impone Firebase, pero un proyecto puede ademas configurar
 * una politica propia (mayuscula, digito, simbolo) desde su consola. Esa
 * politica no vive en este repositorio, asi que comprobar aqui solo la longitud
 * dejaba pasar contrasenas que el servidor rechazaba despues: el estudiante
 * escribia algo de siete caracteres, pasaba nuestro filtro y recibia un
 * "No se pudo crear la cuenta" que no explicaba nada.
 *
 * `validatePassword` del SDK consulta la politica real del proyecto y dice que
 * requisito falla. Asi la pantalla muestra lo que Firebase pide de verdad, y
 * sigue siendo cierta si manana lo cambian sin tocar el codigo.
 */
import { validatePassword } from "firebase/auth"
import { getFirebaseAuth } from "@/lib/features/auth/firebase"

/** El minimo que impone Firebase por debajo de cualquier politica. */
export const PASSWORD_MIN = 6

/** Un requisito de la politica, ya traducido y con su estado. */
export interface RequisitoPassword {
  id: string
  texto: string
  cumple: boolean
}

export interface EstadoPassword {
  /** Si se puede enviar el formulario. */
  valida: boolean
  /** Lo que pide la politica, en el orden en que se lee. */
  requisitos: RequisitoPassword[]
  /**
   * True cuando no se pudo consultar la politica y se cayo al minimo local.
   * La pantalla no debe bloquear el envio en ese caso: el fallo es nuestro.
   */
  sinPolitica: boolean
}

/** El estado local, para cuando la consulta a Firebase no esta disponible. */
function soloLongitud(password: string): EstadoPassword {
  const cumple = password.length >= PASSWORD_MIN
  return {
    valida: cumple,
    requisitos: [
      { id: "longitud", texto: `Al menos ${PASSWORD_MIN} caracteres`, cumple },
    ],
    sinPolitica: true,
  }
}

/**
 * Comprueba la contrasena contra la politica real del proyecto.
 *
 * Nunca lanza: si la consulta falla (sin red, configuracion incompleta) se
 * devuelve el minimo local con `sinPolitica`, porque impedir el registro por un
 * problema nuestro es peor que dejar que Firebase rechace la contrasena luego.
 */
export async function evaluarPassword(password: string): Promise<EstadoPassword> {
  let estado
  try {
    const { auth } = getFirebaseAuth()
    estado = await validatePassword(auth, password)
  } catch {
    return soloLongitud(password)
  }

  const politica = estado.passwordPolicy?.customStrengthOptions ?? {}
  const requisitos: RequisitoPassword[] = []

  // Cada campo viene `undefined` cuando la politica no exige ese requisito, asi
  // que solo se pinta lo que de verdad se pide.
  const minimo = politica.minPasswordLength ?? PASSWORD_MIN
  if (estado.meetsMinPasswordLength !== undefined || minimo) {
    requisitos.push({
      id: "longitud",
      texto: `Al menos ${minimo} caracteres`,
      cumple: estado.meetsMinPasswordLength ?? password.length >= minimo,
    })
  }
  if (politica.maxPasswordLength) {
    requisitos.push({
      id: "longitud-max",
      texto: `Como mucho ${politica.maxPasswordLength} caracteres`,
      cumple: estado.meetsMaxPasswordLength ?? true,
    })
  }
  if (estado.containsLowercaseLetter !== undefined) {
    requisitos.push({
      id: "minuscula",
      texto: "Una letra minúscula",
      cumple: estado.containsLowercaseLetter,
    })
  }
  if (estado.containsUppercaseLetter !== undefined) {
    requisitos.push({
      id: "mayuscula",
      texto: "Una letra mayúscula",
      cumple: estado.containsUppercaseLetter,
    })
  }
  if (estado.containsNumericCharacter !== undefined) {
    requisitos.push({
      id: "numero",
      texto: "Un número",
      cumple: estado.containsNumericCharacter,
    })
  }
  if (estado.containsNonAlphanumericCharacter !== undefined) {
    requisitos.push({
      id: "simbolo",
      texto: "Un símbolo (por ejemplo . - _ ! @ #)",
      cumple: estado.containsNonAlphanumericCharacter,
    })
  }

  return { valida: estado.isValid, requisitos, sinPolitica: false }
}

/**
 * El error de la contrasena para los formularios que no consultan la politica
 * (restablecer y crear cuenta de docente). Es la comprobacion minima.
 *
 * `tocado` evita gritarle a quien todavia no ha escrito nada.
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

/**
 * Devuelve el error de la confirmacion, o null si coincide.
 *
 * Mientras la contraseña este a medias no se dice nada: escribir seis caracteres
 * en el primer campo y ver "no coinciden" en el segundo es un error que se
 * corrige solo al seguir escribiendo.
 */
export function confirmError(password: string, confirm: string, tocado = true): string | null {
  if (!tocado && confirm.length === 0) return null
  if (confirm.length === 0) return "Repite la contraseña."
  if (password !== confirm) return "Las contraseñas no coinciden."
  return null
}
