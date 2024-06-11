import {z} from 'zod'
import {useAuth} from "@/auth.tsx";
import {createFileRoute} from "@tanstack/react-router";
import {Input} from "@/components/ui/input.tsx";
import {Button} from "@/components/ui/button.tsx";
import {useForm} from "react-hook-form";
import {Form, FormControl, FormField, FormItem, FormMessage} from "@/components/ui/form.tsx";
import {zodResolver} from "@hookform/resolvers/zod";
import {GitHubLogoIcon, ReloadIcon} from '@radix-ui/react-icons'
import {GithubRepo, MQTTLogSubscribe, MQTTLogSubscribeCheck} from "@/constants.ts";
import {useState} from "react";
import {getStoredUser} from "@/store";
import { Toaster } from "@/components/ui/sonner"
import {toast} from "sonner";
import log from "loglevel";

export const Route = createFileRoute('/login')({
    validateSearch: z.object({
        redirect: z.string().optional().catch(''),
        auth: z.any().optional(),
    }),
    component: LoginComponent
})
const fallback = '/'

const formSchema = z.object({
    server: z.string().min(1, 'Server Host should not be empty'),
    clientId: z.string().min(1, 'Client should not be empty'),
    username: z.string().optional(),
    password: z.string().optional(),
})


export default function LoginComponent() {
    const [isConnecting, setIsConnecting] = useState(false)
    const auth = useAuth()
    const navigate = Route.useNavigate()
    const search = Route.useSearch()
    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues:  async () => {
            if(search.auth) {
                try {
                    return formSchema.parse(search.auth)
                }catch (e) {
                    log.debug('parse query string auth failure')
                }
            }
            const info = getStoredUser()
            if (info) {
                return info
            }
            return {
                server: '',
                clientId: '',
           }
        },
    })
    const onSubmit = async (values: z.infer<typeof formSchema>) => {
        setIsConnecting(true)
        let topic :undefined|MQTTLogSubscribe = undefined
        if(search.auth) {
            try {
                 topic = { id:0, ...MQTTLogSubscribeCheck.parse(search.auth.topic),} as MQTTLogSubscribe
            }catch (e) {
                log.debug('parse query string auth topic failure', e)
            }
        }
        try {
            await auth.login(values, topic)
        }catch (e) {
            setIsConnecting(false)
            toast('MQTT Connect Failure', {
                description: 'Please check if the inputs is correct',
                action: {
                    label: 'Confirm',
                    onClick: () => {}
                }
            })
            return
        }
        navigate({to: search.redirect || fallback})
    }
    return (
        <>
        <div className="w-full lg:grid lg:min-h-[600px] lg:grid-cols-2 xl:min-h-[800px]">
            <div className="flex items-center justify-center py-12">
                <div className="mx-auto grid w-[350px] gap-6">
                    <div className="grid gap-2 text-center">
                        <h1 className="text-3xl font-bold">MQTT LOG</h1>
                    </div>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4">
                            <FormField
                                control={form.control}
                                defaultValue=''
                                name="server" render={({field}) => (
                                <FormItem className="grid gap-2">
                                    <FormControl>
                                        <Input
                                            placeholder="Server Host, like: ws://127.0.0.1:8080"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage/>
                                </FormItem>
                            )}/>
                            <FormField
                                control={form.control}
                                defaultValue=''
                                name="clientId" render={({field}) => (
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
                            <FormField
                                control={form.control}
                                name="username" render={({field}) => (
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
                            <FormField
                                control={form.control}
                                name="password" render={({field}) => (
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
                            <Button type="submit" disabled={isConnecting} className="w-full">
                                {isConnecting && <ReloadIcon className="mr-2 h-4 w-4 animate-spin" />}
                                CONNECT
                            </Button>
                        </form>
                    </Form>
                </div>
            </div>
            <div className="hidden bg-muted lg:block">
                <div className="flex flex-col justify-center h-full items-center">
                    <div className="flex flex-col">
                    <div className="text-4xl font-bold">Get Log Through MQTT</div>
                        <div className="w-1 h-3"/>
                        <div className="flex items-center">
                            <div>more information can be found at</div>
                            <div className="w-2 h-1"/>
                            <a href={GithubRepo} target="https://www.github.com/ForNetCode/mqtt-app"><GitHubLogoIcon className="w-4 h-4"/></a>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <div className="w-full flex justify-center mt-4 text-xs">Created By ForNetCode © 2024</div>
        <Toaster/>
        </>
    )
}
/*


 */
