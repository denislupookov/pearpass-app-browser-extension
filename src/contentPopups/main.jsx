import { createRoot } from 'react-dom/client'

import { App } from './app/App'
import { AppWrapper } from '../shared/containers/AppWrapper'
import '../strict.css'

createRoot(document.getElementById('root')).render(
  <AppWrapper>
    <App />
  </AppWrapper>
)
