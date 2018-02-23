import {IDataSource, RandomDataSource} from "./dataSource"
import * as template from "lodash.template"
import * as d3 from 'd3'

const defaultOption = {
    context: document.querySelector('body') ,
    timeColumn: 'timestamp',
    dataColumn: 'value',
    wholeTimeRange: 1, // 분단위
    selectRange: 30, // 초단위
    barRange: 5, // 초단위
    rangeSelectedHandler: ()=>{},
    dataSource: new RandomDataSource(),
    tooltipTemplate: template("value = <%=value%>")
};


const AniInterval = 1000

export class Brush {
    option: any;
    svg: any;
    xScale: any;
    yScale: any;
    width: number;
    height: number;
    timerHandle: any;

    xAxisG: any;
    xAxis: any;
    refreshMode: string;

    constructor(option) {
        this.option = Object.assign({},defaultOption,option);
        console.log(this.option)
        this.init()
    }

    // 초기화 로직
    /*
    context 에 svg element를 생성한다. 이때 svg의 크기는 context 로 전달된 element의 100%이다.
    반응형 브라우저 및 sidebar 로 인해 변경되는 context 의 사이즈를 자동으로 resize하는 핸들러를 등록한다.
     */

    init() {
        let now = Date.now();
        this.svg = d3.select(this.option.context)
            .append('svg')
            .style("width","100%")
            .style("height","100%");

        console.log(this.svg);
        this.width = this.svg.node().clientWidth;
        this.height = this.svg.node().clientHeight;

        this.xScale = d3.scaleTime().range([0,this.width]);
        this.xAxis = d3.axisBottom(this.xScale);
        this.xAxisG = this.svg.append('g').attr("transform", `translate(0,${this.height-20})`);

        this.option.dataSource.subscribe((data)=>{
            // console.log(data)
        });

        // this.startXisAnimation();
    }

    animate5Sec(now) {
        this.xScale.domain([now-(this.option.wholeTimeRange*60*1000)+AniInterval,now + AniInterval])

        this.xAxisG.transition()
            .duration(AniInterval)
            .ease(d3.easeLinear)
            .call(this.xAxis)
    }

    startXisAnimation() {
        let now = Date.now()
        this.xScale.domain([now-(this.option.wholeTimeRange*60*1000),now])
        this.xAxisG.call(this.xAxis)

        this.animate5Sec(now)
        this.timerHandle = setInterval(()=>{
            console.log('at interval', this.timerHandle )
            this.animate5Sec(Date.now())
        }, AniInterval)
    }

    changeRefreshMode(mode: 'auto' | 'manual') {
        console.log('changeRefreshMode', mode)
        this.refreshMode = mode
        if(mode =='auto') {
            console.log('yy')
            this.startXisAnimation()
        }else {
            console.log('xx', this.timerHandle)
            this.xAxisG.interrupt()
            clearInterval(this.timerHandle)
        }
    }

}




