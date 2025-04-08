import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import CreateAgent from './pages/CreateAgent'
import AgentChat from './pages/AgentChat'
import './App.css'

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50 w-full">
        <Routes>
          <Route path="/" element={<CreateAgent />} />
          <Route path="/agent/:agentId" element={<AgentChat />} />
        </Routes>
      </div>
    </Router>
  )
}

export default App
