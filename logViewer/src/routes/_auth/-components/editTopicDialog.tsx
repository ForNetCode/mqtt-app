import { Button } from "@/components/ui/button";
import {DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle} from "@/components/ui/dialog.tsx";
import {z} from 'zod'
import {LogLevel, MQTTLogSubscribeCheck, QoS} from "@/constants.ts";
import {zodResolver} from "@hookform/resolvers/zod";
import {addTopic, topicStore, updateTopic} from "@/store/topicStore.ts";
import {Form, FormControl, FormField, FormItem, FormLabel, FormMessage} from "@/components/ui/form.tsx";
import {useForm} from "react-hook-form";
import {Input} from "@/components/ui/input.tsx";
import {RadioGroup, RadioGroupItem} from "@/components/ui/radio-group.tsx";
import log from "loglevel";
import {getMQTTClient} from "@/mqtt.ts";
import {toast} from "sonner";

interface EditTopicDialogProps {
    topic?: string
    closeDialog():void
    onSuccess?(topic:string):void
}

export default function EditTopicDialog({topic, closeDialog, onSuccess}: EditTopicDialogProps) {
    const form = useForm<z.infer<typeof MQTTLogSubscribeCheck>>({
        resolver: zodResolver(MQTTLogSubscribeCheck),
        defaultValues: async () => {
            if(topic) {
                return {
                    ... topicStore.getState().topics[topic]
                }
            } else {
                return {
                    topic: '',
                    confTopic: '',
                    qos: QoS.QoS_1,
                    logLevel: LogLevel.INFO,
                }
            }
        }
    })
    const onSubmit = async (values: z.infer<typeof MQTTLogSubscribeCheck>) => {
        let needReSubscribe = false
        if(topic) {
            // update
            updateTopic(topic,(oldTopic) => {
                if((oldTopic.qos!== values.qos || oldTopic.logLevel!== values.logLevel) && oldTopic.subscribed) {
                    needReSubscribe = true
                }
                if(oldTopic.subscribed && needReSubscribe) {
                    getMQTTClient().unsubscribe(topic)
                }
                return {
                    online: oldTopic.online,
                    id: oldTopic.id,
                    logs: oldTopic.logs,
                    ...values,
                    subscribed: !needReSubscribe && oldTopic.subscribed,
                }
            }, true)
        } else {
            //add
            if(topicStore.getState().topics[values.topic]) {
                toast(`${values.topic} already exists, can not add again`)
                return
            }
            await addTopic({...values, id:0, subscribed: false, logs:[]})
            onSuccess?.(values.topic)
            needReSubscribe = true
        }

        if(needReSubscribe) {
            log.info(`begin to reSubscribe Topic:${values.topic}`)
        }
        closeDialog()
    }

    const title = topic? 'Edit Topic': 'Subscribe Topic'
    const description = topic ? 'change subscribe params and resubscribe the topic': 'add subscribe topics to get log'

    // disable 不能放到 FormField 上。
    return (<DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription>{description}</DialogDescription>
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4">
                    <FormField
                        control={form.control}
                        defaultValue=''
                        name='topic'
                        render={({field}) => (
                            <FormItem>
                                <FormLabel>Topic</FormLabel>
                                <FormControl>
                                    <Input
                                        placeholder='like: log/client_id'
                                        {...field}
                                        disabled={true}
                                    />
                                </FormControl>
                                <FormMessage/>
                            </FormItem>
                        )}/>
                    <FormField
                        control={form.control}
                        defaultValue=''
                        name='confTopic'
                        render={({field}) => (
                            <FormItem>
                                <FormLabel>Topic</FormLabel>
                                <FormControl>
                                    <Input
                                        placeholder='like: log/client_id/conf'
                                        {...field}/>
                                </FormControl>
                                <FormMessage/>
                            </FormItem>
                        )}/>
                    <FormField
                        control={form.control}
                        defaultValue=''
                        name='name'
                        render={({field}) => (
                            <FormItem>
                                <FormLabel>Name</FormLabel>
                                <FormControl>
                                    <Input
                                        placeholder='optional, for easy remember'
                                        {...field}/>
                                </FormControl>
                                <FormMessage/>
                            </FormItem>
                        )}/>

                    <FormField
                        control={form.control}
                        name='qos'
                        render={({field}) => (
                            <FormItem>
                                <FormLabel>QoS</FormLabel>
                                <FormControl>
                                    <RadioGroup
                                        onValueChange={field.onChange}
                                        className='flex flex-row space-x-5'
                                        defaultValue={QoS.QoS_1.toString()}
                                    >
                                        <FormItem
                                            className='flex items-center space-x-1.5 space-y-0'><FormControl><RadioGroupItem
                                            value={QoS.QoS_0.toString()}/></FormControl><FormLabel>{QoS.QoS_0}</FormLabel></FormItem>
                                        <FormItem
                                            className='flex items-center space-x-1.5 space-y-0'><FormControl><RadioGroupItem
                                            value={QoS.QoS_1.toString()}/></FormControl><FormLabel>{QoS.QoS_1}</FormLabel></FormItem>
                                        <FormItem
                                            className='flex items-center space-x-1.5 space-y-0'><FormControl><RadioGroupItem
                                            value={QoS.QoS_2.toString()}/></FormControl><FormLabel>{QoS.QoS_2}</FormLabel></FormItem>
                                    </RadioGroup>
                                </FormControl>
                                <FormMessage/>
                            </FormItem>
                        )}/>
                    <FormField
                        control={form.control}
                        defaultValue={LogLevel.INFO}
                        name='logLevel'
                        render={({field}) => (
                            <FormItem>
                                <FormLabel>Log Level</FormLabel>
                                <FormControl>
                                    <RadioGroup
                                        onValueChange={field.onChange}
                                        defaultValue={LogLevel.INFO}
                                        className='flex flex-row space-x-5'
                                    >
                                        <FormItem
                                            className='flex items-center space-x-1.5 space-y-0'><FormControl><RadioGroupItem
                                            value={LogLevel.DEBUG}/></FormControl><FormLabel>{LogLevel.DEBUG}</FormLabel></FormItem>
                                        <FormItem
                                            className='flex items-center space-x-1.5 space-y-0'><FormControl><RadioGroupItem
                                            value={LogLevel.INFO}/></FormControl><FormLabel>{LogLevel.INFO}</FormLabel></FormItem>
                                        <FormItem
                                            className='flex items-center space-x-1.5 space-y-0'><FormControl><RadioGroupItem
                                            value={LogLevel.WARN}/></FormControl><FormLabel>{LogLevel.WARN}</FormLabel></FormItem>
                                        <FormItem
                                            className='flex items-center space-x-1.5 space-y-0'><FormControl><RadioGroupItem
                                            value={LogLevel.ERROR}/></FormControl><FormLabel>{LogLevel.ERROR}</FormLabel></FormItem>
                                    </RadioGroup>
                                </FormControl>
                                <FormMessage/>
                            </FormItem>
                        )}/>

                    <DialogFooter>
                        <Button type="submit">Save</Button>
                    </DialogFooter>
                </form>
            </Form>
        </DialogHeader>
    </DialogContent>)
}
