import { Suspense, lazy } from 'react'
import { HashRouter, Route, Routes } from 'react-router-dom'

import { Layout } from './components/layout/Layout'

const HomePage = lazy(() => import('./pages/HomePage'))
const AtlasPage = lazy(() => import('./pages/AtlasPage'))
const MapPage = lazy(() => import('./pages/MapPage'))
const FarmDetailPage = lazy(() => import('./pages/FarmDetailPage'))
const ProducerGroupPage = lazy(() => import('./pages/ProducerGroupPage'))
const RegionPage = lazy(() => import('./pages/RegionPage'))

function LoadingSpinner() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-50 px-4 dark:bg-neutral-950">
      <div className="h-12 w-12 animate-spin rounded-full border-4 border-coffee-200 border-t-coffee-600 dark:border-neutral-700 dark:border-t-coffee-300" />
    </div>
  )
}

function App() {
  return (
    <HashRouter>
      <Suspense fallback={<LoadingSpinner />}>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/atlas" element={<AtlasPage />} />
            <Route path="/map" element={<MapPage />} />
            <Route path="/farms/:slug" element={<FarmDetailPage />} />
            <Route path="/producers/:slug" element={<ProducerGroupPage />} />
            <Route path="/regions/:id" element={<RegionPage />} />
          </Route>
        </Routes>
      </Suspense>
    </HashRouter>
  )
}

export default App
