import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import AgentChat from './pages/AgentChat'
import AgentChatPage from './pages/AgentChatPage'
import './App.css'

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50 w-full">
        <Routes>
          <Route path="/" element={<AgentChat />} />
          <Route path="/agent/:agentId" element={<AgentChatPage />} />
        </Routes>
      </div>
    </Router>
  )
}

export default App
