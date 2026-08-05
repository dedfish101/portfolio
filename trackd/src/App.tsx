import { NavLink, Route, Routes } from 'react-router-dom'
import { useStore } from './lib/store'
import { useAuthGate } from './components/Auth'
import Home from './pages/Home'
import Browse from './pages/Browse'
import TitleDetail from './pages/TitleDetail'
import Profile from './pages/Profile'
import Recommendations from './pages/Recommendations'
import Forum from './pages/Forum'
import ThreadView from './pages/ThreadView'
import Upcoming from './pages/Upcoming'

export default function App() {
  const { user, profile, ready, signOut } = useStore()
  const { open } = useAuthGate()

  return (
    <>
      <nav className="nav">
        <NavLink to="/" className="brand">track'd</NavLink>
        <div className="nav-links">
          <NavLink to="/" end>Home</NavLink>
          <NavLink to="/browse">Browse</NavLink>
          <NavLink to="/recommendations">For You</NavLink>
          <NavLink to="/upcoming">Upcoming</NavLink>
          <NavLink to="/forum">Forum</NavLink>
        </div>
        {!ready ? (
          <span className="nav-skeleton" />
        ) : user && profile ? (
          <div className="nav-account">
            <NavLink to="/profile" className="nav-profile">
              <span className="avatar-sm">{profile.avatar}</span>
              <span className="nav-username">{profile.username}</span>
            </NavLink>
            <button className="btn btn-small nav-signout" onClick={() => void signOut()}>Sign out</button>
          </div>
        ) : (
          <div className="nav-account">
            <button className="btn btn-small" onClick={() => open('signin')}>Sign in</button>
            <button className="btn btn-small btn-primary" onClick={() => open('signup')}>Sign up</button>
          </div>
        )}
      </nav>
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/browse" element={<Browse />} />
          <Route path="/title/:id" element={<TitleDetail />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/recommendations" element={<Recommendations />} />
          <Route path="/upcoming" element={<Upcoming />} />
          <Route path="/forum" element={<Forum />} />
          <Route path="/forum/thread/:id" element={<ThreadView />} />
        </Routes>
      </main>
      <footer className="footer">
        <p>track'd — your movies, series &amp; anime in one place.</p>
        <p className="footer-attribution">
          This product uses the TMDB API but is not endorsed or certified by TMDB.
          Anime data from AniList, series data from TVMaze.
        </p>
      </footer>
    </>
  )
}
