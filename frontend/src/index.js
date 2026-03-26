import { StrictMode } from 'react'
import ReactDOM from 'react-dom/client'
import { Provider } from 'react-redux'
import './index.css'
import App from './App'
import { store } from './store'

const rootEl = document.getElementById('root')
const root = ReactDOM.createRoot(rootEl)

root.render(
  <StrictMode>
    <Provider store={store}>
      <App />
    </Provider>
  </StrictMode>
)
