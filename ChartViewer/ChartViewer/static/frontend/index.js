import { searchable } from "./Searchable.js";

document.getElementById("app").innerHTML = "<h1>ChartViewer</h1>"

const searchInput = document.getElementById("search-input");
const inputBox = document.getElementById("search-bar");
const searchList = document.getElementById("search-list");

inputBox.addEventListener("keyup", (e) => {
    let userData = e.target.value;
    let emptyArray = [];
    if (userData) {
        emptyArray = searchable.filter((data) => {
            // returns true if either the symbol or name matches.
            return data[0].toLocaleLowerCase().startsWith(userData.toLocaleLowerCase()) || 
                    data[1].toLocaleLowerCase().startsWith(userData.toLocaleLowerCase());
        })

        emptyArray = emptyArray.map((data) => {
            return "<li>"+data[0]+" - "+data[1]+"</li>";
        })

        searchInput.classList.add("active") // show the box
        showSuggestions(emptyArray)

        let allLi = searchList.querySelectorAll("li");
        for (let i=0; i<allLi.length; i++){
            // Add onclick attribute to all li tags.
            allLi[i].addEventListener("click", (e) =>{
                select(allLi[i]);
                e.stopPropagation(); // stop the parent handler being notified.
                // Using script type module so we can't use .setAttribute("onclick", "select(this)")
            });
        }
    } else {
        searchInput.classList.remove("active") // hide the box
    }
})

function select(element) {
    let userChoice = element.textContent;
    inputBox.value = userChoice;
    searchInput.classList.remove("active");
    dataAPICall(userChoice)
}

function showSuggestions(arr) {
    // Show suggestions:
    let listData;
    if (!arr.length){
        let userValue = inputBox.value;
        listData = "<li>" + userValue + "</li>"
    } else {
        listData = arr.join("");
    }
    searchList.innerHTML = listData;
}

async function dataAPICall(coin){
    const response = await axios.get("/api/CoinData", {params: {"coin": coin.split(" - ")[0]}});
    GraphUpdate(response.data)
}

function GraphUpdate(Data) { // Setting up the graph
    console.log(Data) // Testing data is available

    const width = 960, height = 500;
    const margin = { top: 20, right: 10, bottom: 50, left: 60 };
    const x_scale = d3.scaleTime().rangeRound([margin.left, width-margin.right])
    const y_scale = d3.scaleLinear().rangeRound([height-margin.bottom, margin.top])

    for (const d in Data["Time Series (Digital Currency Daily)"]){
        let newDate = new Date(d3.timeParse("%Y-%m-%d")(d))
        Data["Time Series (Digital Currency Daily)"][d]["4b. close (USD)"] = +Data["Time Series (Digital Currency Daily)"][d]["4b. close (USD)"]
        Data["Time Series (Digital Currency Daily)"][d]["date"] = newDate;
    }

    let dataArray = Object.entries(Data["Time Series (Digital Currency Daily)"])
    x_scale.domain(d3.extent(Object.values(Data["Time Series (Digital Currency Daily)"]), d => d["date"]))
    y_scale.domain([0, d3.max(Object.values(Data["Time Series (Digital Currency Daily)"]), d => d["4b. close (USD)"])])

    let x_scale_Tooltip = x_scale // Created a copy of the x_scale for use by the tooltip after zoom or panning.

    // creating zoom behaviour.
    const zoom = d3.zoom()
        .scaleExtent([1, 10])
        .translateExtent([[-width+margin.left+margin.right, -height+margin.bottom+margin.top], [(width-margin.right)+width-margin.right-margin.bottom,(height)+height-margin.top-margin.bottom]])
        .on("zoom", zoomed);

    let svg = d3.select("#dataVis")
            .call(zoom)  // For zoom to work
            .attr("width", width)
            .attr("height", height)
            .attr("viewBox", [0, 0, width, height])
            .attr("style", "max-width: 100%; height: auto; height: intrinsic;")

    svg.selectAll("*").remove()

    svg.append("g") // x-axis
        .attr("class", "x axis")
        .attr("transform", "translate("+0+","+(height-margin.bottom)+")")
        .call(d3.axisBottom(x_scale));

    svg.append("g") // y-axis
        .attr("class", "y axis")
        .attr("transform", "translate("+(margin.left)+","+0+")")
        .call(d3.axisLeft(y_scale));

    svg.append("defs") // Adding a clipPath for the Zoom.
        .append("clipPath")
        .attr("id", "chart-path")
        .append("rect")
        .attr("width", width-margin.right-margin.left)
        .attr("height", height-margin.bottom-margin.top)
        .attr("transform", "translate("+margin.left+","+(margin.top)+")")

    svg.append("path")
    .datum(dataArray)
        .attr("class", "line")
        .attr("fill", "none")
        .attr("stroke", "steelblue")
        .attr("d", d3.line()
        .x(d => x_scale(d[1]["date"])) 
        .y(d => y_scale(d[1]["4b. close (USD)"]))
        )
        .attr("stroke-width", 0)
        .transition()
        .duration(350)
        .attr("stroke-width", 2)
        .attr("clip-path", "url(#chart-path)")  // Applying the zoom clipPath to the line chart.

    svg.append("text") // y label
        .attr("transform", "rotate(-90)")
        .attr("y", 13)
        .attr("x", -height/2)
        .style("text-anchor", "middle")
        .text("USD")

    svg.append("text") // x label
        .attr("x", width/2)
        .attr("y", height)
        .text("Date")

    // Adding tooltip
    const focus = svg.append("g")
        .attr("class", "focus")
        .style("display", "none")

    focus.append("line")
        .attr("class", "x")
        .style("stroke-dasharray", "3,3")
        .attr("stroke", "black")
        .style("opacity", 0.5)
        .attr("y1", 0)
        .attr("y2", height-margin.bottom)

    focus.append("text") // Legend
        .attr("class", "y1")
        .attr("y", 20)
        .attr("x", margin.left)
    
    focus.append("text") // tooltip closing price along the y-axis
        .attr("class", "y2")
        .attr("x", margin.left+3)
        .style("font-size", "11px")

    function mouseMove(event){
        const bisect = d3.bisector((d) => d[1]["date"]).left,
        x0 = x_scale_Tooltip.invert(d3.pointer(event, this)[0]), // Using x_scale copy for the tooltip
        i = bisect(dataArray, x0),
        d = dataArray[i]
        //console.log(i, d, x0)

        focus.select(".x")
            .attr("transform", "translate(" + x_scale_Tooltip(d[1]["date"]) + "," + y_scale(d[1]["4b. close (USD)"]) + ")")
            .attr("y2", height-margin.bottom-y_scale(d[1]["4b. close (USD)"]))

        focus.select(".y1")
            .text(`date: ${d[1]["date"].toLocaleString().split(",")[0]} open: ${+d[1]["1b. open (USD)"]} 
            close: ${d[1]["4b. close (USD)"]} high: ${+d[1]["2b. high (USD)"]} 
            low: ${+d[1]["3b. low (USD)"]}`)

        focus.select(".y2")
            .attr("transform", "translate(" + 0 + "," + y_scale(d[1]["4b. close (USD)"]) + ")")
            .text(`${d[1]["4b. close (USD)"]}`)
    }

    svg.append("rect")
        .attr("width", width-margin.right)
        .attr("height", height-margin.bottom-margin.top)
        .attr("transform", "translate("+ 0+","+margin.top+")")
        .style("fill", "none")
        .style("pointer-events", "all")
        .on("mouseover", () => {
            focus.style("display", null)
        })
        .on("mouseout", ()=>{
            focus.style("display", "none")
        })
        .on("touchmove mousemove", mouseMove)

    // Adding Zoom.
    function zoomed({transform}) {
        const newX = transform.rescaleX(x_scale)
        //const newY = transform.rescaleY(y_scale)
        x_scale_Tooltip = newX
        // Zooming and panning only in the x direction. If adding Y, update tooltip too.

        svg.select(".x.axis").call(d3.axisBottom(newX))
        //svg.select(".y.axis").call(d3.axisLeft(newY))
        svg.selectAll("path.line")
            .attr("d", d3.line()
            .x(d => newX(d[1]["date"])) 
            .y(d => y_scale(d[1]["4b. close (USD)"])) // Only zoom & pan in x axis
            )
    }
}