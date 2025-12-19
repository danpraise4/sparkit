const LoadingSpinner = () => {
  return (
    <div className="flex items-center justify-center min-h-screen" style={{ backgroundColor: '#F3EDF7' }}>
      <div className="text-center">
        <div className="relative mx-auto mb-4">
          <div className="w-16 h-16 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin"></div>
          <div className="absolute top-0 left-0 w-16 h-16 border-4 border-transparent border-t-pink-500 rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '0.8s' }}></div>
        </div>
        <p className="text-gray-600 font-medium">Loading...</p>
      </div>
    </div>
  )
}

export default LoadingSpinner

