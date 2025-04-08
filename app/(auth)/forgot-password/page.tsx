export default function ForgotPasswordPage() {
  return (
    <div className="container flex items-center justify-center min-h-screen py-12">
      <div className="w-full max-w-md space-y-6">
        <div className="space-y-2 text-center">
          <h1 className="text-3xl font-bold">Восстановление пароля</h1>
          <p className="text-gray-500 dark:text-gray-400">
            Введите ваш email для сброса пароля
          </p>
        </div>
        <div className="p-6 bg-white rounded-lg shadow-md dark:bg-gray-800">
          <p>Здесь будет форма восстановления пароля</p>
        </div>
      </div>
    </div>
  )
} 