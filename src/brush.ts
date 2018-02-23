import { RandomDataSource} from "./dataSource"
import * as template from "lodash.template"
import * as d3 from 'd3'

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

        // 그래프를 초기화 한다.
        this.initGraph()

        // 5초에 한번씩 데이터를 가져온다.
        this.option.dataSource.subscribe((data)=>{
            console.log(data)
            let now = Date.now()
            this.animate5Sec(now)
        });

        // this.startXisAnimation();
    }

    initGraph() {

      let now = Date.now()

      var xs = this.xScale,
          xa = this.xAxis,
          xag = this.xAxisG

      var key = Math.floor(now/(5*1000))

      //xScale을 만든다.
      xs.domain([key-60,key])
      xag.call(xa)

      //현재 기준으로 데이터를 가져온다.
      var dataSet = this.option.dataSource.getWholeData()

      var y = this.yScale
      var x = this.xScale

      var h = this.height
      var w = this.width

      //가져온 데이터를 이용하여, yScale을 만든다.
      y = d3.scaleLinear().rangeRound([h, 0])
                      .domain([d3.min(dataSet, function(d){return d['value']}),
                               d3.max(dataSet, function(d){return d['value']})])

      // //bar 그래프로 표시한다.
      var g = this.svg.append('g').attr('class', 'barChart').attr("transform", `translate(-20, -20)`)

       g.selectAll(".bar")
        .data(dataSet)
        .enter().append("rect")
        .attr("class", "bar")
        .attr("x", function(d){
          return x(d['key'])
        })
        .attr("y", function(d) {
          return y(d['value'])
        })
        .attr("width", w / dataSet.length)
        .attr("height", function(d) {
          return h - y(d['value'])
        })

      //brush를 적용한다.


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
