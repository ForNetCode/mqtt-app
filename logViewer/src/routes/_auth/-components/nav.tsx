import {Cross1Icon} from "@radix-ui/react-icons";
import {cn} from "@/lib/utils.ts";
import {MQTTTopicStatus} from "@/constants.ts";
import {MouseEventHandler} from "react";

interface TabNavProps {
    text: string,
    status: MQTTTopicStatus
    onClose: () => void
}
const MQTTTopicStatusColorMap = {
    [MQTTTopicStatus.UnSubscribe]: 'bg-yellow-700',
    [MQTTTopicStatus.Offline]: 'bg-red-700',
    [MQTTTopicStatus.Subscribe]: 'bg-green-700',
}
export default function TabNav({text, status, onClose}: TabNavProps){
    const color = MQTTTopicStatusColorMap[status]
    const onCloseProxy:MouseEventHandler<SVGAElement> = (e) => {
        e.stopPropagation()
        e.preventDefault()

        onClose()
    }
    return (
        <>
            <div className="absolute left-[4px] invisible group-hover:visible">
            <div className='bg-yellow-700'><Cross1Icon onClick={onCloseProxy}/></div>
            </div>
            <div>{text}</div>
            <div className={cn('ml-2 rounded-full w-2 h-2', color)}></div>
        </>)
}
