document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const tableHeader = document.getElementById('tableHeader');
    const tableBody = document.getElementById('tableBody');
    const regionFilter = document.getElementById('regionFilter');
    const municipalityFilter = document.getElementById('municipalityFilter');
    const yearFilter = document.getElementById('yearFilter');
    const resetFiltersBtn = document.getElementById('resetFilters');

    // Store the complete dataset
    let completeData = [];
    let filteredData = [];

    // Fetch and process the data
    async function fetchData() {
        try {
            const response = await fetch('/api/municipality-demographics');
            if (!response.ok) {
                throw new Error('Failed to fetch data');
            }
            completeData = await response.json();
            filteredData = [...completeData];
            
            // Initialize the table and filters
            initializeFilters();
            updateTable();
        } catch (error) {
            console.error('Error fetching data:', error);
            tableBody.innerHTML = `<tr><td colspan="10" class="text-center text-danger">Error loading data. Please try again later.</td></tr>`;
        }
    }
//
    // Initialize filter dropdowns
    function initializeFilters() {
        // Get unique values for filters
        const regions = [...new Set(completeData.map(item => item.region))].sort();
        const municipalities = [...new Set(completeData.map(item => item.municipality))].sort();
        const years = [...new Set(completeData.map(item => new Date(item.date).getFullYear()))].sort();

        // Populate region filter
        regions.forEach(region => {
            if (region) {
                const option = document.createElement('option');
                option.value = region;
                option.textContent = region;
                regionFilter.appendChild(option);
            }
        });

        // Populate year filter
        years.forEach(year => {
            const option = document.createElement('option');
            option.value = year;
            option.textContent = year;
            yearFilter.appendChild(option);
        });

        // Add event listeners for filters
        regionFilter.addEventListener('change', updateFilters);
        municipalityFilter.addEventListener('change', updateFilters);
        yearFilter.addEventListener('change', updateFilters);
        resetFiltersBtn.addEventListener('click', resetFilters);

        // Initialize municipality filter based on selected region
        updateMunicipalityFilter();
    }

    // Update municipality filter based on selected region
    function updateMunicipalityFilter() {
        const selectedRegion = regionFilter.value;
        municipalityFilter.innerHTML = '<option value="">All Municipalities</option>';
        
        if (!selectedRegion) {
            // If no region is selected, show all municipalities
            const municipalities = [...new Set(completeData.map(item => item.municipality))].sort();
            municipalities.forEach(municipality => {
                if (municipality) {
                    const option = document.createElement('option');
                    option.value = municipality;
                    option.textContent = municipality;
                    municipalityFilter.appendChild(option);
                }
            });
        } else {
            // Show only municipalities in the selected region
            const filteredMunicipalities = [...new Set(
                completeData
                    .filter(item => item.region === selectedRegion)
                    .map(item => item.municipality)
            )].sort();
            
            filteredMunicipalities.forEach(municipality => {
                if (municipality) {
                    const option = document.createElement('option');
                    option.value = municipality;
                    option.textContent = municipality;
                    municipalityFilter.appendChild(option);
                }
            });
        }
    }

    // Apply filters to the data
    function updateFilters() {
        const selectedRegion = regionFilter.value;
        const selectedMunicipality = municipalityFilter.value;
        const selectedYear = yearFilter.value;

        filteredData = completeData.filter(item => {
            const matchesRegion = !selectedRegion || item.region === selectedRegion;
            const matchesMunicipality = !selectedMunicipality || item.municipality === selectedMunicipality;
            const matchesYear = !selectedYear || new Date(item.date).getFullYear().toString() === selectedYear;
            
            return matchesRegion && matchesMunicipality && matchesYear;
        });

        updateTable();
    }

    // Reset all filters
    function resetFilters() {
        regionFilter.value = '';
        municipalityFilter.value = '';
        yearFilter.value = '';
        
        // Reset the municipality filter options
        updateMunicipalityFilter();
        
        // Reset the data
        filteredData = [...completeData];
        updateTable();
    }

    // Update the table with filtered data
    function updateTable() {
        // Clear the table
        tableBody.innerHTML = '';
        
        // If no data after filtering
        if (filteredData.length === 0) {
            const row = document.createElement('tr');
            const cell = document.createElement('td');
            cell.colSpan = 15; // Match the number of columns
            cell.className = 'text-center';
            cell.textContent = 'No data available for the selected filters';
            row.appendChild(cell);
            tableBody.appendChild(row);
            return;
        }

        // Create table headers if not already created
        if (tableHeader.children.length === 0) {
            const headers = Object.keys(filteredData[0]);
            headers.forEach(header => {
                if (header !== 'date') { // Skip the date field
                    const th = document.createElement('th');
                    th.textContent = header.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                    tableHeader.appendChild(th);
                }
            });
        }

        // Populate table rows
        filteredData.forEach(item => {
            const row = document.createElement('tr');
            
            // Format date to YYYY-MM-DD
            const formattedDate = new Date(item.date).toISOString().split('T')[0];
            
            // Add all fields except the original date
            const { date, ...rest } = item;
            
            // Add the formatted date as the first cell
            const dateCell = document.createElement('td');
            dateCell.textContent = formattedDate;
            row.appendChild(dateCell);
            
            // Add the rest of the data
            Object.values(rest).forEach(value => {
                const cell = document.createElement('td');
                // Format numbers with thousand separators
                if (typeof value === 'number') {
                    if (Number.isInteger(value)) {
                        cell.textContent = value.toLocaleString();
                    } else {
                        cell.textContent = value.toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2
                        });
                    }
                } else {
                    cell.textContent = value || '-';
                }
                row.appendChild(cell);
            });
            
            tableBody.appendChild(row);
        });
    }

    // Initialize the page
    fetchData();
});
