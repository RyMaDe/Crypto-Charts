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

    const width = 1000, height = 350;
    const x_scale = d3.scaleBand().range([0, width])
    const y_scale = d3.scaleLinear().range([height,0])

    for (const d in Data["Time Series (Digital Currency Daily)"]){
        Data["Time Series (Digital Currency Daily)"][d]["4b. close (USD)"] = +Data["Time Series (Digital Currency Daily)"][d]["4b. close (USD)"]
    }

    const dataArray = Object.entries(Data["Time Series (Digital Currency Daily)"])
    x_scale.domain(Object.keys(Data["Time Series (Digital Currency Daily)"]))
    y_scale.domain([0, d3.max(Object.values(Data["Time Series (Digital Currency Daily)"]), d => d["4b. close (USD)"])])

    let svg = d3.select("#dataVis")
            .attr("width", width)
            .attr("height", height)
            .selectAll("rect")
            .data(dataArray)
            .join("rect")
                .attr("class", "bar")
                .attr("x", d => x_scale(d[0]))
                .attr("y", d => y_scale(d[1]["4b. close (USD)"]))
                .attr("width", x_scale.bandwidth())
                .attr("height", d => height - y_scale(d[1]["4b. close (USD)"]))
}