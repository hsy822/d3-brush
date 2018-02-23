import {setInterval} from "timers";
import {Stream} from "most";
const mws = require('most-w3msg');
import {nest as d3_nest} from 'd3-collection'

type Row = { [key:string]: any }
type Rows = Row[]
type UnsubscribeHandle = ()=>void
type SubscribeHandle = (Rows)=>void

const toJson = JSON.parse
const pick = attrName => obj => obj[attrName]
const log = tag => d => { console.log(`[${tag}]`,d); return d; }

interface IDataSource {
    getWholeData: (from: Date, to: Date )=>Rows
    subscribe: (handler: SubscribeHandle)=>UnsubscribeHandle
}

export class RandomDataSource implements IDataSource {
    subscribeHandles: { [key: number]: SubscribeHandle};
    intervalHandlerID: any;

    constructor() {
        this.subscribeHandles = {}
        this.intervalHandlerID = setInterval(()=>{
            for(var k in this.subscribeHandles) {
                this.subscribeHandles[k]([this.fakeRow()]);
            }
        },5000)
    }

    private fakeRow(ts?): Row {
        if(ts) {
            return {timestamp: ts, value: Math.floor(Math.random()*100)}
        }else {
            return {timestamp: Date.now(), value: Math.floor(Math.random()*100)}
        }
    }

    public getWholeData(from: Date, to: Date ): Rows  {
        // todo : implement
        return null;
    }

    public subscribe(handler: SubscribeHandle): UnsubscribeHandle {
        const key = Math.random()
        this.subscribeHandles[key] = handler

        return ()=> {
            clearInterval(this.intervalHandlerID)
            delete this.subscribeHandles[key]
        }
    }
}

export class BlockchainInfoDataSource implements IDataSource {
    subscribeHandles: { [key: number]: SubscribeHandle};
    intervalHandlerID: any;
    buffer: any[];
    ws$: Stream<any>
    option: {tickSize: number}

    constructor(option) {
        this.option = option;
        this.buffer = []
        this.subscribeHandles = {}

        var ws  = new WebSocket('wss://ws.blockchain.info/inv')
        ws.onopen = (evt) => {
            ws.send(JSON.stringify({op:'unconfirmed_sub'}))
        };

        this.ws$ = mws.fromWebSocket(ws, ws.close.bind(ws))
            // .map(d=>{console.log(d); return d})
            .map(pick("data"))
            // .map(log('data attribute'))
            .map(toJson)
            // .map(log('toJson'))
            .map(pick("x"))
            .map(d=>{
                d.timeGrp = Math.floor(d.time / this.option.tickSize)
                d.time = new Date(d.time*1000);
                return d;
            })
            .loop((memo, v)=>{
                if( v.timeGrp == memo.timeGrp) {
                    memo.datas.push(v)
                    return {seed:memo, value: null}
                }else {
                    return {seed:{timeGrp:v.timeGrp, datas:[v]}, value: memo.datas}
                }
            },{timeGrp: Math.floor(Date.now()/(this.option.tickSize*1000)), datas: []})
            // .map(log('after grouping'))
            .filter(v=> v != null)
            // .map(log('after grouping2'))
            .map(v=>{
                return d3_nest().key(d=>d.timeGrp).rollup(leaves=>{
                    const sizeSum = leaves.reduce((m,v)=>{return m+v.size},0)

                    return sizeSum / leaves.length
                }).entries(v)
            })
            // .map(log('avg'))
            .map((v)=>{
                for(var k in this.subscribeHandles) {
                    this.subscribeHandles[k]( v );
                }
            })
            // .map(log("x"));

        this.ws$.observe((x)=>{
            this.buffer.push({ts: Date.now(), data: x })
        })
    }

    getWholeData(from: Date, to: Date): Rows {
      //현재 시간 기준의 임시 데이터 생성 후 리턴
      var data = []
      var key = Math.floor(Date.now()/(this.option.tickSize*1000))

      console.log('data key', key)
      for (var i=0; i<60; i++) {
        var value = Math.floor( (Math.random() * (1000 - 200 + 1)) + 200 )
        var obj = {
          key: key,
          value: value
        }
        data.push(obj)
        key = key-1
      }

      return data;
    }

    subscribe(handler: SubscribeHandle): UnsubscribeHandle {
        const key = Math.random()
        this.subscribeHandles[key] = handler

        return ()=> {
            clearInterval(this.intervalHandlerID)
            delete this.subscribeHandles[key]
        }
    }
}
