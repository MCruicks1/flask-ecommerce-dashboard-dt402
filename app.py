"""
Flask Web Application – E-Commerce Data Dashboard
-------------------------------------------------
Author: Martin Cruickshank
Date: October 2025
Module: DT402 – Developing Data Projects (Corndel Apprenticeship)

Description:
This Flask application serves a data dashboard that visualises insights from
an e-commerce dataset using Chart.js. It includes API routes for:
    • Orders over time
    • Low stock levels
    • Most popular products
    • External temperature data (Open-Meteo API)
"""

from flask import Flask, abort, jsonify, render_template, Response # Flask web framework
import sqlite3 # For database interactions
import pathlib # For handling file paths
import logging # For logging errors and exceptions
import requests # For making API calls

#-----------------------------------------
# Set up logging to record exceptions and errors
logging.basicConfig(filename="App.log", level=logging.DEBUG) # format="%(asctime)s [%(levelname)s] %(message)s") could be used for more detailed logs (ref: https://docs.python.org/3/howto/logging.html#logging-basic-tutorial)
working_directory = pathlib.Path(__file__).parent.absolute() # Directory of the current script
DATABASE = working_directory / "CCL_ecommerce.db" # Path to the SQLite database

def query_db(query: str, args=()) -> list:
    try:                                    # Execute a database query and return the results
        with sqlite3.connect(DATABASE) as conn:
            cursor = conn.cursor()
            cursor.execute(query, args)
            results = cursor.fetchall()
        return results
    except sqlite3.Error as e:                  # Handle database errors
        logging.error(f"Database error: %s", e) # Log the error
        abort(500, description="Database error") # Return a 500 error

#-----------------------------------------
# Initialise Flask application
app = Flask(__name__)

#-----------------------------------------
# Error handlers
@app.errorhandler(404)
def not_found(error) -> Response:
    return jsonify({"error": "Not found"}), 404 # Return a JSON response for 404 errors

@app.errorhandler(500)
def internal_error(error) -> Response:
    return jsonify({"error": "Internal server error"}), 500 # Return a JSON response for 500 errors

#-----------------------------------------
# Route definitions
@app.route('/')
def index() -> str:
    return render_template('dashboard.html') # Render the main dashboard HTML page

#-----------------------------------------
# API endpoint to get temperature over time from external API
@app.route("/api/temperature_over_time", methods=["GET"]) # Fetch temperature data from external API
def temperature_over_time():
    # SQL Query to get the date range from orders_over_time
    query = """
SELECT MIN(order_date), MAX(order_date)
FROM orders;
"""
    try:
        result = query_db(query)
        start_date, end_date = result[0]

        # Making an API call to fetch temperature data
        API_ENDPOINT = "https://archive-api.open-meteo.com/v1/archive" # Open-Meteo Archive, API endpoint
        params = {
            "latitude": 50.6053,  # London UK
            "longitude": -3.5952,
            "start_date": start_date,
            "end_date": end_date,
            "daily": "temperature_2m_max",
            "timezone": "GMT",
        }
        response = requests.get(API_ENDPOINT, params=params)
        response.raise_for_status()

        return jsonify(response.json())
    except Exception as e:
        logging.error("Error in /api/temperature_over_time: %s", e)
        abort(500, description="Error fetching temperature data.")

#-----------------------------------------
# API endpoint to get orders over time
@app.route("/api/orders_over_time")
def orders_over_time() -> Response:

    query = """
    SELECT order_date, COUNT(order_id) AS num_orders
    FROM orders
    GROUP BY order_date
    ORDER BY order_date;
    """
    try: 
        result = query_db(query)
        dates = [row[0] for row in result]
        counts = [row[1] for row in result]
        return jsonify({"dates": dates, "counts": counts})
    except Exception as e:
        logging.error(f"Error fetching orders over time: %s", e)
        abort(500, description="Error fetching orders over time")   

#-----------------------------------------
# API endpoint to get low stock levels
@app.route("/api/low_stock_levels")
def low_stock_levels() -> Response:
    query = """
    SELECT p.product_name, s.quantity
    FROM stock_level s
    JOIN products p ON s.product_id = p.product_id
    ORDER BY s.quantity ASC;
    """
    try:
        result = query_db(query)
        products   = [row[0] for row in result]
        quantities = [row[1] for row in result]
        return jsonify({"products": products, "quantities": quantities})
    except Exception as e:
        logging.error(f"Error fetching low stock levels: %s", e)
        abort(500, description="Error fetching low stock levels")

#-----------------------------------------
# API endpoint to get most popular products
@app.route("/api/most_popular_products")
def most_popular_products() -> Response:
    query = """
    SELECT p.product_id, p.product_name, SUM(od.quantity_ordered) AS total_quantity
    FROM order_details od
    JOIN products p ON od.product_id = p.product_id
    GROUP BY p.product_id, p.product_name
    ORDER BY total_quantity DESC
    LIMIT 10;
    """
    try:
        result = query_db(query)
        product_ids = [row[0] for row in result]
        product_names = [row[1] for row in result]
        totals = [row[2] for row in result]
        return jsonify({
            "product_ids": product_ids,
            "product_names": product_names,
            "totals": totals
        })
    except Exception as e:
        logging.error(f"Error fetching most popular products: %s", e)
        abort(500, description="Error fetching most popular products")  

#-----------------------------------------
# API endpoint to get payment method popularity *ADDED MC 23/10/2025*
@app.route("/api/payment_method_popularity")
def payment_method_popularity() -> Response:
    query = """
    SELECT pm.method_name, COUNT(p.payment_id) AS transaction_count
    FROM payments p
    JOIN payment_methods pm ON p.method_id = pm.method_id
    GROUP BY pm.method_name
    ORDER BY transaction_count DESC;
    """
    try:
        result = query_db(query)
        methods = [row[0] for row in result]
        counts = [row[1] for row in result]
        return jsonify({"methods": methods, "counts": counts})
    except Exception as e:
        logging.error(f"Error fetching payment method popularity: %s", e)
        abort(500, description="Error fetching payment method popularity")

#-----------------------------------------
# Run the Flask application
if __name__ == "__main__":
    app.run(debug=True)

#-----------------------------------------
# End of app.py
#-----------------------------------------