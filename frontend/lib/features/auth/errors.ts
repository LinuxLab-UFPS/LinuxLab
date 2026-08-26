export function mapFirebaseError(code: string | undefined, fallback: string): string {
  switch (code) {
    case "auth/invalid-credential":
    case "auth/wrong-password":
    case "auth/user-not-found":
      return "Correo o contraseña incorrectos."
    case "auth/invalid-email":
      return "El correo no es válido."
    case "auth/email-already-in-use":
      return "Este correo ya está registrado. Inicia sesión."
    case "auth/weak-password":
      return "La contraseña es muy débil. Usa al menos 6 caracteres."
    case "auth/too-many-requests":
      return "Demasiados intentos. Intenta más tarde."
    case "auth/network-request-failed":
      return "Error de conexión. Verifica tu internet."
    case "auth/user-disabled":
      return "Cuenta desactivada. Contacta al administrador."
    case "auth/operation-not-allowed":
      return "Método de inicio no habilitado."
    case "auth/requires-recent-login":
      return "Sesión expirada. Inicia de nuevo."
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

export function errorCodeOf(e: unknown): string | undefined {
  if (typeof e === "object" && e !== null && "code" in e) {
    const c = (e as { code?: unknown }).code
    if (typeof c === "string") return c
  }
  return undefined
}
