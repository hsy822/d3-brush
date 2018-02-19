function BrushWidget(id, options){

  //특정 영역 지정할 수 있도록
  id = id.replace('#', '')
  document.getElementById(id).innerHTML = '<svg width="600" height="300"></svg>'

  //timeColumn(x축), dataColumn(y축)에 표시될 컬럼 지정 옵션
  var timeColumn = options.timeColumn,
      dataColumn = options.dataColumn

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

  d3.json('https://api.korbit.co.kr/v1/transactions?time=hour', function(error, data){
      if (error) throw error

      // var data= [{"timestamp":1519035988475,"tid":"5092100","price":"12351000","amount":"0.00802875"},
      // {"timestamp":1519035977785,"tid":"5092099","price":"12359500","amount":"0.16158922"},
      // {"timestamp":1519035976972,"tid":"5092098","price":"12359500","amount":"0.008290464824628828"},
      // {"timestamp":1519035974612,"tid":"5092097","price":"12351000","amount":"0.01014001"},
      // {"timestamp":1519035956799,"tid":"5092096","price":"12359500","amount":"0.70906865"},
      // {"timestamp":1519035948899,"tid":"5092095","price":"12359500","amount":"0.404547109510902545"}]

      x.domain([data[data.length - 1][timeColumn], data[0][timeColumn]])
        .rangeRound([0, width])

      y.domain([12000000, d3.max(data, function(d) {
        return d[dataColumn]
      })])

      // y.domain([0, d3.max(data, function(d) {
      //   return d[dataColumn]
      // })])

      g.append("g")
        .attr("class", "axis axis--x")
        .attr("transform", "translate(0," + height + ")")
        .call(d3.axisBottom(x))

      g.append("g")
        .attr("class", "axis axis--y")
        .call(d3.axisLeft(y))
        .append("text")

      g.selectAll(".bar")
        .data(data)
        .enter().append("rect")
        .attr("class", "bar")
        .attr("x", function(d) {
          console.log(new Date(d[timeColumn]))
          return x(d[timeColumn])
        })
        .attr("y", function(d) {
          return y(d[dataColumn])
        })
        .attr("width", width / data.length)
        .attr("height", function(d) {
          return height - y(d[dataColumn])
        });

      g.append("g")
        .attr("class", "brush")
        .call(brush)
        // .call(brush.move, x.range())
  })

  function brushed(){

    if (!d3.event.sourceEvent) return // Only transition after input.
    if (!d3.event.selection) return // Ignore empty selections.

    document.getElementById("table-body").innerHTML = ''

    var d0 = d3.event.selection.map(x.invert) // selection의 값으로 해당 time 가져옴


    // var d1 = d0.map(d3.timeSecond.round) // d0의 값을 second 단위에서 반올림 하여 반환
    //
    // if (d1[0].getMilliseconds() >= d1[1].getMilliseconds()) {
    //   console.log('>=')
    //   d1[0] = d3.timeSecond.floor(d0[0])
    //   d1[1] = d3.timeSecond.offset(d1[0])
    // }

    // var d1 = d0.map(d3.timeDay)
    //
    //   console.log(d3.event.selection)
    //   console.log(d3.timeDay.round)
    //   console.log(d0)
    //   console.log(d1)
    //
    // // If empty when rounded, use floor & ceil instead.
    // if (d1[0] >= d1[1]) {
    //   console.log('>=')
    //   d1[0] = d3.timeDay.floor(d0[0])
    //   d1[1] = d3.timeDay.offset(d1[0])
    // }

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
