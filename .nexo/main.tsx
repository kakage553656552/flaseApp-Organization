import './index.css'

import React, { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from '../App'

const getBasePath = () => {
  const pathname = window.location.pathname
  const match = pathname.match(/^\/apps\/([^/]+)/)
  if (match) {
    return `/apps/${match[1]}`
  }
  return '/'
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter basename={getBasePath()}>
      <App />
    </BrowserRouter>
  </StrictMode>,
)

