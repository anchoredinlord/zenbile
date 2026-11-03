export default function LoadingSpinner({ message = 'Loading...' }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 gap-4">
      <div className="relative w-12 h-12">
        <div className="w-12 h-12 rounded-full border-4 border-gray-100" />
        <div className="w-12 h-12 rounded-full border-4 border-primary-500 border-t-transparent
                        animate-spin absolute inset-0" />
      </div>
      <p className="text-gray-400 text-sm font-medium">{message}</p>
    </div>
  )
}
