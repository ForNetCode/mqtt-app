import { createFileRoute } from '@tanstack/react-router'
// import {Button} from "@/components/ui/button.tsx";
// import {initClient} from "@/mqtt.ts";
// import log  from "loglevel";
// import VirtualLog, {logItemParser, SimpleLogHandlerRef} from "@/components/virtualLog";
// import {useEffect, useRef} from "react";
// import {LogItem} from "@/constants.ts";
import LogMockTest from "@/test/LogMockTest.tsx";

export const Route = createFileRoute('/test')({
  component: () => <LogMockTest/>
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
/*
function TestCF() {
    const logRef = useRef<SimpleLogHandlerRef<LogItem>>(null)

    useEffect(() => {
        const data = Array(50).fill(0).map((_,index) => {
            return {
                log: ['hello world ' + index],
                num:0,
                time:Date.now()
            } as LogItem
        })
        const ref = logRef.current
        ref?.newLine(data)
        return () => {
            ref?.clear()
        }
    }, []);
    const testMQTTClick = async () => {
        log.info('begin')
        try {
            await initClient({
                server: 'ws://113.31.103.71:8080',
                clientId: 'log_test_client',
            })
        }catch (e) {
            log.info('xxx', e)
            return
        }
        log.info('ok')
    }

    return (
        <div>
            <Button onClick={testMQTTClick}>Test MQTT Connect</Button>
            <div className='w-full h-[300px]'>
            <VirtualLog ref={logRef} parseLine={logItemParser} rowHeight={40}/>
            </div>
        </div>
    )
}*/
