import { login } from './actions'

export default function LoginPage({
  searchParams,
}: {
  searchParams: { error: string }
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-lg border border-gray-100">
        <h1 className="mb-6 text-center text-3xl font-extrabold text-gray-900">
          BabyCare Dashboard
        </h1>
        
        <form className="flex flex-col gap-4">
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700" htmlFor="email">
              Email
            </label>
            <input
              className="w-full rounded-lg border border-gray-300 p-3 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              id="email"
              name="email"
              type="email"
              required
            />
          </div>
          
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700" htmlFor="password">
              Contraseña
            </label>
            <input
              className="w-full rounded-lg border border-gray-300 p-3 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              id="password"
              name="password"
              type="password"
              required
            />
          </div>

          {searchParams?.error && (
            <p className="text-center text-sm text-red-500">
              {searchParams.error}
            </p>
          )}

          <button
            formAction={login}
            className="mt-4 w-full rounded-lg bg-blue-600 p-3 font-semibold text-white transition hover:bg-blue-700 active:scale-[0.98]"
          >
            Entrar
          </button>
        </form>
      </div>
    </div>
  )
}