import {Ref, useState} from "react"
import {cn} from "@/lib/utils.ts";
import {Button} from "@/components/ui/button.tsx";
import {VirtualLogHandlerRef} from ".";


export interface SearchState {
    resultLines:number[]
    resultPosition?:number
    //isSearching: boolean
}

export interface SearchBarProps<T> {
    logRef: Ref<VirtualLogHandlerRef<T>>
    className?: string
}

function defaultSearchBarState():SearchState {
    return {
        resultLines: [],
        //resultPosition:null
    }
}
export default function SearchBar<T>({logRef, className}: SearchBarProps<T>) {
    /*const [state, setState] = */useState<SearchState>(defaultSearchBarState)

    const search = () => {
        logRef
    }
    return (<div className={cn('flex flex-row', className)}>
        <input onChange={search}/>
        <Button size='icon' variant='link'></Button>
    </div>)
}
