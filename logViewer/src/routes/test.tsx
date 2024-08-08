import { createFileRoute } from '@tanstack/react-router'
import VirtualLog, {logItemParser, VirtualLogHandlerRef} from "@/components/virtualLog";
import {useEffect, useRef} from "react";
import {LogItem} from "@/constants.ts";
import SearchBar from "@/components/virtualLog/searchBar.tsx";
import {ListChildComponentProps} from "react-window";
import Line from "@/components/virtualLog/line.tsx";

export const Route = createFileRoute('/test')({
  component: () => <TestCF/>
})
/*
function TestCF2() {


    const [items, setItems] = useState<List<number>>(List())
    useEffect(() => {
        const time = setInterval(() => setItems((prev) => {
            console.log('xxx')
            return prev.push(1)
        }), 2000)
        return () => clearInterval(time)
    }, []);
    const Row = ({ index, style }: any) => {
        const bg = index % 2 === 1 ? 'bg-zinc-50' : 'bg-zinc-200';
        return <div className={bg} style={style}>Row {index}</div>
    }

    console.log('zzz')
    return (
        <VariableSizeList
            height={150}
            itemCount={items.size}
            itemSize={() => 30}
            width={300}
        >
            {Row}
        </VariableSizeList>
    );
}
*/

function TestCF() {
    const logRef = useRef<VirtualLogHandlerRef<LogItem>>(null)

    useEffect(() => {
        const data = Array(2).fill(0).map((_,index) => {
            return {
                log: ['hello world ' + index],
                num:0,
                time:Date.now()
            } as LogItem
        })
        const ref = logRef.current
        ref?.newLine(data)
        let index = 0
        const z = setInterval(() => {
            ref?.newLine([{
                log: [`hello world ${index++}`],
                num:0,
                time:Date.now()
            } as LogItem])
        },1000)
        return () => {
            ref?.clear()
            clearInterval(z)
        }
    }, []);


    const renderRow = ({index ,style}: ListChildComponentProps<LogItem>, data: LogItem, focus: boolean) => {
        if(data.searched) {
            return <Line index={index + 1} style={style} key={index} data={<>searched 123 {focus? 'focus': 'no'}</>}/>
        }
        return <Line index={index+1} style={style} key={index} data={logItemParser(data)}/>
    }
    const onSearch = (data:LogItem, searchText:string|undefined) => {
        if(searchText === undefined) {
            return {data, isSearch: false }
        }
        const index = (data.log[0] as string).indexOf(searchText)
        const isSearch = index !== -1
        data.searched = isSearch
        return {
            data,
            isSearch,
        }
    }

    return (
        <div>
            <VirtualLog width='100%' height={300} ref={logRef} renderRow={renderRow} onSearch={onSearch} rowHeight={40}/>
            <SearchBar logRef={logRef}/>
        </div>

    )
}
