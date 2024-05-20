import {Outlet, createRootRouteWithContext} from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/router-devtools'
import {AuthContext} from '../auth'

interface MyRouterContext {
    auth: AuthContext
}

export const Route = createRootRouteWithContext<MyRouterContext>()({
    component: () => {
        return (<>
            <Outlet/>
            <TanStackRouterDevtools position="bottom-right" initialIsOpen={false}/>
        </>)
    },
})
