import {CSSProperties, ReactElement} from "react";

interface LineProps {
    index:number
    data: ReactElement
    style: CSSProperties
}

export default function Line({style, index, data}: LineProps) {
    return <div className='flex-row flex items-center hover:bg-zinc-100' style={style}><span className='w-9 mr-2 text-right'>{index}</span><div>{data}</div></div>
}
