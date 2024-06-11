import {cn} from "@/lib/utils.ts";
import {Button} from "@/components/ui/button.tsx";
import {Cross1Icon} from "@radix-ui/react-icons";
import {getClientStatus, MQTTTopicStatus} from "@/constants.ts";
import {MouseEventHandler} from "react";
import {topicStore} from "@/store/topicStore.ts";


interface TabNavProps {
    topic: string,
    //text: string,
    //status: MQTTTopicStatus
    active: boolean
    onClose: () => void
    onClick():void
}

const MQTTTopicStatusColorMap = {
    [MQTTTopicStatus.UnSubscribe]: 'bg-yellow-700',
    [MQTTTopicStatus.Offline]: 'bg-red-700',
    [MQTTTopicStatus.Subscribe]: 'bg-green-700',
}

//TODO: move topicStore outside
export default function TabNav({topic, onClose, active, onClick}: TabNavProps) {
    const {name, subscribed, online} = topicStore(({topics}) => topics[topic])
    const text = name ? name:topic
    const status = getClientStatus(subscribed, online)
    const color = MQTTTopicStatusColorMap[status]
    const onCloseProxy:MouseEventHandler = (e) => {
        e.stopPropagation()
        onClose()
    }
    return (<div
        onClick={onClick}
        className={cn("border-l h-full flex-1 flex-row flex justify-center items-center relative group", {['bg-zinc-100']: !active})}>
        <div className="absolute left-[4px] invisible group-hover:visible">
            <Button variant="link" size="icon" onClick={onCloseProxy}><Cross1Icon/></Button>
        </div>
        <div>{text}</div>
        <div className={cn('ml-2 rounded-full w-2 h-2', color)}></div>
    </div>)
}
// <div  onClick={onClose}></div>
