interface ErrorStateProps {
    title: string;
    message: string;
}

export default function ErrorState({ title, message }: ErrorStateProps) {
    return (
        <div className="flex items-center justify-center h-screen bg-gray-50">
            <div className="text-center p-8 bg-white rounded-xl shadow-lg">
                <div className="w-16 h-16 mx-auto mb-4">
                    <div className="rounded-full bg-red-50 h-full w-full flex items-center justify-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                </div>
                <div className="text-xl font-medium text-gray-800 mb-2">{title}</div>
                <div className="text-gray-500 text-sm max-w-xs">
                    {message}
                </div>
            </div>
        </div>
    );
} 