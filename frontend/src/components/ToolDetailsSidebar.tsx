import React from 'react';

interface ToolData {
  title: string;
  description: string;
  params: Record<string, any>;
  result?: string;
}

interface ToolDetailsSidebarProps {
  tool: ToolData;
  onClose: () => void;
}

const ToolDetailsSidebar: React.FC<ToolDetailsSidebarProps> = ({ tool, onClose }) => {
  return (
    <div className="h-full flex flex-col bg-white shadow-lg border-l">
      <div className="p-4 border-b bg-gradient-to-r from-gray-50 to-white">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900">{tool.title}</h3>
          </div>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition-colors p-1 rounded-full hover:bg-gray-100"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
        <p className="text-sm text-gray-600 mt-2 pl-10">{tool.description}</p>
      </div>
      <div className="flex-1 overflow-auto">
        <div className="p-4 space-y-6">
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
              </svg>
              Parameters
            </h4>
            <div className="bg-gradient-to-br from-gray-50 to-white rounded-lg p-3 mb-4 border border-gray-100">
              <pre className="text-xs text-gray-800 whitespace-pre-wrap overflow-auto max-h-64">
                {JSON.stringify(tool.params, null, 2)}
              </pre>
            </div>
          </div>
          
          {tool.result && (
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Result
              </h4>
              <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-3 border border-green-100">
                <pre className="text-xs text-gray-800 whitespace-pre-wrap overflow-auto max-h-96">
                  {tool.result}
                </pre>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ToolDetailsSidebar; 