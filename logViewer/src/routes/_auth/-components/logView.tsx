import {getClientStatus, LogItem, MQTTTopicStatus} from "@/constants.ts";
import {getMQTTClient, mqttEmitter} from "@/mqtt.ts";
import {Tooltip, TooltipContent, TooltipProvider, TooltipTrigger} from "@/components/ui/tooltip.tsx";
import {useEffect, useState} from "react";
import {GearIcon, Link2Icon, LinkBreak2Icon} from "@radix-ui/react-icons";
import {cn} from "@/lib/utils.ts";
import {Dialog} from "@/components/ui/dialog.tsx";
import EditTopicDialog from "@/routes/_auth/-components/editTopicDialog.tsx";
import {topicStore, updateTopic} from "@/store/topicStore.ts";


export interface LogViewProps {
    topic:string,
}
/*
function downloadFile(filename:string, text: string) {
    const element = document.createElement('a');
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
    element.setAttribute('download', filename);
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();

    document.body.removeChild(element);
}
*/

export default function LogView({topic}:LogViewProps) {
    const {subscribed, online, confTopic, logLevel,qos} = topicStore(({topics}) => {
        const {subscribed, online, confTopic, logLevel, qos} = topics[topic]
        return {subscribed, online, confTopic, logLevel,qos}
    })
    const [editTopicDialog, setEditTopicDialog] = useState(false)

    useEffect(() => {
        const func = (e:LogItem) => {
            // topicStore.setState(v => {v.topics[topic].logs.push(e)})
            // @ts-ignore
            console[e.name](...e.log)
        }
        mqttEmitter.on(topic, func)
        return () => {
            mqttEmitter.off(topic, func)
        }
    }, [])

    const subscribeOrUnSubscribeTopic = async () => {
        const client = getMQTTClient()
        if(subscribed) {
            client.unsubscribe(topic)
        }else {
            await client.subscribeAsync(topic, {qos})
            await client.publishAsync(confTopic, JSON.stringify({logLevel, qos}),{qos:2,})
        }
        updateTopic(topic, (d) => {
            d.subscribed = !subscribed
            return d
        }, false)
    }
    return (<>
        <div className="w-full flex flex-col">
            <div className="w-full h-9 flex flex-row items-center justify-between border-b">
                <TopicStatusDesc status={getClientStatus(subscribed, online)} onClick={() => console.log('xxx')}/>
                <div className="flex flex-row space-x-8 mr-2.5">
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger onClick={subscribeOrUnSubscribeTopic}>{subscribed? <Link2Icon/>:<LinkBreak2Icon />}</TooltipTrigger>
                            <TooltipContent>Subscribe Log</TooltipContent>
                        </Tooltip>
                        <Tooltip>
                            <TooltipTrigger onClick={() => setEditTopicDialog(true)}>
                                <GearIcon/>
                            </TooltipTrigger>
                            <TooltipContent side='left' sideOffset={40}>Setting</TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                </div>
            </div>
        </div>
        <Dialog open={editTopicDialog} onOpenChange={setEditTopicDialog}>
           <EditTopicDialog topic={topic} closeDialog={() => setEditTopicDialog(false)} onSuccess={()=>{}}/>
        </Dialog>
    </>)
}
const MQTTStatusTextColor = {
    [MQTTTopicStatus.Subscribe]: 'text-green-700',
    [MQTTTopicStatus.UnSubscribe]: 'text-yellow-700',
    [MQTTTopicStatus.Offline]: 'text-red-700',
}

function TopicStatusDesc({status, onClick}: {status:MQTTTopicStatus, onClick: () => void}) {
    return <div className='ml-2.5 text-xs'>STATUS: <span onClick={onClick} className={cn(MQTTStatusTextColor[status], 'cursor-pointer')}>{status}</span></div>
}
