/*
dashboard-script.js
-------------------
Author: Martin Cruickshank
Date: October 2025
Module: DT402 – Developing Data Projects (Corndel Apprenticeship)

Description:
This script handles data retrieval and visualisation for the Flask-based E-Commerce Data Dashboard.
It uses the reusable function fetchDataAndRenderChart() to dynamically load datasets from 
multiple API endpoints and render visualisations using Chart.js. 
This approach reduces code repetition and enhances maintainability (DRY).
*/


//---------------------------------------------------------
// Chart Rendering Logic - Reusable chart fetch/render helper
async function fetchDataAndRenderChart(apiEndpoint, chartElementId, chartConfig) { //...
  // ...chartConfig: callback function that receives data and returns the Chart.js configuration
  // ...chartElementId: the id of the canvas element
  try {
    let response = await fetch(apiEndpoint); // Fetch data from the given API endpoint
    let data = await response.json(); // Parse JSON response
    const ctx = document.getElementById(chartElementId).getContext("2d"); // Get canvas context
    new Chart(ctx, chartConfig(data)); // Create new Chart with the provided config
  } catch (error) { // Error handling
    console.error(`Error fetching or rendering chart (${chartElementId}):`, error); // Log error to console
  }
}

//---------------------------------------------------------
// Chart definitions (using reusable function)
// Orders Over Time (Line Chart)
fetchDataAndRenderChart("/api/orders_over_time", "ordersChart", (data) => ({ // chartConfig function
  type: "line", // Specify the type of chart: Line chart
  data: {
    labels: data.dates, // X-axis labels (dates)
    datasets: [
      {
        label: "Orders", // Dataset label
        data: data.counts, // Y-axis data (order counts)
        borderColor: "rgba(55, 160, 235, 1)", // Line color
        fill: true, // Enable fill under the line
        backgroundColor: "rgba(55, 160, 235, 0.2)", // Fill color under the line
        tension: 0.2, // Adjust the smoothing of the line - Higher values = more curve
      },
    ],
  },
  options: {
    responsive: true, // Makes the chart automatically resize to fit different screen widths (improves accessibility on mobile devices)
    scales: {
      x: { // X-axis configuration
        type: "time", // Specify that the x-axis is a time scale
        time: {
          parser: "yyyy-MM-dd", // Date format parser
          unit: "day", // Unit of time for ticks
          tooltipFormat: "PP",
        },
        ticks: { autoSkip: true, maxTicksLimit: 15 }, // This sets how many chart marks/labels appear on the x-axis to prevent overcrowding.
      },
      y: { // Y-axis configuration
        beginAtZero: true, // Choose to start y-axis at zero
        title: { display: true, text: "Number of Orders" }, // Y-axis title
      },
    },
    plugins: { legend: { display: true, position: "top" } }, // Legend configuration (visible and displayed at the top)
  },
}));

//---------------------------------------------------------
// Low Stock Levels
fetchDataAndRenderChart("/api/low_stock_levels", "stockChart", (data) => {
  // Limit to 15 products for chart readability and performance
  const limit = 15
  const labels = data.products.slice(0, limit);
  const values = data.quantities.slice(0, limit);

  return {
    type: "bar", // Specify the type of chart: Bar chart
    data: {
      labels,
      datasets: [
        {
          label: "Stock Quantity",
          data: values,
          backgroundColor: "rgba(255, 100, 130, 0.2)",
          borderColor: "rgba(255, 100, 130, 1)",
          borderWidth: 1,
        },
      ],
    },
    options: {
      responsive: true,
      scales: {
        y: { beginAtZero: true, title: { display: true, text: "Quantity" } },
        x: {
          ticks: {
            autoSkip: true, // although, not necessary when limiting to 15 products
            maxRotation: 45, // the max and min rotation angle for x-axis labels to improve readability
            minRotation: 30, // this helps prevent label overlap
            font: { size: 10 },
          },
        },
      },
      plugins: { legend: { display: true, position: "top" } },
    },
  };
});

//---------------------------------------------------------
// Most Popular Products
// Horizontal layout to represent popularity more effectively
fetchDataAndRenderChart("/api/most_popular_products", "popularProductsChart", (data) => ({
  type: "bar", // Specify the type of chart: Bar chart
  data: {
    labels: data.product_names,
    datasets: [
      {
        label: "Units Sold",
        data: data.totals,
        backgroundColor: "rgba(75, 190, 190, 0.2)",
        borderColor: "rgba(75, 190, 190, 1)",
        borderWidth: 1,
      },
    ],
  },
  options: {
    indexAxis: "y", // Flips the bar chart horizontally to better represent popularity
    responsive: true,
    scales: {
      x: { beginAtZero: true, title: { display: true, text: "Units Sold" } },
    },
    plugins: { legend: { display: false, position: "top" } }, // Legend is not necessary for single dataset so display is set to false
  },
}));

//---------------------------------------------------------
// Payment Method Popularity (Pie Chart) *ADDED MC 23/10/2025*
fetchDataAndRenderChart("/api/payment_method_popularity", "paymentMethodsChart", (data) => ({
  type: "pie",
  data: {
    labels: data.methods,
    datasets: [
      {
        label: "Transactions",
        data: data.counts,
        backgroundColor: [
          "rgba(255, 99, 132, 0.6)",
          "rgba(54, 162, 235, 0.6)",
          "rgba(255, 206, 86, 0.6)",
          "rgba(75, 192, 192, 0.6)",
          "rgba(153, 102, 255, 0.6)",
          "rgba(255, 159, 64, 0.6)"
        ],
        borderColor: "rgba(255, 255, 255, 1)",
        borderWidth: 2
      }
    ]
  },
  options: {
    responsive: true,
    plugins: {
      legend: { position: "top" },
      title: { display: false }
    }
  }
}));


//---------------------------------------------------------
// Temperature Over Time (External API via Flask)
fetchDataAndRenderChart("/api/temperature_over_time", "temperatureChart", (data) => ({
  type: "line", // Specify the type of chart: Line chart
  data: {
    labels: data.daily.time,
    datasets: [
      {
        label: "Temperature (°C)",
        data: data.daily.temperature_2m_max.map(Number),
        borderColor: "rgba(255, 100, 130, 1)",
        backgroundColor: "rgba(255, 100, 130, 0.2)",
        fill: false, // No fill under the line for temperature chart
        tension: 0.7,
      },
    ],
  },
  options: {
    responsive: true,
    scales: {
      x: {
        type: "time",
        time: {
          parser: "yyyy-MM-dd",
          unit: "day",
          tooltipFormat: "PP",
        },
        ticks: { autoSkip: true, maxTicksLimit: 15 },
      },
      y: {
        beginAtZero: false,
        title: { display: true, text: "Temperature (°C)" },
      },
    },
    plugins: { legend: { display: false, position: "top" } },
  },
}));

//---------------------------------------------------------
// End of dashboard-script.js
//---------------------------------------------------------
