// Configuration
const CONFIG = {
    width: 800,
    height: 800,
    margin: { top: 20, right: 20, bottom: 20, left: 20 },
    colorScheme: d3.interpolateBlues,
    colorSteps: 7
};

// Global variables
let mapData;
let demographicData = {};
let currentDate = '2025-01-01';
let currentVariable = 'population_total';

// Variable configurations
const VARIABLES = {
    population_total: { label: 'Total Population', format: d3.format(','), colorScheme: d3.interpolateBlues },
    population_male: { label: 'Male Population', format: d3.format(','), colorScheme: d3.interpolateBlues },
    population_female: { label: 'Female Population', format: d3.format(','), colorScheme: d3.interpolateBlues },
    births: { label: 'Births', format: d3.format(','), colorScheme: d3.interpolateGreens },
    deaths: { label: 'Deaths', format: d3.format(','), colorScheme: d3.interpolateReds },
    net_migration: { label: 'Net Migration', format: d3.format(','), colorScheme: d3.interpolateRdBu },
    median_age: { label: 'Median Age', format: d => d.toFixed(1), colorScheme: d3.interpolateViridis },
    avg_household_size: { label: 'Avg. Household Size', format: d => d.toFixed(2), colorScheme: d3.interpolateYlOrRd },
    households_total: { label: 'Total Households', format: d3.format(','), colorScheme: d3.interpolatePurples },
    median_income_dkk: { label: 'Median Income (DKK)', format: d => d3.format(',')(Math.round(d)), colorScheme: d3.interpolateGreens },
    employment_rate: { label: 'Employment Rate', format: d => (d * 100).toFixed(1) + '%', colorScheme: d3.interpolateGreens },
    unemployment_rate: { label: 'Unemployment Rate', format: d => (d * 100).toFixed(1) + '%', colorScheme: d3.interpolateReds }
};

// Main function to initialize the map
async function initMap() {
    try {
        // Load the map data and demographic data in parallel
        const [municipalities, demographics] = await Promise.all([
            d3.json('https://raw.githubusercontent.com/codeforgermany/click_that_hood/main/public/data/denmark-municipalities.geojson'),
            fetchDemographicData()
        ]);
        
        mapData = municipalities;
        processDemographicData(demographics);
        
        // Create the map
        createMap();
        
        // Update the map with the data
        updateMap();
        
    } catch (error) {
        console.error('Error initializing map:', error);
        d3.select('#population-map')
            .append('div')
            .attr('class', 'error-message')
            .text('Error loading map data. Please try again later.');
    }
}
//
// Fetch demographic data from the local CSV file
async function fetchDemographicData() {
    try {
        const demographicData = await d3.dsv(';', 'data/dk_region_municipality_demo_mock.csv');
        
        console.log('Raw CSV data:', demographicData);
        
        // Convert the CSV data to the expected format
        const processedData = demographicData.map(row => {
            // Convert string values to appropriate types
            const numericFields = [
                'population_total', 'population_male', 'population_female',
                'births', 'deaths', 'net_migration', 'median_age',
                'avg_household_size', 'households_total', 'median_income_dkk',
                'employment_rate', 'unemployment_rate'
            ];
            
            const processedRow = {};
            for (const [key, value] of Object.entries(row)) {
                if (numericFields.includes(key)) {
                    // Replace comma with dot for proper number parsing
                    const numValue = typeof value === 'string' ? value.replace(',', '.') : value;
                    processedRow[key] = numValue ? parseFloat(numValue) : 0;
                } else {
                    processedRow[key] = value;
                }
            }
            
            return processedRow;
        });
        
        return processedData;
    } catch (error) {
        console.error('Error loading demographic data:', error);
        throw error;
    }
}

// Process demographic data into a more usable format
function processDemographicData(rows) {
    demographicData = {};
    
    // Process all rows to store data by date
    rows.forEach(row => {
        const key = row.municipality;
        const date = row.date;
        
        if (!demographicData[key]) {
            demographicData[key] = {
                municipality: row.municipality,
                region: row.region,
                dataByDate: {}
            };
        }
        
        // Store all data for this municipality by date
        if (!demographicData[key].dataByDate[date]) {
            demographicData[key].dataByDate[date] = {};
        }
        
        // Copy all properties from the row to the date-specific data
        Object.assign(demographicData[key].dataByDate[date], row);
    });
    
    // Update to show data for the current date
    updateCurrentData();
    
    // Initialize the variable selector
    initializeVariableSelector();
    
    console.log('Processed demographic data:', demographicData);
}

// Update current data based on the selected date and variable
function updateCurrentData() {
    const targetDate = new Date(currentDate).toISOString().split('T')[0];
    
    Object.values(demographicData).forEach(area => {
        const dateData = area.dataByDate[targetDate] || {};
        
        // Copy all properties from the date data to the area
        Object.assign(area, dateData);
        
        // Ensure the current variable exists
        if (area[currentVariable] === undefined) {
            area[currentVariable] = 0;
        }
    });
}

// Initialize the variable selector
function initializeVariableSelector() {
    const selector = document.getElementById('variable-selector');
    if (!selector) return;
    
    // Set up event listener for variable changes
    selector.addEventListener('change', function() {
        currentVariable = this.value;
        updateCurrentData();
        updateMap();
    });
    
    // Set the default value
    if (VARIABLES[currentVariable]) {
        selector.value = currentVariable;
    }
}

// Create the map visualization
function createMap() {
    // Calculate the width and height for the map
    const width = CONFIG.width - CONFIG.margin.left - CONFIG.margin.right;
    const height = CONFIG.height - CONFIG.margin.top - CONFIG.margin.bottom;
    
    // Create SVG container
    const svg = d3.select('#population-map')
        .append('svg')
        .attr('width', '100%')
        .attr('height', '100%')
        .attr('viewBox', `0 0 ${CONFIG.width} ${CONFIG.height}`)
        .attr('preserveAspectRatio', 'xMidYMid meet');
    
    // Add a group for the map features
    const g = svg.append('g')
        .attr('transform', `translate(${CONFIG.margin.left},${CONFIG.margin.top})`);
    
    // Create a projection that fits Denmark
    const projection = d3.geoMercator()
        .center([10, 56])
        .scale(3000)
        .translate([width / 2, height / 2]);
    
    // Create a path generator
    const path = d3.geoPath().projection(projection);
    
    // Add the map features
    g.selectAll('path')
        .data(mapData.features)
        .enter()
        .append('path')
        .attr('class', 'municipality')
        .attr('d', path)
        .attr('data-name', d => d.properties.name || '')
    
    // Store the path generator and projection for later use
    g.path = path;
    g.projection = projection;
    

    
    // Add zoom behavior
    const zoom = d3.zoom()
        .scaleExtent([0.7, 8])  // Allow zooming out to 0.7x (70%)
        .on('zoom', (event) => {
            g.attr('transform', event.transform);
            g.selectAll('path')
                .style('stroke-width', 1 / event.transform.k);
        });
    
    // Set initial zoom and center
    const initialScale = 2;
    const mapWidth = CONFIG.width;
    const mapHeight = CONFIG.height;
    const center = [mapWidth / 2, mapHeight / 2];
    
    // Center the map
    svg.call(zoom.transform, d3.zoomIdentity
        .translate(center[0] - (center[0] * initialScale), center[1] - (center[1] * initialScale))
        .scale(initialScale)
    );
    
    // Apply the zoom behavior
    svg.call(zoom);
    
    // Add a tooltip
    const tooltip = d3.select('body').append('div')
        .attr('class', 'tooltip')
        .style('opacity', 0)
        .style('position', 'absolute')
        .style('background', 'white')
        .style('padding', '8px')
        .style('border', '1px solid #ccc')
        .style('border-radius', '4px')
        .style('pointer-events', 'none')
        .style('font-size', '14px');
    
    // Store references for later use
    window.mapElements = {
        svg,
        g,
        path,
        projection,
        tooltip
    };
}

// Update the map with the current data
function updateMap() {
    const { g, path, tooltip } = window.mapElements;
    const variableInfo = VARIABLES[currentVariable] || VARIABLES.population_total;
    
    // Get all values for the current variable
    const values = Object.values(demographicData)
        .map(d => d[currentVariable])
        .filter(d => d !== undefined && d !== null && !isNaN(d));
    
    if (values.length === 0) {
        console.error(`No data available for ${variableInfo.label} on the selected date`);
        return;
    }
    
    // Create a color scale based on the current variable
    const colorScale = d3.scaleSequential()
        .domain([d3.min(values), d3.max(values)])
        .interpolator(variableInfo.colorScheme);
    
    // Update the legend
    updateLegend(colorScale, d3.max(values), variableInfo);
    
    // Update the map features with the data
    g.selectAll('.municipality')
        .each(function(d) {
            const name = d.properties.name || '';
            const data = demographicData[name];
            const value = data ? (data[currentVariable] || 0) : 0;
            
            d3.select(this)
                .attr('fill', value > 0 ? colorScale(value) : '#f0f0f0')
                .attr(`data-${currentVariable}`, value);
        });
    
    // Add tooltip events
    g.selectAll('.municipality')
        .on('mousemove', function(event, d) {
            const name = d.properties.name || 'Unknown';
            const data = demographicData[name] || {};
            const value = data[currentVariable] || 0;
            const formattedValue = variableInfo.format ? variableInfo.format(value) : value;
            
            tooltip
                .style('left', (event.pageX + 10) + 'px')
                .style('top', (event.pageY - 10) + 'px')
                .style('opacity', 1)
                .html(`
                    <div><strong>${name}</strong></div>
                    <div>Region: ${data.region || 'N/A'}</div>
                    <div>${variableInfo.label}: ${formattedValue}</div>
                `);
        })
        .on('mouseout', function() {
            tooltip.style('opacity', 0);
        });
}

// Update the legend
function updateLegend(colorScale, maxValue, variableInfo = VARIABLES.population_total) {
    const legendContainer = d3.select('#legend-scale');
    
    // Clear existing content
    legendContainer.html('');
    
    // Create a container for the legend content
    const legendContent = legendContainer.append('div')
        .style('width', '100%')
        .style('max-width', '800px')
        .style('margin', '0 auto');
    
    // Add title
    legendContent.append('div')
        .style('font-weight', '600')
        .style('font-size', '14px')
        .style('margin-bottom', '8px')
        .style('color', '#333')
        .style('text-align', 'center')
        .text(variableInfo.label);
    
    // Create a container for the gradient and labels
    const gradientContainer = legendContent.append('div')
        .style('width', '100%')
        .style('position', 'relative');
    
    // Create SVG for the gradient
    const legendSvg = gradientContainer.append('svg')
        .style('width', '100%')
        .style('height', '20px')
        .style('border-radius', '3px')
        .style('overflow', 'hidden');
    
    // Create gradient definition
    const defs = legendSvg.append('defs');
    const gradient = defs.append('linearGradient')
        .attr('id', 'legend-gradient')
        .attr('x1', '0%')
        .attr('y1', '0%')
        .attr('x2', '100%')
        .attr('y2', '0%');
    
    // Add color stops
    const numStops = 10;
    for (let i = 0; i <= numStops; i++) {
        const value = (i / numStops) * maxValue;
        gradient.append('stop')
            .attr('offset', `${(i / numStops) * 100}%`)
            .attr('stop-color', colorScale(value))
            .attr('stop-opacity', 1);
    }
    
    // Create the gradient rectangle with a subtle border
    legendSvg.append('rect')
        .attr('width', '100%')
        .attr('height', '100%')
        .style('fill', 'url(#legend-gradient)')
        .style('stroke', '#ddd')
        .style('stroke-width', '0.5px');
    
    // Create a container for the labels
    const labelsContainer = gradientContainer.append('div')
        .style('display', 'flex')
        .style('justify-content', 'space-between')
        .style('margin-top', '5px')
        .style('font-size', '12px')
        .style('color', '#555');
    
    // Update the legend labels with proper formatting
    const minValue = 0; // Assuming minimum is always 0 for these metrics
    const format = variableInfo.format || (d => d);
    
    labelsContainer.append('div')
        .attr('class', 'legend-label')
        .style('font-weight', '500')
        .text(format(minValue));
        
    labelsContainer.append('div')
        .attr('class', 'legend-label')
        .style('font-weight', '500')
        .text(format(maxValue));
}




// Initialize the map when the page loads
document.addEventListener('DOMContentLoaded', initMap);
