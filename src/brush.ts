import {IDataSource, RandomDataSource} from "./dataSource"
import * as template from "lodash.template"
import * as d3 from 'd3'
import {setInterval} from "timers";

const defaultOption = {
    context: document.querySelector('body') ,
    timeColumn: 'timestamp',
    dataColumn: 'value',
    wholeTimeRange: 5, // 분단위
    selectRange: 30, // 초단위
    barRange: 5, // 초단위
    rangeSelectedHandler: ()=>{},
    dataSource: new RandomDataSource(),
    tooltipTemplate: template("value = <%=value%>")
};

export class Brush {
    option: any;
    svg: any;
    xScale: any;
    yScale: any;
    width: number;
    height: number;

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
        let now = Date.now()
        this.svg = d3.select(this.option.context)
            .append('svg')
            .style("width","100%")
            .style("height","100%")

        console.log(this.svg)
        this.width = this.svg.node().clientWidth;
        this.height = this.svg.node().clientHeight;

        this.xScale = d3.scaleTime().domain([now-(this.option.wholeTimeRange*60*1000),now]).range([0,this.width])
        const xAxis = d3.axisBottom(this.xScale)

        const xAxisG = this.svg.append('g')
        xAxisG.attr("transform", `translate(0,${this.height-20})`).call(xAxis)

        this.option.dataSource.subscribe((data)=>{
            console.log(data)
        })

        setInterval(()=>{
            let now = Date.now()
            this.xScale.domain([now-(this.option.wholeTimeRange*60*1000),now])

            xAxisG.transition()
                .duration(5000)
                .ease(d3.easeLinear)
                .call(xAxis)

        }, 5000)
    }

}




