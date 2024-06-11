import log from 'loglevel'
import {LoginInfo} from "@/store";
// must import like this. `import {connectAsync} from 'mqtt'` does not work
import mqtt, { MqttClient } from "mqtt";
import {create} from "zustand";
import {devtools} from "zustand/middleware";
import mitt from 'mitt'
import {LogItem} from "@/constants.ts";

let _client:MqttClient|null = null
export const mqttEmitter = mitt<Record<string, LogItem>>()

export interface MQTTInfo {
    status: MQTTStatus
}
export enum MQTTStatus {
    Offline,
    Online
}

export const mqttStore = create<MQTTInfo>()(
    devtools(() => ({status: MQTTStatus.Offline as MQTTStatus}),
        {enabled: import.meta.env.DEV }))

export function getMQTTClient(): MqttClient {
    return _client!!
}

export async function closeMQTTClient() {
    if(_client) {
        await _client.endAsync(true)
        _client = null
        mqttStore.setState(() => mqttStore.getInitialState())
        mqttEmitter.all.clear()
    }
}

export async function initClient({server, clientId, password, username}: LoginInfo): Promise<MqttClient> {
    if(_client) {
        return _client;
    }
    const client = mqtt.connect(server, {
        clientId,
        //rejectUnauthorized: true,
        password,
        username,
        //manualConnect: true,
    })

    _client = client

    client.on('error',(e) => {
        log.error('error', e)
    })

    client.on('close', () => log.info('close trigger'))
    client.on('connect', () => {
        log.info('connect trigger')
        mqttStore.setState(() => ({status: MQTTStatus.Online}))
    })
    client.on('reconnect', () => log.info('reconnect trigger'))
    client.on('end', () => log.info('end trigger'))

    client.on('offline', () => {
        log.info('offline trigger')
        mqttStore.setState(() => ({status: MQTTStatus.Offline}))
    })
    client.on('message', (topic, payload) => {
        const data = JSON.parse(payload.toString())
        mqttEmitter.emit(topic, data as LogItem)
    })

    return client
}
