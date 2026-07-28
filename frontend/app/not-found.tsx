import Link from "next/link"
import { FileQuestion } from "lucide-react"

export default function NotFoundPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#1b2433] p-4">
      <div className="w-full max-w-md bg-white rounded-xl shadow-xl px-8 py-10 text-center">
        <div className="w-16 h-16 mx-auto mb-6 bg-warning/10 rounded-xl flex items-center justify-center">
          <FileQuestion className="w-8 h-8 text-warning" />
        </div>
        <h1 className="text-2xl font-bold text-[#1c2128]">Page not found</h1>
        <p className="text-[#5b626b] mt-2 text-sm leading-relaxed">
          The page you are looking for does not exist or has been moved.
          Check the URL or go back to the home page.
        </p>
        <Link
          href="/"
          className="mt-8 inline-block h-11 leading-[44px] px-6 rounded-md bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors text-sm"
        >
          Back to home
        </Link>
      </div>
    </div>
  )
}
