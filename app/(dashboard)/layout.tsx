import Link from 'next/link'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <header className="py-4 bg-white shadow-sm dark:bg-gray-800">
        <div className="container flex items-center justify-between">
          <h1 className="text-xl font-bold">BizLevel</h1>
          <nav className="space-x-4">
            <Link href="/" className="hover:underline">
              Главная
            </Link>
            <Link href="/profile" className="hover:underline">
              Профиль
            </Link>
          </nav>
        </div>
      </header>
      <main>{children}</main>
    </div>
  )
} 