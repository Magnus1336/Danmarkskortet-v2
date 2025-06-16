// Menu Toggle Functionality
document.addEventListener('DOMContentLoaded', function() {
    const menuToggle = document.getElementById('menu-toggle');
    const sidebar = document.getElementById('sidebar');
    const overlay = document.createElement('div');
    overlay.className = 'overlay';
    document.body.appendChild(overlay);
    
    // Toggle sidebar
    menuToggle.addEventListener('click', function() {
        sidebar.classList.toggle('open');
        overlay.classList.toggle('open');
        document.body.classList.toggle('sidebar-open');
    });
    
    // Close sidebar when clicking overlay
    overlay.addEventListener('click', function() {
        sidebar.classList.remove('open');
        overlay.classList.remove('open');
        document.body.classList.remove('sidebar-open');
    });
    //
    // Close sidebar when clicking outside
    document.addEventListener('click', function(event) {
        if (!sidebar.contains(event.target) && event.target !== menuToggle && !menuToggle.contains(event.target)) {
            sidebar.classList.remove('open');
            overlay.classList.remove('open');
            document.body.classList.remove('sidebar-open');
        }
    });
    
    // Handle region type changes
    const regionTypeRadios = document.querySelectorAll('input[name="region-type"]');
    regionTypeRadios.forEach(radio => {
        radio.addEventListener('change', function() {
            const selectedValue = document.querySelector('input[name="region-type"]:checked').value;
            // Update the map based on the selected region type
            console.log('Region type changed to:', selectedValue);
            // You'll need to implement the actual map update logic here
        });
    });
    
    // Handle date slider changes
    const dateSlider = document.getElementById('date-slider');
    const dateLabels = document.querySelectorAll('.date-labels span');
    const dates = ['2024-01-01', '2024-07-01', '2025-01-01'];
    
    dateSlider.addEventListener('input', function() {
        const value = parseInt(this.value);
        // Update the active date label
        dateLabels.forEach((label, index) => {
            if (index === value) {
                label.style.fontWeight = 'bold';
                label.style.color = 'var(--primary-color)';
            } else {
                label.style.fontWeight = 'normal';
                label.style.color = '';
            }
        });
        
        // Update the map with the selected date
        console.log('Date changed to:', dates[value]);
        // You'll need to implement the actual map update logic here
    });
    
    // Initialize the date slider
    dateSlider.dispatchEvent(new Event('input'));
    
    // Handle data type changes
    const dataTypeRadios = document.querySelectorAll('input[name="data-type"]');
    dataTypeRadios.forEach(radio => {
        radio.addEventListener('change', function() {
            const selectedValue = document.querySelector('input[name="data-type"]:checked').value;
            // Update the map based on the selected data type
            console.log('Data type changed to:', selectedValue);
            // You'll need to implement the actual map update logic here
        });
    });
});
