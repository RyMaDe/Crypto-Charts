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
    // {% url 'core:CoinDataAPI' %} "/api/CoinData"
    // console.log(response.data)
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

    let svg = d3.select("#dataVis")
            .attr("width", width)
            .attr("height", height)
            .attr("viewBox", [0, 0, width, height])
            .attr("style", "max-width: 100%; height: auto; height: intrinsic;")
    
    svg.selectAll("*").remove()

    svg.append("g") // x-axis
        .attr("transform", "translate("+0+","+(height-margin.bottom)+")")
        .call(d3.axisBottom(x_scale));

    svg.append("g") // y-axis
        .attr("transform", "translate("+(margin.left)+","+0+")")
        .call(d3.axisLeft(y_scale));

    svg.append("path")
    .datum(dataArray)
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
        /*.append("title")
        .text((d) => 
        `date: ${d[1]["date"]}\n
        open: ${d[1]["1b. open (USD)"]}\n
        close: ${d[1]["4b. close (USD)"]}\n
        high: ${d[1]["2b. high (USD)"]}\n
        low: ${d[1]["3b. low (USD)"]}`) */

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
}
