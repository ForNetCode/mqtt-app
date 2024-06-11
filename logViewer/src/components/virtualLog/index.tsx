import {forwardRef, ReactElement, Ref, useImperativeHandle, useState} from "react";
import { ListChildComponentProps, VariableSizeList } from "react-window";
import AutoSizer from "react-virtualized-auto-sizer";
import Line from "./line";
import {List} from 'immutable'; // TODO: remove immutable
import {LogItem} from "@/constants.ts";


interface PureLogProps<T> {
    parseLine(lineText:T): ReactElement
    rowHeight: number
}

export interface VirtualLogHandlerRef<T> {
    newLine(text:T[]): void
    clear(): void
    search(text:string, ignoreCase?:boolean): number[] // search('') to cancel search //set searching highlight
    scroll(line: number): void
}


interface LogState<T> {
    scrollToIndex: number
    lines: List<T>
}

function defaultLogState<T>():LogState<T> {
    return {
        scrollToIndex:0,
        lines: List<T>()
    }
}

// ref: https://github.com/NadiaIdris/ts-log-viewer to more text

export default forwardRef(function VirtualLog<T>({rowHeight, parseLine}:PureLogProps<T>, ref: Ref<VirtualLogHandlerRef<T>>) {
    const [logState, setLogState] = useState<LogState<T>>(defaultLogState)
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
                    lines: lines.concat(lineText),
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
          scroll(){

          }
        }
    },[])

    const renderRow = ({index, style}:ListChildComponentProps<T>) => {
        const number = index +1
        return <Line style={style} key={number} index={number} data={parseLine(logState.lines.get(index)!!)} />
    }

    return <AutoSizer>
        {({ height, width }) => {
            return <VariableSizeList
                className='py-2'
                itemSize={() => rowHeight}
                itemCount={logState.lines.size}
                height={height} width={width}>
                {renderRow}
            </VariableSizeList>
        }}
    </AutoSizer>
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
