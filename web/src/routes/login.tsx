import {z} from 'zod'
import {useAuth} from "@/auth.tsx";
import {createFileRoute} from "@tanstack/react-router";
import {Input} from "@/components/ui/input.tsx";
import {Button} from "@/components/ui/button.tsx";
import {useForm} from "react-hook-form";
import {Form, FormControl, FormField, FormItem, FormMessage} from "@/components/ui/form.tsx";
import {zodResolver} from "@hookform/resolvers/zod";
import { GitHubLogoIcon } from '@radix-ui/react-icons'
import {GithubRepo} from "@/constants.ts";

export const Route = createFileRoute('/login')({
    validateSearch: z.object({
        redirect: z.string().optional().catch(''),
    }),
    component: LoginComponent
})
const fallback = '/dashboard'

const formSchema = z.object({
    server: z.string().min(1, 'Server Host should not be empty'),
    clientId: z.string().min(1, 'Client should not be empty'),
    username: z.string().optional(),
    password: z.string().optional(),
})

export default function LoginComponent() {
    const auth = useAuth()
    const navigate = Route.useNavigate()
    const search = Route.useSearch()
    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            server: '',
            clientId: '',
        }
    })
    const onSubmit = (values: z.infer<typeof formSchema>) => {
        auth.login(JSON.stringify(values))
        navigate({to: search.redirect || fallback})
    }
    return (
        <>
        <div className="w-full lg:grid lg:min-h-[600px] lg:grid-cols-2 xl:min-h-[800px]">
            <div className="flex items-center justify-center py-12">
                <div className="mx-auto grid w-[350px] gap-6">
                    <div className="grid gap-2 text-center">
                        <h1 className="text-3xl font-bold">MQTT EXEC</h1>
                        <p className="text-balance text-muted-foreground">
                            Enter MQTT server and client-id info to connect
                        </p>
                    </div>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4">
                            <FormField name="server" render={({field}) => (
                                <FormItem className="grid gap-2">
                                    <FormControl>
                                        <Input
                                            placeholder="Server Host, like: mqtt://127.0.0.1:8080"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage/>
                                </FormItem>
                            )}/>
                            <FormField name="clientId" render={({field}) => (
                                <FormItem className="grid gap-2">
                                    <FormControl>
                                        <Input
                                            placeholder="Client ID"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage/>
                                </FormItem>
                            )}/>

                            <FormField name="username" render={({field}) => (
                                <FormItem className="grid gap-2">
                                    <FormControl>
                                        <Input
                                            autoComplete="current-password"
                                            placeholder="username"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage/>
                                </FormItem>
                            )}/>
                            <FormField name="password" render={({field}) => (
                                <FormItem className="grid gap-2">
                                    <FormControl>
                                        <Input
                                            placeholder="password"
                                            type="password"
                                            autoComplete="current-password"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage/>
                                </FormItem>
                            )}/>

                            <Button type="submit" className="w-full">
                                Connect
                            </Button>
                        </form>
                    </Form>
                </div>
            </div>
            <div className="hidden bg-muted lg:block">
                <div className="flex flex-col justify-center h-full items-center">
                    <div className="flex flex-col">
                    <div className="text-4xl font-bold">Execute shell command via MQTT protocol</div>
                        <div className="w-1 h-3"/>
                        <div className="flex items-center">
                            <div>more information can be found at</div>
                            <div className="w-2 h-1"/>
                            <a href={GithubRepo} target="_blank"><GitHubLogoIcon className="w-4 h-4"/></a>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <div className="w-full flex justify-center mt-4 text-xs">Created By ForNetCode © 2024</div>
        </>
    )
}

