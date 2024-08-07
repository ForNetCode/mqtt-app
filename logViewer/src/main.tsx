import React from 'react'
import ReactDOM from 'react-dom/client'
import {RouterProvider, createRouter, createHashHistory} from '@tanstack/react-router'
import log from 'loglevel'

import { routeTree } from './routeTree.gen'
import { AuthProvider, useAuth } from './auth'
import './index.css'

// Set up a Router instance
const router = createRouter({
    routeTree,
    defaultPreload: 'intent',
    context: {
        auth: undefined!, // This will be set after we wrap the app in an AuthProvider
    },
    history: createHashHistory(),
    defaultNotFoundComponent: () => (<p>Not Found</p>)
})

// Register things for typesafety
declare module '@tanstack/react-router' {
    interface Register {
        router: typeof router
    }
}
// init log
log.setLevel(import.meta.env.PROD ? 'info': 'debug')

function InnerApp() {
    const auth = useAuth()
    return <RouterProvider router={router} context={{ auth }} />
}

function App() {
    return (
        <AuthProvider>
            <InnerApp />
        </AuthProvider>
    )
}

const rootElement = document.getElementById('app')!

if (!rootElement.innerHTML) {
    const root = ReactDOM.createRoot(rootElement)
    // root.render(<App/>)
    root.render(
        <React.StrictMode>
            <App />
        </React.StrictMode>,
    )
}
