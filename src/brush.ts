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

        // 그래프 초기화.
        this.initGraph()

        // 수정 필요
        this.option.dataSource.subscribe((data)=>{
            let now = Date.now()
            if(data.length > 0){
              this.updateBarchart(data)
              this.animate5Sec(now)
            }
        });

        // this.startXisAnimation();
    }

    initGraph() {

      let now = Date.now()

      //현재 시간 기준으로 x축 스케일 만든다.
      var arr = []
      var barCount = (this.option.wholeTimeRange*60)/this.option.barRange
      for(var i=0; i<barCount; i++){
        arr.push(now)
        now = now-(this.option.barRange*1000)
      }
      this.xScale = d3.scaleTime().range([0,this.width]);
      this.xAxis = d3.axisBottom(this.xScale)
      this.xAxisG = this.svg.append('g').attr("transform", `translate(0,${this.height-20})`);

      //xScale을 만든다.
      this.xScale.domain([arr[arr.length-1], arr[0]])
      this.xAxisG.call(this.xAxis)

      //현재 기준으로 데이터를 가져온다.
      var dataSet = this.option.dataSource.getWholeData()

      var y = this.yScale,
          x = this.xScale,
          h = this.height,
          w = this.width

      //가져온 데이터를 이용하여, yScale을 만든다.
      y = d3.scaleLinear().rangeRound([h, 0])
                      .domain([d3.min(dataSet, function(d){return d['value']}),
                               d3.max(dataSet, function(d){return d['value']})])
      this.yScale = y

      // bar그래프로 표시한다.
      var g = this.svg.append('g').attr('class', 'barChart').attr("transform", `translate(-20, -20)`)

      var t = this
       g.selectAll(".bar")
        .data(dataSet)
        .enter()
        .append('g')
        .attr("class", "rectGroup")
        .append("rect")
        .attr("class", "bar")
        .attr("x", function(d, i){
          // data의 key값과 scale의 domain을 이용하지 않고, svg의 width를 이용.
          return w-( w/(t.option.wholeTimeRange*60/t.option.barRange) * (i))
        })
        .attr("y", function(d) {
          return y(d['value'])
        })
        .attr("width", w / dataSet.length - 1)
        .attr("height", function(d) {
          return h - y(d['value'])
        })

      //brush를 적용한다.
      var brush = d3.brushX().extent([
        [0, 0],
        [w, h-20]
      ]).on("end", this.brushed.bind(t));

      var brushSize = this.option.selectRange
        brushSize = Math.round(brushSize / this.option.barRange)
        brushSize = brushSize * (w /(this.option.wholeTimeRange*60/this.option.barRange))

      this.svg.append("g")
        .attr("class", "brush")
        .call(brush)
        .call(brush.move, [w-brushSize, w])

      var svgG = this.svg
      this.svg.on('click', function(){
          svgG.selectAll('line').remove()
          var position = d3.mouse(this)
          var barWidth = svgG.select('.bar').style('width')
          barWidth = barWidth.replace(/[a-z]/gi,"")

          svgG.select('.brush')
            .call(brush.move, [position[0]-brushSize, position[0]])

        })
    }

    // brush로 선택한 범위에 세로바 생성
    selectedRange(from, to){

      this.svg.selectAll('line').remove()
      this.svg.select('.brush')
          .append("line")
          .attr("x1", from)
          .attr("y1", 0)
          .attr("x2", from)
          .attr("y2", this.height)
          .style("stroke-width", 2)
          .style("stroke", "black")

      var t = d3.transition()
          .duration(2000)
          .ease(d3.easeLinear)

      d3.selectAll("line").transition(t)
        .attr("x1", to)
        .attr("x2", to)

    }

    // brush 위치가 바뀌면 적용될 이벤트
    brushed() {
      d3.selectAll('line').remove()
      d3.select('.brush')
        .append("line")
        .attr("x1", d3.event.selection[0])
        .attr("y1", 0)
        .attr("x2", d3.event.selection[0])
        .attr("y2", this.height - 20)
        .style("stroke-width", 2)
        .style("stroke", "green")

      var t = d3.transition()
          .duration(2000)
          .ease(d3.easeLinear)

      d3.selectAll("line").transition(t)
        .attr("x1", d3.event.selection[1])
        .attr("x2", d3.event.selection[1])
    }

    //가져온 data로 bar차트를 update 한다.
    updateBarchart(data) {
      console.log(data)

      //새로운 bar를 하나 그린다. 스케일 수정
      var t = this
      var y = this.yScale

      //bar width
      var barWidth = t.width / (t.option.wholeTimeRange*60/t.option.barRange)
      var xVal = t.width + barWidth

      //transition
      var transition = d3.transition()
                          .duration(1000)
                          .ease(d3.easeLinear)

      var yVal = data[0].value
      var from = y.domain()[0]
      var to = y.domain()[1]

      if(yVal < from){
        from = yVal
      }else if(yVal > to){
        to = yVal
      }

      y = d3.scaleLinear()
      .domain([from, to])
      .range([t.height, 0])

      this.yScale = y

      var svg = this.svg
      svg.selectAll('.barChart')
          .append('g')
          .attr("class", "rectGroup")
          .data(data)
          .append('rect')
          .attr("class", "bar")
          .attr("height", function(d) {
            return t.height - y(d['value'])
          })
          .attr("width", barWidth - 1)
          .attr("x", xVal)
          .attr("y", function(d) {
            return y(d['value'])
          })

      //기존의 bar들을 이동시킨다.
      svg.selectAll('.bar')
          .transition(transition)
          .each(function(d,i){
            if(Math.floor(this.x.animVal.value) != Math.floor(barWidth)){
              d3.select(this)
                .transition(transition)
                .attr("height", function(d) {
                  return t.height - y(d['value'])
                })
                .attr('x', function(d){
                  return this.x.animVal.value - barWidth
                })
                .attr("y", function(d) {
                  return y(d['value'])
                })
            }
          })

      //가장 왼쪽의 bar를 지운다.
      svg.selectAll('.bar')
          .filter(function (d, i) {
            if(Math.floor(this.x.animVal.value) == Math.floor(barWidth)){
              return d
            }
          }).transition(transition).attr("width", 0).remove()

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
