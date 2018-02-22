function BrushWidget(id, options){

  //특정 영역 지정할 수 있도록
  id = id.replace('#', '')
  document.getElementById(id).innerHTML = '<svg width="600" height="300"></svg>'

  //timeColumn(x축), dataColumn(y축)에 표시될 컬럼 지정 옵션
  var timeColumn = options.timeColumn,
      dataColumn = options.dataColumn

  var timeInfo = { allDataSec: options.allDataSec, barDataSec: options.barDataSec }

  var svg = d3.select("svg"),
    width = svg.attr("width")
    height = svg.attr("height")

  var x = d3.scaleTime()
  var y = d3.scaleLinear().rangeRound([height, 0])

  var g = svg.append("g")

  var brush = d3.brushX().extent([
    [0, 0],
    [width, height]
  ]).on("end", brushed)

  d3.json('../data/data.json', function(error, data){

      if (error) throw error


      var dataset = dataSet(data, timeInfo)

      x.domain([dataset[dataset.length - 1][timeColumn], dataset[0][timeColumn]])
        .rangeRound([0, width])

      y.domain([d3.min(dataset, function(d){
         return d[dataColumn]
       }), d3.max(dataset, function(d) {
        return d[dataColumn]
      })])

      // y.domain([0, d3.max(data, function(d) {
      //   return d[dataColumn]
      // })])
      g.on('click', function(){
        var coords = d3.mouse(this);
      })
      g.append("g")
        .attr("class", "axis axis--x")
        .attr("transform", "translate(0," + height + ")")
        .call(d3.axisBottom(x))

      g.append("g")
        .attr("class", "axis axis--y")
        .call(d3.axisLeft(y))
        .append("text")

      g.selectAll(".bar")
        .data(dataset)
        .enter().append("rect")
        .attr("class", "bar")
        .attr("x", function(d) {
          return x(d[timeColumn])
        })
        .attr("y", function(d) {
          return y(d[dataColumn])
        })
        .attr("width", width / dataset.length)
        .attr("height", function(d) {
          return height - y(d[dataColumn])
        })

      g.append("g")
        .attr("class", "brush")
        .call(brush)
        .call(brush.move, [width/2 , width])
        .append("line")
        .attr("class", 'line')
        .attr("x1", width/2)
        .attr("y1", 0)
        .attr("x2", width/2)
        .attr("y2", height)
        .style("stroke-width", 3)
        .style("stroke", "red")
        .style("fill", "none");
        // .call(brush.move, x.range())

      var t = d3.transition()
          .duration(2000)
          .ease(d3.easeLinear)

      d3.selectAll(".line").transition(t)
        .attr("x1", width)
        .attr("x2", width)
  })


  function dataSet(data, timeInfo){

    var currentTimestamp = new Date().getTime()

    var dataMin = []

    var barDataSec = parseInt(timeInfo['barDataSec']),
        allDataSec = parseInt(timeInfo['allDataSec'])

    for(var i=0; i<data.length; i++){

      // 현재 시각 기준으로 x축 시간 단위를 나누는데, 현재는 데이터가 과거 데이터이기 때문에 임시 처리
      if(i==0){
        currentTimestamp = data[i][timeColumn]
      }

      if(data[i][timeColumn]+allDataSec >= Math.ceil( currentTimestamp/barDataSec ) * barDataSec){
        dataMin.push(data[i])
      }
    }

    var dataSec = []

    for (var i=0; i<allDataSec/barDataSec; i++) {
      var dataObj = {}
      dataObj[timeColumn] = Math.ceil( currentTimestamp/barDataSec ) * barDataSec

      dataObj.sum = 0
      dataObj.count = 0

      dataSec.push(dataObj)
      currentTimestamp -= barDataSec
    }

    var idx = 0

    for(var i=0; i<dataMin.length; i++){

      for(var j=0; j<dataSec.length; j++){

        if(dataSec[j][timeColumn] >= dataMin[i][timeColumn]
            && (!!dataSec[j+1] && dataSec[j+1][timeColumn] < dataMin[i][timeColumn])){
          dataSec[j].sum += parseInt(dataMin[i][dataColumn])
          dataSec[j].count += 1
        }

      }

    }

    Array.from(dataSec).forEach((el)=>{
      if(el.count != 0){
        el[dataColumn] = el.sum/el.count
      }else{
        el[dataColumn] = 0
      }
    })


    return dataSec
  }

  function brushed(){

    if (!d3.event.sourceEvent) return // Only transition after input.
    if (!d3.event.selection) return // Ignore empty selections.

    document.getElementById("table-body").innerHTML = ''

    var d0 = d3.event.selection.map(x.invert) // selection의 값으로 해당 time 가져옴

    // var d1 = d0.map(d3.timeSecond.round) // d0의 값을 second 단위에서 반올림 하여 반환
    //// If empty when rounded, use floor & ceil instead.
    // if (d1[0] >= d1[1]) {
    //   console.log('>=')
    //   d1[0] = d3.timeSecond.floor(d0[0])
    //   d1[1] = d3.timeSecond.offset(d1[0])
    // }
    console.log(d3.event.selection[0], d3.event.selection[1])
    var selection = chooseSelection(d3.event.selection[0], d3.event.selection[1])

    var tr, tdDate, txtDate, tdPrice, txtPrice

    Array.from(selection).forEach(function(arr) {
      tr = document.createElement('TR')

      tdDate = document.createElement('TD')
      txtDate = document.createTextNode(arr[timeColumn])
      tdDate.appendChild(txtDate)

      tdPrice = document.createElement('TD')
      txtPrice = document.createTextNode(arr[dataColumn])
      tdPrice.appendChild(txtPrice)

      tr.appendChild(tdDate)
      tr.appendChild(tdPrice)

      document.getElementById("table-body").appendChild(tr)
    })

    d3.select(this).transition().call(d3.event.target.move, d0.map(x))
  }

  function chooseSelection(start, end){

    var arr = []

    d3.selectAll(".bar").each(function(el) {


      var position = this.x.animVal.value
      if (position >= start && position <= end) {
        arr.push(el)
      }
    })

    return arr
  }

}
