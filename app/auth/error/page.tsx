export default function AuthErrorPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white border border-slate-200 rounded-lg p-6 shadow-sm text-center space-y-3">
        <h1 className="text-xl font-semibold text-slate-900">Authentication Error</h1>
        <p className="text-sm text-slate-600">
          Too many requests or invalid link. Please try again in a moment.
        </p>
        <a
          href="/auth/login"
          className="inline-flex justify-center rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
        >
          Back to login
        </a>
      </div>
    </div>
  );
}
