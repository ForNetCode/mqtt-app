import * as React from 'react'
import {getStoredUser, LoginInfo, setStoredUser} from "@/store";
import {closeMQTTClient, initClient, MQTTStatus, mqttStore} from "@/mqtt.ts";
import {delay} from "@/lib/utils.ts";
import log from "loglevel";
import {checkAndAddTopicToDB, deleteAllTopics, initTopics} from "@/store/topicStore.ts";
import {redirect} from "@tanstack/react-router";
import {MQTTLogSubscribe} from "@/constants.ts";

export interface AuthContext {
    isAuthenticated: boolean
    login: (info: LoginInfo, topic?:MQTTLogSubscribe) => Promise<void>
    logout: () => Promise<void>
    mqttStatus: MQTTStatus
}

const AuthContext = React.createContext<AuthContext | null>(null)


export function AuthProvider({ children }: { children: React.ReactNode }) {
    const mqttStatus = mqttStore(s => s.status)

    const isAuthenticated = mqttStatus === MQTTStatus.Online

    const logout = React.useCallback(async () => {
        await closeMQTTClient()
        setStoredUser(null)
        await deleteAllTopics()
        redirect({to: '/login',
            search: {
            redirect: location.href
        }})
    }, [])

    const login = React.useCallback(async (info: LoginInfo, topic?: MQTTLogSubscribe) => {
        const old = getStoredUser()
        if(old && (old.server!== info.server || old.clientId !== info.clientId)) {
            await deleteAllTopics()
        }

        setStoredUser(info)
        await initClient(info)

        let checkNum = 0
        try {
            while (checkNum < 5) {
                await delay(1000)
                checkNum++
                if (mqttStore.getState().status === MQTTStatus.Online) {
                    log.debug('MQTT login success')
                    if(topic) {
                        log.info(`begin to add topic: ${topic}`)
                    } else {
                        log.info('no topic to add')
                    }
                    topic && await checkAndAddTopicToDB(topic)
                    await initTopics()
                    // setIsAuthenticated(true)
                    return
                }
            }
        }catch (e) {
            log.error('MQTT Connect Error', e)
        }
        await closeMQTTClient()
        throw 'MQTT Connect Failure'
    }, [])


    return (
        <AuthContext.Provider value={{ isAuthenticated, mqttStatus, login, logout }}>
            {children}
        </AuthContext.Provider>
    )
}

export function useAuth() {
    const context = React.useContext(AuthContext)
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider')
    }
    return context
}
