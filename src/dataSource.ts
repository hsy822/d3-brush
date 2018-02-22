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

export interface IDataSource {
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
            .map(pick("data"))
            .map(toJson)
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
            .filter(v=> v != null)
            .map(v=>{
                return d3_nest().key(d=>d.timeGrp).rollup(leaves=>{
                    const sizeSum = leaves.reduce((m,v)=>{return m+v.size},0)

                    return sizeSum / leaves.length
                }).entries(v)
            })
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
        return [];
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