import {
    useEffect, useRef
} from "react";

import {LogItem} from "@/constants.ts";
import {logItemParser} from "@/components/virtualLog";


interface SimpleLogProps {
    logs:LogItem[]
}

export default function SimpleLog({logs}: SimpleLogProps) {
    const scrollRef = useRef<HTMLDivElement>(null)
    useEffect(() => {
        const div = scrollRef.current
        const needScrollToBottom = div? div.scrollHeight- div.scrollTop - div.offsetHeight < 30: false
        needScrollToBottom && setTimeout(() => {
            const div = scrollRef.current
            div && div.scrollTo({
                top:  div.scrollHeight - div.offsetHeight,
                behavior: "smooth",
            })
        }, 20)
    }, [logs.length]);


    return <div className='p-2 overflow-y-auto' ref={scrollRef}>
        {logs.map((item, index) => (
            <div className='hover:bg-zinc-100' key={index}>{logItemParser(item)}</div>
        ))
        }
    </div>
}
