/**
 * Traduce los codigos de error de Firebase a algo que un estudiante entienda.
 *
 * La regla de oro: un codigo que no este aqui acaba en el texto de respaldo, y
 * un respaldo generico no dice que hacer. Eso fue exactamente lo que dejo a los
 * estudiantes sin poder registrarse: Firebase rechazaba la contrasena por su
 * politica y ellos solo veian "No se pudo crear la cuenta".
 */
export function mapFirebaseError(code: string | undefined, fallback: string): string {
  switch (code) {
    // --- Credenciales ---
    // Con la proteccion de enumeracion de correos activada, Firebase devuelve
    // este mismo codigo tanto si la cuenta no existe como si la contrasena esta
    // mal, asi que el mensaje tiene que contemplar las dos cosas.
    case "auth/invalid-credential":
    case "auth/wrong-password":
    case "auth/user-not-found":
      return "Correo o contraseña incorrectos. Si aún no tienes cuenta, regístrate."
    case "auth/invalid-email":
      return "El correo no es válido."
    case "auth/missing-password":
      return "Escribe tu contraseña."
    case "auth/email-already-in-use":
      return "Este correo ya está registrado. Inicia sesión."

    // --- Contrasena ---
    // `weak-password` es la regla vieja (solo longitud). El otro lo emite
    // Firebase cuando el proyecto tiene una politica de contrasenas propia; el
    // detalle de que requisito falta lo da `validatePassword` en el formulario,
    // asi que aqui basta con no mentir.
    case "auth/weak-password":
      return "La contraseña es muy débil. Usa al menos 6 caracteres."
    case "auth/password-does-not-meet-requirements":
      return "La contraseña no cumple los requisitos. Revisa la lista bajo el campo."

    // --- Configuracion del servidor, no culpa de quien lo intenta ---
    case "auth/operation-not-allowed":
      return "El inicio de sesión con correo no está habilitado. Avisa al administrador."
    case "auth/admin-restricted-operation":
      return "El registro con correo está deshabilitado. Avisa al administrador."
    case "auth/unauthorized-domain":
      return "Este sitio no está autorizado para iniciar sesión. Avisa al administrador."
    case "auth/invalid-api-key":
    case "auth/api-key-not-valid":
      return "La configuración de acceso es incorrecta. Avisa al administrador."

    // --- Estado de la cuenta ---
    case "auth/user-disabled":
      return "Cuenta desactivada. Contacta al administrador."
    case "auth/requires-recent-login":
      return "Sesión expirada. Inicia de nuevo."

    // --- Enlaces de correo ---
    case "auth/invalid-action-code":
      return "El enlace no es válido o ya se usó. Solicita uno nuevo."
    case "auth/expired-action-code":
      return "El enlace expiró. Solicita uno nuevo."

    // --- Red y limites ---
    case "auth/too-many-requests":
      return "Demasiados intentos. Intenta más tarde."
    case "auth/quota-exceeded":
      return "El servicio está saturado. Intenta en unos minutos."
    case "auth/network-request-failed":
      return "Error de conexión. Verifica tu internet."
    case "auth/internal-error":
      return "Firebase falló al procesar la solicitud. Intenta de nuevo."

    // --- Ventana de Google ---
    case "auth/popup-closed-by-user":
      return "Ventana de inicio cerrada."
    case "auth/cancelled-popup-request":
      return "Solicitud cancelada."
    case "auth/popup-blocked":
      return "El navegador bloqueó la ventana. Permite popups e inténtalo de nuevo."

    default:
      return fallback
  }
}

/** El codigo de un error de Firebase, si lo trae. */
export function errorCodeOf(e: unknown): string | undefined {
  if (typeof e === "object" && e !== null && "code" in e) {
    const c = (e as { code?: unknown }).code
    if (typeof c === "string") return c
  }
  return undefined
}

/**
 * Traduce solo lo que viene de Firebase; lo demas se deja pasar tal cual.
 *
 * `mapFirebaseError` a secas se estaba usando tambien con los errores del
 * backend, y como `ApiError` lleva `status` y no `code`, su mensaje —que ya
 * viene en espanol y dice la causa real, por ejemplo que el codigo estudiantil
 * esta repetido— se sustituia por el respaldo generico y se perdia.
 */
export function messageForAuthError(e: unknown, fallback: string): string {
  const code = errorCodeOf(e)
  if (code?.startsWith("auth/")) {
    // Se registra tambien en produccion, y a proposito: hasta ahora el codigo
    // real se descartaba sin dejar rastro, asi que un fallo solo se podia
    // diagnosticar espiando la peticion a identitytoolkit. El codigo por si
    // solo no revela nada del usuario.
    console.error("[auth] Firebase rechazó la operación:", code)
    return mapFirebaseError(code, fallback)
  }
  // Un error del backend ya trae su propio mensaje util.
  if (e instanceof Error && e.message) return e.message
  return fallback
}
