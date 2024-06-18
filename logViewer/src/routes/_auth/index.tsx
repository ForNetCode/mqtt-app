import {createFileRoute, redirect,} from '@tanstack/react-router'
import {Button} from "@/components/ui/button.tsx";
import {Toaster} from "@/components/ui/sonner.tsx";
import {HamburgerMenuIcon, PlusIcon} from "@radix-ui/react-icons";
import {getMQTTClient} from "@/mqtt.ts";
import {useState} from "react";
import {Tabs, TabsContent, TabsList} from "@/routes/_auth/-components/tabs.tsx";
import {delTopic, topicStore} from "@/store/topicStore.ts";
import {Dialog, DialogTrigger} from "@/components/ui/dialog.tsx";
import EditTopicDialog from "@/routes/_auth/-components/editTopicDialog.tsx";
import LogView from "@/routes/_auth/-components/logView.tsx";
import TabNav from "@/routes/_auth/-components/tabnav.tsx";
import {
    AlertDialog, AlertDialogAction, AlertDialogCancel,
    AlertDialogContent, AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger
} from "@/components/ui/alert-dialog.tsx";
import {useAuth} from "@/auth.tsx";
import SimpleLog from "@/components/simpleLog";

export const Route = createFileRoute('/_auth/')({
    beforeLoad: ({context, location}) => {
        if (!context.auth.isAuthenticated) {
            throw redirect({
                to: '/login',
                search: {
                    redirect: location.href,
                },
            })
        }
    },
    component: Dashboard,
})


function Dashboard() {
    const {topics} = topicStore()
    const [activeTab, setActiveTab] = useState<string|undefined>(() => {
        const keys = Object.keys(topics)
        if(keys.length) {
            return topics[keys[0]].topic
        }
        return undefined
    })
    const [editTopicDialog, setEditTopicDialog] = useState(() => !Object.keys(topics).length)
    const {logout} = useAuth()

    const delTopicAction = (id:number, topic:string) => {
        delTopic(topic, id)
        //if(status === MQTTTopicStatus.Subscribe) {
        getMQTTClient().unsubscribe(topic)
        //}
    }


    const TabNavs = () => {
        const data = Object.values(topics).sort((a,b)=> b.id - a.id).map((item) => {
            return (<TabNav
                key={item.topic}
                topic={item.topic}
                active={activeTab === item.topic}
                onClose={() => delTopicAction(item.id, item.topic)}
                onClick={() => setActiveTab(item.topic)}
            />)
        })
        if(data.length) {
            return data
        }
        return <div className='flex-1 h-full'></div>
    }
    const Content = () => {
        const data = Object.keys(topics).map((topic) => {
            const item = topics[topic]
            const {logs} = item
            //return <LogView key={topic} topic={topic}/>
            return(<TabsContent value={topic} key={topic} asChild>
                <>
                <LogView topic={topic}/>
                <SimpleLog logs={logs} />
                </>
            </TabsContent>)
        })
        if(data.length) {
            return data
        }
        return <div className='flex-1 h-full w-full flex flex-col justify-start items-end'>
            <div className='pr-3 pt-2'>
            Please click '+' to add log topic &uarr;
            </div>
        </div>
    }

    return (
        <div className="h-lvh mx-auto w-[1160px] flex flex-col">
            <Tabs value={activeTab} className="border flex-grow flex flex-col overflow-hidden">
                <TabsList className="h-9 flex flex-row items-center justify-between border-b">
                    {TabNavs()}
                    <div className="flex-none flex-row flex border-l bg-zinc-100 h-full">
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button variant="link" size='icon' className='bg-transparent'><HamburgerMenuIcon/></Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Are you want log out?</AlertDialogTitle>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={logout}>Logout</AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                        <div className="w-px h-full bg-border"></div>
                        <Dialog open={editTopicDialog} onOpenChange={setEditTopicDialog}>
                            <DialogTrigger asChild>
                                <Button variant="link" size='icon' className='bg-transparent'><PlusIcon/></Button>
                            </DialogTrigger>
                            <EditTopicDialog closeDialog={() => setEditTopicDialog(false)} onSuccess={(topic) => setActiveTab(topic)}/>
                        </Dialog>
                    </div>
                </TabsList>
                {Content()}
            </Tabs>
            <div className='w-full h-8 flex-none'/>
            <Toaster />
        </div>)
}
