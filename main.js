let interactiveChartView = null; // Global reference to the chart view

// Default initial colors for all genres
const initialEdmColor = "#4d78a7";  // Blue color for edm
const initialLatinColor = "#ff6347"; // Tomato color for latin
const initialPopColor = "#ff4500";  // Orange color for pop
const initialRnbColor = "#9ccdc9";  // Purple color for r&b
const initialRapColor = "#87be81";  // Green color for rap
const initialRockColor = "#f3da76"; // Red color for rock

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
    renderInteractiveChart(sampledData, "interactive-chart");
}


function renderInteractiveChart(sampledData, chartId) {
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
                as: "modified_x"
            },
            {
                calculate: "datum.tempo * (collapseYSignal)",
                as: "modified_y"
            }
        ],
        mark: { type: "circle", clip: "true" },
        encoding: {
            x: { "field": "modified_x", "type": "quantitative", "scale": { "domain": [0, 1] } },
            y: { field: "modified_y", "type": "quantitative", "scale": { "domain": [0,220] } },
            color: {
                field: "playlist_genre",
                type: "nominal",   
            }
        },
        params: [
            {
                name: "collapseXSignal",
                value: 1,
                bind: {input: "range", min:0, max:1, step: 0.01, name: " "}
            },
            {
                name: "collapseYSignal",
                value: 1,
                bind: {input: "range", min:0, max:1, step: 0.01, name: " "}
            },
        ]
    };

    vegaEmbed(`#${chartId}`, spec).then(result => {
        interactiveChartView = result.view;
        console.log("Interactive chart rendered and view is initialized.");
    }).catch(error => {
        console.error("Error embedding the chart:", error);
    });
}

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

