import {RefObject, useRef, useState} from "react"
import {cn} from "@/lib/utils.ts";
import {Button} from "@/components/ui/button.tsx";
import {VirtualLogHandlerRef} from ".";


export interface SearchState {
    resultLines: number[]
    position?:number
    //isSearching: boolean
}

export interface SearchBarProps<T> {
    logRef: RefObject<VirtualLogHandlerRef<T>>
    className?: string
}

function defaultSearchBarState():SearchState {
    return {
        resultLines: [],
        //resultPosition:null
    }
}
export default function SearchBar<T>({logRef, className}: SearchBarProps<T>) {
    const [, setState] = useState<SearchState>(defaultSearchBarState)
    const searchTextRef = useRef('')

    const search = (text:string) => {
        const result = logRef.current?.search(text)
        console.log('search result:', result)
        if(result && result.length > 0) {
            setState({
                resultLines: result,
                position: 0,
            })
            logRef.current?.scroll(result[0])
        } else {
            setState({
                resultLines: []
            })
        }
    }

    const prevClick = () => {
        setState(({position,resultLines}) => {
            if(position && position> 0) {
                logRef.current?.scroll(resultLines[position - 1])
                return {position: position -1 , resultLines}
            }
            return {
                position, resultLines
            }
        })
    }

    const nextClick = () => {
        setState(({position,resultLines}) => {
            if(position && position < resultLines.length - 1) {
                logRef.current?.scroll(resultLines[position + 1])
                return {position: position +1 ,resultLines}
            }
            return {
                position,
                resultLines
            }
        })
    }
    return (<div className={cn('flex flex-row', className)}>
        <form onSubmit={() => search(searchTextRef.current)}>
            <input onChange={(e) => searchTextRef.current = e.currentTarget.value}/>
            <Button variant='link' onClick={prevClick}>Prev</Button>
            <Button variant='link' onClick={nextClick}>Next</Button>
            <Button variant='link' type='submit'>Search</Button>
        </form>
    </div>)
}
