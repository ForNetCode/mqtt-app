import {Button} from "@/components/ui/button.tsx";
import log from "loglevel";
import {getMQTTClient, initClient} from "@/mqtt.ts";
import {useState} from "react";

export default function LogMockTest() {
    const [hasInit, setHasInit] = useState<boolean>(() => !!getMQTTClient())
    const  clientId = 'log_test_mini'
    const configTopic = `conf/log/${clientId}`
    const server =  'ws://10.0.25.248:8080'
    const logTopic = `log/${clientId}`

    const testMQTTClick = async () => {
        const clientId = 'log_test_mini'
        setHasInit(true)
        log.info('begin')
        try {
            await initClient({
               server,
               clientId
            })
        }catch (e) {
            log.info('xxx', e)
            setHasInit(false)
            return
        }
        log.info('ok')
        const client = getMQTTClient()

        let intervalTime: any
        let count = 0

        client.on('message', (topic) => {
            if(topic === configTopic && !intervalTime) {
                intervalTime = setInterval(() => {
                    console.log('send log...')
                    client.publish(logTopic, JSON.stringify({
                        time: new Date().getTime(),
                        log: [`logCount`, count, {count:1}, [count]],
                        num: 2,
                    }))
                    count += 1
                },1000)
            }
        })
        client.subscribe(configTopic, {qos: 2})
    }
    const auth = encodeURIComponent(JSON.stringify({
        server,
        clientId: 'log_test_web',
        topic: {
            confTopic: configTopic,
            topic: logTopic,
            qos: 2,
            logLevel: 'debug'
        }
    }))

    const testUrl = `http://127.0.0.1:5173/login?auth=${auth}`
    return <div>
        <Button disabled={hasInit} onClick={testMQTTClick}>Listen MQTT</Button>
        <div className='h-20 w-full'></div>
        <div>{testUrl}</div>
    </div>
}
