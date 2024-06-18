import {Outlet, createRootRouteWithContext} from '@tanstack/react-router'
import {AuthContext} from '../auth'
import React, {Suspense} from "react";

interface MyRouterContext {
    auth: AuthContext
}

const TanStackRouterDevtools =
    process.env.NODE_ENV === 'production'
        ? () => null // Render nothing in production
        : React.lazy(() =>
            // Lazy load in development
            import('@tanstack/router-devtools').then((res) => ({
                default: res.TanStackRouterDevtools,
                // For Embedded Mode
                // default: res.TanStackRouterDevtoolsPanel
            })),
        )
export const Route = createRootRouteWithContext<MyRouterContext>()({
    component: () => {
        return (<>
            <Outlet/>
            <Suspense>
                <TanStackRouterDevtools position="bottom-right" initialIsOpen={false}/>
            </Suspense>
        </>)
    },
})
