import { Routes, Route } from 'react-router-dom'
import { Navbar, BottomNav } from './components/layout'
import Home from './pages/Home'
import Dashboard from './pages/Dashboard'
import Sessions, { AttendancePage } from './pages/Sessions'
import Members from './pages/Members'
import Stats from './pages/Stats'
import Settings from './pages/Settings'

export default function App() {
  return (
    <div className="min-h-screen bg-m-bg">
      <Navbar/>
      <main>
        <Routes>
          <Route path="/"                       element={<Home/>}/>
          <Route path="/dashboard"              element={<Dashboard/>}/>
          <Route path="/sessions"               element={<Sessions/>}/>
          <Route path="/sessions/:session_id"   element={<AttendancePage/>}/>
          <Route path="/members"                element={<Members/>}/>
          <Route path="/stats"                  element={<Stats/>}/>
          <Route path="/settings"               element={<Settings/>}/>
        </Routes>
      </main>
      <BottomNav/>
    </div>
  )
}
