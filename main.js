let interactiveChartView = null; // Global reference to the chart view

document.addEventListener("DOMContentLoaded", function () {
    fetch('https://raw.githubusercontent.com/thomasthomsen16/dataset-p2/refs/heads/main/30000_spotify_songs.csv')
        .then(response => response.text())
        .then(csvData => {
            const parsedData = parseCSV(csvData);
            const sampledData = getRandomSample(parsedData, 1000);

            // Render both charts (interactive & static)
            renderCharts(sampledData);
        })
        .catch(error => console.error("Error loading CSV data: ", error));
});

function renderCharts(sampledData) {
    chart1(sampledData, "chart1");
    chart2(sampledData,"chart2")

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

function chart2 (sampledData,chartId) {
    const chartContainer = document.getElementById(chartId);
    chartContainer.innerHTML = ""; // Clear existing content

    const spec = {
        "$schema": "https://vega.github.io/schema/vega-lite/v5.json",
        "description": "Parallel coordinates plot for Spotify songs showing audio features, color-coded by genre.",
        "data": {
            "values": sampledData  // Data passed from JavaScript (after parsing CSV)
        },
        "width": 700,
        "height": 600,
               "transform": [
            {
                "filter": "datum['danceability'] != null && datum['energy'] != null && datum['valence'] != null && datum['tempo'] != null"
            },
            {
                "window": [{ "op": "count", "as": "index" }]
            },
            {
                "fold": ["tempo", "danceability", "energy", "valence"],  // Only the selected features
                "as": ["key", "value"]
            },
            {
                "joinaggregate": [
                    { "op": "min", "field": "value", "as": "min" },
                    { "op": "max", "field": "value", "as": "max" }
                ],
                "groupby": ["key"]
            },
            {
                "calculate": "(datum.value - datum.min) / (datum.max - datum.min)",
                "as": "norm_val"
            },
            {
                "calculate": "(datum.min + datum.max) / 2",
                "as": "mid"
            }
        ],
        "layer": [
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
            {
                "mark": "line",
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

    vegaEmbed(`#${chartId}`, spec);
}
}

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

// Function to parse CSV data into an array of objects
function parseCSV(csvData) {
    const rows = csvData.split("\n").filter(row => row.trim() !== ""); // Remove empty rows
    const header = rows[0].split(",").map(column => column.trim()); // Trim headers

    return rows.slice(1).map(row => {
        const values = row.split(",");

        if (values.length !== header.length) {
            return null; // Skip rows with mismatched columns
        }

        let parsedRow = {};
        header.forEach((column, index) => {
            parsedRow[column] = values[index].trim();
        });

        // Convert danceability and tempo to numbers
        parsedRow.danceability = isNaN(parsedRow.danceability) ? null : parseFloat(parsedRow.danceability);
        parsedRow.tempo = isNaN(parsedRow.tempo) ? null : parseFloat(parsedRow.tempo);

        return parsedRow.danceability !== null && parsedRow.tempo !== null ? parsedRow : null;
    }).filter(row => row !== null);
}

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

