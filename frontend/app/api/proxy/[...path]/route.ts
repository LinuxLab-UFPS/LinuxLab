import { type NextRequest, NextResponse } from "next/server"

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:3000"

async function handleRequest(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params
  const backendPath = "/" + path.join("/")

  const token = request.cookies.get("token")?.value

  const headers = new Headers(request.headers)
  headers.delete("host")

  if (token) {
    headers.set("Cookie", `token=${token}`)
  }

  const url = `${BACKEND_URL}${backendPath}${request.nextUrl.search}`

  const backendResponse = await fetch(url, {
    method: request.method,
    headers,
    body: request.method !== "GET" && request.method !== "HEAD"
      ? await request.text()
      : undefined,
  })

  const body = await backendResponse.text()
  const responseHeaders: Record<string, string> = {}
  const contentType = backendResponse.headers.get("content-type")
  if (contentType) responseHeaders["content-type"] = contentType

  return new NextResponse(body, {
    status: backendResponse.status,
    statusText: backendResponse.statusText,
    headers: responseHeaders,
  })
}

export const GET = handleRequest
export const POST = handleRequest
export const PUT = handleRequest
export const PATCH = handleRequest
export const DELETE = handleRequest
