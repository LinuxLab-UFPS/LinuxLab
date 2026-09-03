import { toast } from "sonner"

export const TOAST_DURATION_SUCCESS = 3000
export const TOAST_DURATION_ERROR = 6000

export interface ToastOptions {
  description?: string
  duration?: number
  id?: number | string
}

export interface PromiseToastOptions<T> {
  loading: string
  success: string | ((data: T) => string)
  error: string | ((e: unknown) => string)
  description?: string | ((data: T) => string)
  id?: number | string
  duration?: number
}

export function messageFromError(e: unknown, fallback: string): string {
  return e instanceof Error ? e.message : fallback
}

export function notifySuccess(message: string, opts?: ToastOptions) {
  return toast.success(message, {
    description: opts?.description,
    duration: opts?.duration ?? TOAST_DURATION_SUCCESS,
    id: opts?.id,
  })
}

export function notifyError(e: unknown, fallback: string, opts?: ToastOptions) {
  return toast.error(messageFromError(e, fallback), {
    description: opts?.description,
    duration: opts?.duration ?? TOAST_DURATION_ERROR,
    id: opts?.id,
  })
}

export function notifyInfo(message: string, opts?: ToastOptions) {
  return toast.info(message, {
    description: opts?.description,
    duration: opts?.duration ?? TOAST_DURATION_SUCCESS,
    id: opts?.id,
  })
}

/**
 * Envuelve una operacion asincrona en un toast de carga que se resuelve solo:
 * spinner mientras corre, exito o error al terminar. Devuelve un resultado
 * discriminado para que el flujo continue solo en exito, sin importar que la
 * promesa resuelva `void`.
 */
export async function notifyPromise<T>(
  promise: Promise<T>,
  opts: PromiseToastOptions<T>,
): Promise<{ ok: true; data: T } | { ok: false }> {
  try {
    const data = await toast
      .promise(promise, {
        loading: opts.loading,
        success: (data) =>
          typeof opts.success === "function" ? opts.success(data) : opts.success,
        error: (e) =>
          typeof opts.error === "function" ? opts.error(e) : messageFromError(e, opts.error),
        description: opts.description
          ? (data) =>
              typeof opts.description === "function"
                ? opts.description(data)
                : opts.description
          : undefined,
        id: opts.id,
        duration: opts.duration,
      })
      .unwrap()
    return { ok: true, data }
  } catch {
    return { ok: false }
  }
}

/** Crea un toast de carga, o lo actualiza en el lugar si ya existe ese id. */
export function notifyLoading(message: string, opts?: ToastOptions) {
  return toast.loading(message, { id: opts?.id, duration: opts?.duration })
}

/** Resuelve un toast de carga (creado con notifyLoading y el mismo id). */
export function notifyResolve(
  id: number | string,
  opts: { ok: boolean; message: string; description?: string },
) {
  if (opts.ok) {
    notifySuccess(opts.message, { description: opts.description, id })
  } else {
    toast.error(opts.message, {
      description: opts.description,
      duration: TOAST_DURATION_ERROR,
      id,
    })
  }
}

/** ¿Sigue vivo un toast con ese id? Útil para toasts que cruzan navegaciones. */
export function hasToast(id: number | string): boolean {
  return toast.getToasts().some((t) => t.id === id)
}
export const notify = {
  success: notifySuccess,
  error: notifyError,
  info: notifyInfo,
  promise: notifyPromise,
  loading: notifyLoading,
  resolve: notifyResolve,
}
