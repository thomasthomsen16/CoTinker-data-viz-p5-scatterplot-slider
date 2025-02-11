let interactiveChartView = null; // Global reference to the chart view
let chart2View = null; // Reference to the parallel coordinate plot view

document.addEventListener("DOMContentLoaded", function () {
    fetch('https://raw.githubusercontent.com/thomasthomsen16/dataset-p2/refs/heads/main/30000_spotify_songs.csv')
        .then(response => response.text())
        .then(csvData => {
            const parsedData = parseCSV(csvData);
            const sampledData = getRandomSample(parsedData, 80);

            // Render both charts (interactive & static)
            renderCharts(sampledData);
        })
        .catch(error => console.error("Error loading CSV data: ", error));
});

function renderCharts(sampledData) {
    chart1(sampledData, "chart1");
    chart2(sampledData, "chart2")
}

function chart1(sampledData, chartId) {
    const chartContainer = document.getElementById(chartId);
    chartContainer.innerHTML = ""; // Clear existing content

    const spec = {
        $schema: "https://vega.github.io/schema/vega-lite/v5.json",
        width: 700,
        height: 600,
        data: { values: sampledData },
        transform: [
            {
                calculate: "datum.danceability * (collapseXSignal)",
                as: "Danceability"
            },
            {
                calculate: "datum.tempo * (collapseYSignal)",
                as: "Tempo"
            }
        ],
        mark: { type: "circle", clip: "true" },
        encoding: {
            x: { "field": "Danceability", "type": "quantitative", "scale": { "domain": [0, 1] } },
            y: { field: "Tempo", "type": "quantitative", "scale": { "domain": [0, 220] } },
            color: {
                field: "playlist_genre",
                type: "nominal",
            }
        },
        params: [
            {
                name: "collapseXSignal",
                value: 1,
                // bind: {input: "range", min:0, max:1, step: 0.01, name: "X collapse"}
            },
            {
                name: "collapseYSignal",
                value: 1,
                // bind: {input: "range", min:0, max:1, step: 0.01, name: "Y collapse"}
            },
        ]
    };

    vegaEmbed(`#${chartId}`, spec).then(result => {
        interactiveChartView = result.view;
        console.log("Chart1 rendered and view is initialized.");
    }).catch(error => {
        console.error("Error embedding chart1:", error);
    });
}

function chart2(sampledData, chartId) {
    const chartContainer = document.getElementById(chartId);
    chartContainer.innerHTML = ""; // Clear existing content

    const spec = {
        "$schema": "https://vega.github.io/schema/vega-lite/v5.json",
        "description": "Parallel coordinates plot for Spotify songs showing audio features, color-coded by genre.",
        "data": {
            "values": sampledData  // Data passed from JavaScript (after parsing CSV)
        },
        "width": 700,
        "height": 615,
        // Add four parameters to control the visibility of each variable’s data points:
        "params": [
            { "name": "showTempo", "value": false },
            { "name": "showDanceability", "value": false },
            { "name": "showEnergy", "value": false },
            { "name": "showValence", "value": false }
        ],
        "transform": [
            {
                "filter": "datum['danceability'] != null && datum['energy'] != null && datum['valence'] != null && datum['tempo'] != null"
            },
            {
                "window": [{ "op": "count", "as": "index" }]
            },
            {
                "fold": ["tempo", "danceability", "energy", "valence"],
                "as": ["key", "value"]
            },
            {
                "calculate": "toNumber(datum.value)",
                "as": "value"
            },
            {
                "joinaggregate": [
                    { "op": "min", "field": "value", "as": "min" },
                    { "op": "max", "field": "value", "as": "max" }
                ],
                "groupby": ["key"]
            },
            {
                "calculate": "datum.max === datum.min ? 0 : (datum.value - datum.min) / (datum.max - datum.min)",
                "as": "norm_val"
            },
            {
                "calculate": "(datum.min + datum.max) / 2",
                "as": "mid"
            }
        ],
        "layer": [
            // Layer 1: Draw rules (e.g. grid lines) for each axis.
            {
                "mark": { "type": "rule", "color": "#ccc" },
                "encoding": {
                    "detail": { "aggregate": "count" },
                    "x": {
                        "type": "nominal",
                        "field": "key",
                        "sort": ["tempo", "danceability", "energy", "valence"]
                    }
                }
            },
            // Layer 2: Draw connecting lines.
            {
                "mark": "line",
                "transform": [
                    {
                        "filter": "showTempo && showDanceability && showEnergy && showValence"
                    }
                ],
                "encoding": {
                    "color": { "type": "nominal", "field": "playlist_genre" },
                    "detail": { "type": "nominal", "field": "index" },
                    "x": {
                        "type": "nominal",
                        "field": "key",
                        "sort": ["tempo", "danceability", "energy", "valence"]
                    },
                    "y": { "type": "quantitative", "field": "norm_val", "axis": null },
                    "tooltip": [
                        { "type": "quantitative", "field": "tempo" },
                        { "type": "quantitative", "field": "danceability" },
                        { "type": "quantitative", "field": "energy" },
                        { "type": "quantitative", "field": "valence" }
                    ]
                }
            },
            // Layer 3: Draw data points (only if the corresponding variable is active).
            {
                "mark": "circle",
                "transform": [
                    {
                        "filter": "(datum.key=='tempo' && showTempo) || (datum.key=='danceability' && showDanceability) || (datum.key=='energy' && showEnergy) || (datum.key=='valence' && showValence)"
                    }
                ],
                "encoding": {
                    "color": { "type": "nominal", "field": "playlist_genre" },
                    "detail": { "type": "nominal", "field": "index" },
                    "x": {
                        "type": "nominal",
                        "field": "key",
                        "sort": ["tempo", "danceability", "energy", "valence"]
                    },
                    "y": { "type": "quantitative", "field": "norm_val", "axis": null },
                    "size": { "value": 30 },
                    "tooltip": [
                        { "type": "quantitative", "field": "tempo" },
                        { "type": "quantitative", "field": "danceability" },
                        { "type": "quantitative", "field": "energy" },
                        { "type": "quantitative", "field": "valence" }
                    ]
                }
            },
            // Layer 4: Draw top labels/ticks.
            {
                "encoding": {
                    "x": {
                        "type": "nominal",
                        "field": "key",
                        "sort": ["tempo", "danceability", "energy", "valence"]
                    },
                    "y": { "value": 0 }
                },
                "layer": [
                    {
                        "mark": { "type": "text", "style": "label" },
                        "encoding": {
                            "text": { "aggregate": "max", "field": "max" }
                        }
                    },
                    {
                        "mark": { "type": "tick", "style": "tick", "size": 8, "color": "#ccc" }
                    }
                ]
            },
            // Layer 5: Draw middle labels/ticks.
            {
                "encoding": {
                    "x": {
                        "type": "nominal",
                        "field": "key",
                        "sort": ["tempo", "danceability", "energy", "valence"]
                    },
                    "y": { "value": 150 }
                },
                "layer": [
                    {
                        "mark": { "type": "text", "style": "label" },
                        "encoding": {
                            "text": { "aggregate": "min", "field": "mid" }
                        }
                    },
                    {
                        "mark": { "type": "tick", "style": "tick", "size": 8, "color": "#ccc" }
                    }
                ]
            },
            // Layer 6: Draw bottom labels/ticks.
            {
                "encoding": {
                    "x": {
                        "type": "nominal",
                        "field": "key",
                        "sort": ["tempo", "danceability", "energy", "valence"]
                    },
                    "y": { "value": 300 }
                },
                "layer": [
                    {
                        "mark": { "type": "text", "style": "label" },
                        "encoding": {
                            "text": { "aggregate": "min", "field": "min" }
                        }
                    },
                    {
                        "mark": { "type": "tick", "style": "tick", "size": 8, "color": "#ccc" }
                    }
                ]
            }
        ],
        "config": {
            "axisX": { "domain": false, "labelAngle": 0, "tickColor": "#ccc", "title": null },
            "view": { "stroke": null },
            "style": {
                "label": { "baseline": "middle", "align": "right", "dx": -5 },
                "tick": { "orient": "horizontal" }
            }
        }
    };

    vegaEmbed(`#${chartId}`, spec)
        .then(result => {
            chart2View = result.view;
            console.log("Chart2 rendered and view is initialized.");
        })
        .catch(error => {
            console.error("Error embedding chart2:", error);
        });
};


const xCollapseSlider = document.getElementById("xCollapseSlider");
const yCollapseSlider = document.getElementById("yCollapseSlider");

// Update the collapseXSignal based on the x-axis slider value
xCollapseSlider.addEventListener("input", function (e) {
    const newValue = parseFloat(e.target.value);
    if (interactiveChartView) {
        // For example: when newValue is 1, points are in their normal positions; when 0, they collapse to x=0.
        interactiveChartView.signal("collapseXSignal", newValue).runAsync();
    }
});

// Update the collapseYSignal based on the x-axis slider value
yCollapseSlider.addEventListener("input", function (e) {
    const newValue = parseFloat(e.target.value);
    if (interactiveChartView) {
        // For example: when newValue is 1, points are in their normal positions; when 0, they collapse to x=0.
        interactiveChartView.signal("collapseYSignal", newValue).runAsync();
    }
});

// Grab the value of the sliders and set the buttons to active when slider = 0 
const ySlider = document.getElementById('yCollapseSlider');
const yButton = document.getElementById('y-button');
const xSlider = document.getElementById('xCollapseSlider');
const xButton = document.getElementById('x-button');

yCollapseSlider.addEventListener('input', function () {
    if (yCollapseSlider.value == 0) {
        yButton.disabled = false;
    } else {
        yButton.disabled = true;
    }
});
xCollapseSlider.addEventListener('input', function () {
    if (xCollapseSlider.value == 0) {
        xButton.disabled = false;
    } else {
        xButton.disabled = true;
    }
});

// Assume chart2View is a global variable that stores the Vega view for chart2.

xButton.addEventListener('click', function () {
    if (chart2View) {
        chart2View.signal("showTempo", true).runAsync();
    }
    // Rest the xCollapseSlider value to 1
    xCollapseSlider.value = 1;
    if (interactiveChartView) {
        interactiveChartView.signal("collapseXSignal", 1).runAsync();
    }
});

yButton.addEventListener('click', function () {
    if (chart2View) {
        chart2View.signal("showDanceability", true).runAsync();
    }
    // Reset the yCollapseSlider value to 1
    yCollapseSlider.value = 1;
    if (interactiveChartView) {
        interactiveChartView.signal("collapseYSignal", 1).runAsync();
    }
});


// Function to parse CSV data into an array of objects
function parseCSV(csvData) {
    const rows = csvData.split("\n").filter(row => row.trim() !== "");
    const header = rows[0].split(",").map(column => column.trim());

    return rows.slice(1).map(row => {
        const values = row.split(",");
        if (values.length !== header.length) {
            return null; // Skip rows with mismatched columns
        }
        let parsedRow = {};
        header.forEach((column, index) => {
            parsedRow[column] = values[index].trim();
        });

        // Convert fields to numbers:
        parsedRow.danceability = isNaN(parsedRow.danceability) ? null : parseFloat(parsedRow.danceability);
        parsedRow.tempo = isNaN(parsedRow.tempo) ? null : parseFloat(parsedRow.tempo);
        parsedRow.energy = isNaN(parsedRow.energy) ? null : parseFloat(parsedRow.energy);
        parsedRow.valence = isNaN(parsedRow.valence) ? null : parseFloat(parsedRow.valence);

        // Only return the row if all values are valid:
        if (
            parsedRow.danceability !== null &&
            parsedRow.tempo !== null &&
            parsedRow.energy !== null &&
            parsedRow.valence !== null
        ) {
            return parsedRow;
        } else {
            return null;
        }
    }).filter(row => row !== null);
};


// Function to get a random sample of data points
function getRandomSample(data, sampleSize) {
    const validData = data.filter(row => row.danceability !== null && row.tempo !== null);

    if (validData.length <= sampleSize) {
        return validData;
    }

    const sampledData = [];
    const seenIndexes = new Set();

    while (sampledData.length < sampleSize) {
        const randomIndex = Math.floor(Math.random() * validData.length);

        if (!seenIndexes.has(randomIndex)) {
            sampledData.push(validData[randomIndex]);
            seenIndexes.add(randomIndex);
        }
    }
    return sampledData;
}