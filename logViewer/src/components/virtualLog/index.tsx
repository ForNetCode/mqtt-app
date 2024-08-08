import {forwardRef, ReactElement, Ref, useEffect, useImperativeHandle, useRef, useState} from "react";
import {ListChildComponentProps, ListOnItemsRenderedProps, VariableSizeList} from "react-window";
import Line from "./line";
import {LogItem} from "@/constants.ts";


interface PureLogProps<T> {
    parseLine(lineText:T): ReactElement
    rowHeight: number
    height: number|string
    width: number|string
}

export interface VirtualLogHandlerRef<T> {
    newLine(text:T[]): void
    clear(): void
    search(text:string, ignoreCase?:boolean): number[] // search('') to cancel search //set searching highlight
    scroll(line: number): void
}


interface LogState<T> {
    scrollToIndex: number
    lines: T[]
}

function defaultLogState<T>():LogState<T> {
    return {
        scrollToIndex:0,
        lines: []
    }
}

// ref: https://github.com/NadiaIdris/ts-log-viewer to more text

export default forwardRef(function VirtualLog<T>({rowHeight, parseLine, height, width}:PureLogProps<T>, ref: Ref<VirtualLogHandlerRef<T>>) {
    const [logState, setLogState] = useState<LogState<T>>(defaultLogState)
    const listRef = useRef<VariableSizeList>(null)
    const refState = useRef<ListOnItemsRenderedProps>({
        overscanStopIndex:0,
        overscanStartIndex:0,
        visibleStopIndex:0,
        visibleStartIndex:0,
    })
    // const [searchState, useSearchState] = useState<SearchState>({
    //     resultLines: [],
    //     //isSearching: false,
    // })
    // const searchBarRef = useRef(null)

    useImperativeHandle(ref, () => {
        return {
          newLine(lineText:T[]) {
            setLogState(({lines, ...other}) => {

                return {
                    lines:lines.concat(...lineText),
                    ...other
                }
            })
          },
          clear() {
              setLogState(() => defaultLogState())
          },
          search(): number[] {
              return []
          },
          scroll(line: number) {
              console.log('fuck here')
              listRef.current?.scrollToItem(line)
          }
        }
    },[])
    useEffect(() => {
        const index= refState.current.overscanStopIndex
        if(index> 0 && logState.lines.length - index == 1) {
            listRef.current?.scrollToItem(logState.lines.length)
        }
    }, [logState.lines.length]);

    const renderRow = ({index, style}:ListChildComponentProps<T>) => {
        const number = index + 1
        return <Line style={style} key={number} index={number} data={parseLine(logState.lines[index]!!)} />
    }

    const onItemsRendered = (data:ListOnItemsRenderedProps) => {
        refState.current = data
    }
    return <VariableSizeList
        ref={listRef}
        className='py-2'
        itemSize={() => rowHeight}
        itemCount={logState.lines.length}
        height={height} width={width}
        onItemsRendered={onItemsRendered}
    >
        {renderRow}
    </VariableSizeList>

    // return <AutoSizer>
    //     {({ height, width }) => {
    //
    //     }}
    // </AutoSizer>
})

export function logItemParser(data:LogItem) {
    return webConsoleParser(data.log)
}
export function pureStringParser<T>(data:T):string {
    function parseSingle(data: any) {
        if(typeof data !== 'object') {
            return `${data}`
        } else {
            return JSON.stringify(data)
        }
    }
    if(data instanceof Array) {
        return data.map(parseSingle).join(' ')
    } else {
        return parseSingle(data)
    }
}

// TODO: and parser ansi
export function webConsoleParser<T>(data: T) {
    function parseSingle(data: any, index:number) {
        if(typeof data !== 'object') {
            return <span key={index}>{data}&nbsp;</span>
        } else {
            return <span key={index}>{JSON.stringify(data)}&nbsp;</span>
        }
    }
    if(data instanceof Array) {
        return <>{data.map(parseSingle)}</>
    } else {
        return parseSingle(data, 0)
    }
}
