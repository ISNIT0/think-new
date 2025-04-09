export default function LoadingScreen() {
  return (
    <div className="flex items-center justify-center h-screen bg-gray-50">
      <div className="text-center p-8 bg-white rounded-xl shadow-lg">
        <div className="w-16 h-16 mx-auto mb-4 relative">
          <div className="absolute inset-0 rounded-full border-t-2 border-blue-500 animate-spin"></div>
          <div className="absolute inset-3 rounded-full bg-blue-50 flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
          </div>
        </div>
        <div className="text-xl font-medium text-gray-800 mb-2">Loading your agent</div>
        <div className="text-gray-500 text-sm max-w-xs">
          Please wait while we connect to your intelligent assistant...
        </div>
      </div>
    </div>
  );
} 