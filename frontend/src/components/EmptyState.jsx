export default function EmptyState({ icon = '📭', title, message, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-3 text-center px-4">
      <div className="w-20 h-20 bg-gray-100 rounded-3xl flex items-center justify-center text-4xl mb-1">
        {icon}
      </div>
      <h3 className="text-lg font-bold text-gray-700">{title}</h3>
      {message && <p className="text-gray-400 text-sm max-w-sm leading-relaxed">{message}</p>}
      {action}
    </div>
  )
}
