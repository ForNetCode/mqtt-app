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

    const search = async (text:string) =>  {
        const result = await logRef.current?.search(text)
        if(result && result.length > 0) {
            setState({
                resultLines: result,
                position: 0,
            })
            logRef.current?.scroll(result[0], true)
        } else {
            setState({
                resultLines: []
            })
        }
    }

    const prevClick = () => {
        setState(({position,resultLines}) => {
            if(position!== undefined && position> 0) {
                logRef.current?.scroll(resultLines[position - 1], true)
                return {position: position -1 , resultLines}
            }
            return {
                position, resultLines
            }
        })
    }

    const nextClick = () => {
        setState(({position,resultLines}) => {
            console.log(position, resultLines)
            if(position!== undefined && position < resultLines.length) {
                console.log('fuck...', position + 1)
                logRef.current?.scroll(resultLines[position + 1], true)
                return {position: position +1 ,resultLines}
            }
            return {
                position: position,
                resultLines
            }
        })
    }
    return (<div className={cn('flex flex-row', className)}>
        <form onSubmit={() => search(searchTextRef.current)}>
            <input onChange={(e) => searchTextRef.current = e.currentTarget.value}/>
            <Button variant='link' onClick={prevClick} type='button'>Prev</Button>
            <Button variant='link' onClick={nextClick} type='button'>Next</Button>
            <Button variant='link' type='submit'>Search</Button>
        </form>
    </div>)
}
