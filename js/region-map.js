/**
 * Renders a map of Danish regions using D3.js
 */

// Global variables
let mapDataRegions;
let demographicData = {};
let currentVariable = 'population_total';

// Map configuration
const CONFIG = {
    width: 1000,
    height: 700,
    margin: { top: 20, right: 20, bottom: 60, left: 20 },
    colorScheme: d3.interpolateBlues
};

// Variable configurations
const VARIABLES = {
    population_total: { label: 'Total Population', format: d3.format(','), colorScheme: d3.interpolateBlues },
    population_density: { label: 'Population Density', format: d => d.toFixed(1), colorScheme: d3.interpolateYlOrRd },
    area: { label: 'Area (km²)', format: d3.format(','), colorScheme: d3.interpolateGreens },
    median_age: { label: 'Median Age', format: d => d.toFixed(1), colorScheme: d3.interpolateViridis },
    employment_rate: { label: 'Employment Rate', format: d => (d * 100).toFixed(1) + '%', colorScheme: d3.interpolateGreens },
    unemployment_rate: { label: 'Unemployment Rate', format: d => (d * 100).toFixed(1) + '%', colorScheme: d3.interpolateReds }
};

// Main function to initialize the map
async function initMap() {
    try {
        // Load the map data
        const regions = await d3.json('data/regionsinddeling_formatted_noz.geojson');
        mapDataRegions = regions;
        
        // Create the map
        createMap();
        
        // Update the map with the data
        updateMap();
        
    } catch (error) {
        console.error('Error initializing map:', error);
        d3.select('#region-map')
            .append('div')
            .attr('class', 'error-message')
            .text('Error loading map data. Please try again later.');
    }
}

// Create the map visualization
function createMap() {
    // Clear any existing map
    d3.select('#region-map').html('');
    
    // Calculate the width and height for the map
    const width = CONFIG.width - CONFIG.margin.left - CONFIG.margin.right;
    const height = CONFIG.height - CONFIG.margin.top - CONFIG.margin.bottom;
    
    // Create SVG container
    const svg = d3.select('#region-map')
        .append('svg')
        .attr('width', '100%')
        .attr('height', '100%')
        .attr('viewBox', `0 0 ${CONFIG.width} ${CONFIG.height}`)
        .attr('preserveAspectRatio', 'xMidYMid meet');
    
    // Add a group for the map features
    const g = svg.append('g')
        .attr('class', 'map-group')
        .attr('transform', `translate(${CONFIG.margin.left},${CONFIG.margin.top})`);
    
    // Create a projection centered on Denmark
    const projection = d3.geoMercator()
        .center([10, 56])  // Approximate center of Denmark
        .scale(0.8)  // Initial scale, will be adjusted
        .translate([width / 2, height / 2]);
    
    // Create a path generator
    const path = d3.geoPath().projection(projection);
    
    // Calculate the bounding box of the features in the current projection
    const [[x0, y0], [x1, y1]] = d3.geoBounds(mapDataRegions);
    const bounds = { x0, y0, x1, y1 };
    
    // Calculate the scale to fit the map in the viewport
    const scale = 0.9 / Math.max(
        (bounds.x1 - bounds.x0) / width,
        (bounds.y1 - bounds.y0) / height
    );
    
    // Update the projection with the calculated scale
    projection.scale(scale * 5000);
    
    // Log the features to check if Nordjylland is in the data
    console.log('Map features:', mapDataRegions.features.map(f => ({
        name: f.properties.name || 'Unnamed',
        type: f.geometry.type
    })));

    // Add the map features
    const regions = g.selectAll('.region')
        .data(mapDataRegions.features)
        .enter()
        .append('path')
        .attr('class', 'region')
        .attr('d', path)
        .attr('fill', (d, i) => {
            // Use different colors for different regions for better visibility
            const colors = ['#1f77b4', '#ff7f0e', '#2ca02c', '#d62728', '#9467bd'];
            return colors[i % colors.length];
        })
        .attr('stroke', '#000')
        .attr('stroke-width', 1)
        .attr('data-name', d => d.properties.name || 'Unnamed Region')
        .on('mouseover', function(event, d) {
            d3.select(this).attr('stroke-width', 2);
            console.log('Hovered region:', d.properties);
            // Show tooltip or highlight region
        })
        .on('mouseout', function(event, d) {
            d3.select(this).attr('stroke-width', 1);
            // Hide tooltip
        });

    // Add region labels
    g.selectAll('.region-label')
        .data(mapDataRegions.features)
        .enter()
        .append('text')
        .attr('class', 'region-label')
        .attr('x', d => {
            // Get the centroid of the feature
            const centroid = path.centroid(d);
            return centroid[0];
        })
        .attr('y', d => {
            const centroid = path.centroid(d);
            return centroid[1];
        })
        .text(d => d.properties.name || 'Unnamed')
        .attr('text-anchor', 'middle')
        .attr('fill', '#000')
        .style('font-size', '12px')
        .style('font-weight', 'bold')
        .style('pointer-events', 'none');
    
    // Add zoom behavior with pan and zoom functionality
    const zoom = d3.zoom()
        .scaleExtent([0.7, 8])  // Allow zooming out to 0.7x (70%)
        .on('zoom', (event) => {
            g.attr('transform', event.transform);
            g.selectAll('path')
                .style('stroke-width', 1 / event.transform.k);
        });
    
    // Apply the initial transform to center the map
    const center = projection([10, 56]);  // Get pixel coordinates of Denmark's center
    const initialScale = 0.8;  // Reduced from 5000 to zoom out
    
    // Apply the initial transform
    svg.call(zoom.transform, d3.zoomIdentity
        .translate(width / 2, height / 2)
        .scale(initialScale)
        .translate(-center[0], -center[1])
    );
    
    // Apply the initial zoom transform
    svg.call(zoom);
    
    // Store the path generator and projection for later use
    g.path = path;
    g.projection = projection;
    
    // Store references for later use
    window.mapElements = {
        svg,
        g,
        path,
        projection
    };
}

// Update the map with the current data
function updateMap() {
    // This function can be used to update the map when data changes
    // For now, we'll just log that the map was updated
    console.log('Map updated with variable:', currentVariable);
}

// Initialize the map when the page loads
if (document.readyState !== 'loading') {
    initMap();
} else {
    document.addEventListener('DOMContentLoaded', initMap);
}
