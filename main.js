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
            y: { field: "Tempo", "type": "quantitative", "scale": { "domain": [0,220] }},
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

const xCollapseSlider = document.getElementById("xCollapseSlider");
const yCollapseSlider = document.getElementById("yCollapseSlider");

// Update the collapseXSignal based on the x-axis slider value
xCollapseSlider.addEventListener("input", function(e) {
    const newValue = parseFloat(e.target.value);
    if (interactiveChartView) {
      // For example: when newValue is 1, points are in their normal positions; when 0, they collapse to x=0.
      interactiveChartView.signal("collapseXSignal", newValue).runAsync();
    }
  });

  // Update the collapseYSignal based on the x-axis slider value
yCollapseSlider.addEventListener("input", function(e) {
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

