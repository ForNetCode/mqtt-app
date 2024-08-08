import {forwardRef, ReactElement, Ref, useEffect, useImperativeHandle, useRef, useState} from "react";
import {ListChildComponentProps, ListOnItemsRenderedProps, VariableSizeList} from "react-window";
import {LogItem} from "@/constants.ts";


interface PureLogProps<T> {
    renderRow(props: ListChildComponentProps<T>, data:T, focus: boolean): ReactElement
    onSearch(data:T, text: string|undefined): {data:T, isSearch:boolean}
    rowHeight: number
    height: number|string
    width: number|string
}

export interface VirtualLogHandlerRef<T> {
    newLine(text:T[]): void
    clear(): void
    search(text:string, ignoreCase?:boolean): Promise<number[]> // search('') to cancel search //set searching highlight
    scroll(line: number, focus?: boolean): void

}


interface LogState<T> {
    lines: T[]
    focusLine: number
}

function defaultLogState<T>():LogState<T> {
    return {
        lines: [],
        focusLine: -1,
    }
}


// ref: https://github.com/NadiaIdris/ts-log-viewer to more text

export default forwardRef(function VirtualLog<T>({rowHeight, onSearch, renderRow, height, width}:PureLogProps<T>, ref: Ref<VirtualLogHandlerRef<T>>) {
    const [logState, setLogState] = useState<LogState<T>>(defaultLogState)
    const listRef = useRef<VariableSizeList>(null)
    const refState = useRef<ListOnItemsRenderedProps>({
        overscanStopIndex:0,
        overscanStartIndex:0,
        visibleStopIndex:0,
        visibleStartIndex:0,

    })

    useImperativeHandle(ref, () => {
        return {
          newLine(lineText:T[]) {
            setLogState(({lines, ...others}) => {
                return {
                    lines:lines.concat(...lineText),
                    ...others,
                }
            })
          },
          clear() {
              setLogState(() => defaultLogState())
          },
          search(text: string|undefined): Promise<number[]> {
              return new Promise(resolve => {
                  setLogState((prev) => {
                      const searchIndex:number[] = []
                      const result = prev.lines.map((data, index) => {
                          const r = onSearch(data, text)
                          if (r.isSearch) {
                              searchIndex.push(index)
                          }
                          return r.data
                      })
                      setTimeout(() => resolve(searchIndex))
                      return {
                          lines: result,
                          focusLine: searchIndex.length>0 ? searchIndex[0]: -1,
                      }
                  })
              })
          },

          scroll(line: number, focus?:boolean) {
              listRef.current?.scrollToItem(line)
              if(focus) {
                  setLogState((prev) => ({...prev, focusLine: line}))
              }
          }
        }
    },[])
    useEffect(() => {
        const index= refState.current.overscanStopIndex
        if(index> 0 && logState.lines.length - index == 1) {
            listRef.current?.scrollToItem(logState.lines.length)
        }
    }, [logState.lines.length]);

    const innerRenderRow = (props:ListChildComponentProps<T>) => {
        return renderRow(props, logState.lines[props.index], props.index === logState.focusLine)
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
        {innerRenderRow}
    </VariableSizeList>
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
