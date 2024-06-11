import {z} from "zod";

export const GithubRepo = 'https://www.github.com/ForNetCode/mqtt-app'


export interface LogItem {
    time: number,//202030044123, //timestamp
    log: Array<any>, //..... array log ,like console, first is message
    num: 0|1|2|3|4, // number to index log level:  trace:0, debug:1,info:2,warn:3,error:4
    name?: string //: 'LoggerName', // undefined or string
}

export enum QoS {
    QoS_0,
    QoS_1,
    QoS_2
}
export enum LogLevel {
    DEBUG = 'debug',
    INFO = 'info',
    WARN = 'warn',
    ERROR = 'error',
}
export interface MQTTLogSubscribe {
    name?: string,
    topic: string,
    confTopic: string,
    qos: QoS,
    logLevel: LogLevel,
    id: number
}

export const MQTTLogSubscribeCheck = z.object({
    topic: z.string().min(1),
    confTopic: z.string().min(1),
    name: z.string().optional(),
    qos: z.nativeEnum(QoS),
    logLevel: z.nativeEnum(LogLevel),
})


export interface MqttClientUIStatus extends MQTTLogSubscribe {
    subscribed: boolean,
    online?: boolean, // defined has no api to get status
    logs: LogItem[],
}

export enum MQTTTopicStatus {
    Offline = 'OFFLINE',
    Subscribe = 'SUBSCRIBED',
    UnSubscribe = 'UNSUBSCRIBED',
}

export function getClientStatus(subscribed:boolean, online?:boolean): MQTTTopicStatus{
    return subscribed ? MQTTTopicStatus.Subscribe: online === false ? MQTTTopicStatus.Offline: MQTTTopicStatus.UnSubscribe
}
