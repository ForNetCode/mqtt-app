import Dexie, {EntityTable} from "dexie";
import {create} from "zustand";
import {devtools} from "zustand/middleware";
import {immer} from "zustand/middleware/immer";
import {MqttClientUIStatus, MQTTLogSubscribe} from "@/constants.ts";

const db = new Dexie('db') as Dexie & {
    topics: EntityTable<MQTTLogSubscribe, 'id'>
}


db.version(1).stores({
    topics: '++id,topic,confTopic,name,qos,loglevel'
})


export interface TopicStore {
    topics: Record<string, MqttClientUIStatus>
}

export const topicStore = create<TopicStore>()(devtools(immer(() => {
    return {
        topics: {},
    }
}), {enabled: import.meta.env.DEV}))

export async function initTopics() {
    //const topics = await db.topics.toArray()
    const topics = await db.topics.reverse().sortBy("id")
    const data: Record<string, MqttClientUIStatus> = {}
    for (const topicItem of topics) {
        data[topicItem.topic] = {
            ...topicItem,
            subscribed: false,
            logs:[]
        }
    }
    topicStore.setState((pre) => {
        pre.topics = data
    })
}
export async function deleteAllTopics() {
    await db.topics.clear()
    topicStore.setState(topicStore.getInitialState)
}

// 自行确认， ui 状态可以不管，但其余的需要。
export function updateTopic(clientTopic: string, func: (data: MqttClientUIStatus) => MqttClientUIStatus, persist: boolean = false) {
    topicStore.setState(({topics}) => {
        const newTopic = func(topics[clientTopic])
        const {name, topic, confTopic, qos, logLevel,id} = newTopic
        topics[clientTopic] = newTopic
        if (persist) {
            db.topics.where({id}).modify({name, qos, logLevel, topic, confTopic})
        }
    })
}

export async function addTopic(data: MqttClientUIStatus) {

    const {topic, qos, name, logLevel, confTopic} = data
    data.id = await db.topics.add({topic, qos, name, logLevel, confTopic})
    topicStore.setState(({topics}) => {
        topics[data.topic] = data

    })
}
export async function checkAndAddTopicToDB(data:MQTTLogSubscribe) {
    const {topic, qos, name, logLevel, confTopic} = data
    if(!await db.topics.where({topic}).count()) {
        await db.topics.add({topic, qos, name, logLevel, confTopic})
    }


}

export function delTopic(topic: string, id:number) {
    topicStore.setState(({topics}) => {
        delete topics[topic]
    })
    db.topics.delete(id)
}
