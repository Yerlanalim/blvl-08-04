export default function DashboardPage() {
  return (
    <div className="container py-8">
      <h1 className="mb-6 text-3xl font-bold">Карта уровней</h1>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="p-6 bg-white rounded-lg shadow-md dark:bg-gray-800">
            <h2 className="mb-2 text-xl font-semibold">Уровень {i + 1}</h2>
            <p className="mb-4 text-gray-500 dark:text-gray-400">
              Описание уровня будет здесь
            </p>
            <div className="flex justify-end">
              <button className="px-4 py-2 text-white bg-blue-600 rounded hover:bg-blue-700">
                Начать
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
} 