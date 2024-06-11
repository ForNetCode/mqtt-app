import { test,assert } from 'vitest'
import {connectAsync } from 'mqtt'
import loglevel, {Logger} from 'loglevel'

type LogConfig =
    | 'trace'
    | 'debug'
    | 'info'
    | 'warn'
    | 'error'
    | undefined;

function delay(time:number) {
    return new Promise(resolve => setTimeout(resolve, time))
}
async function web_init(targetClientId: string, host:string = 'ws://127.0.0.1:8080') {
    const log = loglevel.getLogger('web')
    log.setLevel("trace")
    const clientId = 'web_client'
    const configTopic = `conf/log/${targetClientId}`
    const messageTopic = `log/${targetClientId}`
    const level = 'debug'

    const client = await connectAsync(host, {
        clientId,
        rejectUnauthorized: true,
    })

    client.on('message', (topic:string,payload) => {

        if (topic === messageTopic) {
            const data = JSON.parse(payload.toString())
            log.info(data)
        }
    })

    await client.subscribeAsync(messageTopic, {qos: 0, })
    log.info('web mqtt subscribe finish')
    client.publish(configTopic, JSON.stringify({logLevel: level}), {qos: 2})

}
async function client_init(clientId: string):Promise<Logger> {
    const log = loglevel.getLogger('client')
    const configTopic = `conf/log/${clientId}`
    const messageTopic = `log/${clientId}`


    let mqttLogConfig:LogConfig = undefined;
    const client = await connectAsync('ws://127.0.0.1:8080', {
        clientId,
        rejectUnauthorized: true,
    })

    client.on('message', (topic:string,payload) => {
        if (topic === configTopic) {
            const message = JSON.parse(payload.toString())
            log.setLevel(message.logLevel)
            mqttLogConfig = message.logLevel
        }
    })

    await client.subscribeAsync(configTopic, {qos: 2, })
    const originalFactory = log.methodFactory
    log.methodFactory = (level,num, name) => {
        const rawMethod = originalFactory(level,num, name)
        return (...message) => {
            rawMethod(...message)
            if(mqttLogConfig && client.connected) {
                const data =
                    JSON.stringify({
                        time: Date.now(),
                        log:JSON.stringify(message),
                        num,
                        name,
                    })
                client.publishAsync(messageTopic, data, {qos: 0})
            }
        }
    }
    log.rebuild()

    return log
}



test('simple test', async () =>
{
    const clientId = 'log_client'
    const log = await client_init(clientId)

    await web_init(clientId)
    await delay(1000)
    log.debug('debug log', 'de', {a:'a'})
    log.info('info Log', 'abc', {a:'a'})
    log.warn('warn', 'abc', {a:'a'})
    log.error('error log', 'err', {a:'a'})
    await delay(3000)

    assert(1 == 1)
})


