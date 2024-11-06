import csv
import requests
import time
import json
import re

# Constants
API_URL = "https://siyopude.com/ruc/?ruc="
CSV_FILE_PATH = "clientes.csv"  # Replace with the path to your CSV file
OUTPUT_FILE_PATH = "update_clientes_queries.sql"
DELAY_BETWEEN_REQUESTS = 0.1  # Delay in seconds
RETRY_COUNT = 3  # Number of times to retry on failure
RETRY_DELAY = 2  # Delay between retries in seconds

# Function to fetch data from API with retries and JSON extraction
def fetch_ruc_data(document_id):
    attempts = 0
    while attempts < RETRY_COUNT:
        try:
            response = requests.get(API_URL + document_id)
            response.raise_for_status()  # Raises an HTTPError for bad responses (4xx and 5xx)
            
            # Extract JSON from response using regex
            json_text = re.search(r"\{.*\}", response.text)
            if json_text:
                json_data = json.loads(json_text.group(0))
                return json_data
            else:
                print(f"No JSON data found in the response for ID {document_id}")
                return None

        except (requests.RequestException, json.JSONDecodeError) as e:
            print(f"Attempt {attempts + 1} failed for ID {document_id}: {e}")
            attempts += 1
            time.sleep(RETRY_DELAY)
    
    print(f"Failed to fetch data for ID {document_id} after {RETRY_COUNT} attempts.")
    return None

# Function to generate SQL queries based on API response
def generate_sql(persona_id, cliente_id, nombre, documento, api_data):
    sql_statements = []

    if api_data and api_data["procesamientoCorrecto"]:
        # Successful case with valid RUC found
        nombre_api = api_data["nombre"]
        direccion_api = api_data["direccion"]
        ruc = api_data["ruc"]+"-"+api_data["dv"]
        sql_statements.append(
            f"UPDATE personas.cliente SET razon_social={nombre_api} ruc={ruc} tributa=true, verificado_set=true WHERE id={cliente_id};"
        )
    else:
        # Case where RUC is not found
        sql_statements.append(
            f"UPDATE personas.cliente SET tributa=false, verificado_set=true WHERE id={cliente_id} and verificado_set!=true;"
        )

    return sql_statements

# Main script
def main():
    with open(CSV_FILE_PATH, newline='', encoding='utf-8') as csvfile, open(OUTPUT_FILE_PATH, "w") as sqlfile:
        csvreader = csv.DictReader(csvfile)
        
        for row in csvreader:
            persona_id = row["PERSONA_ID"]
            cliente_id = row["CLIENTE_ID"]
            nombre = row["NOMBRE"]
            documento = row["DOCUMENTO"]

            # Check if documento (ID) is valid
            if not documento:
                print(f"Skipping entry with missing DOCUMENTO for PERSONA_ID: {persona_id}")
                continue

            # Fetch data from API
            api_data = fetch_ruc_data(documento)

            # Generate SQL queries based on the response
            sql_statements = generate_sql(persona_id, cliente_id, nombre, documento, api_data)
            
            # Write queries to the file
            for statement in sql_statements:
                sqlfile.write(statement + "\n")
            
            # Delay to prevent rate-limiting or being blocked
            # time.sleep(DELAY_BETWEEN_REQUESTS)

            print(f"Processed ID {documento} {nombre}")

    print(f"SQL update queries have been saved to {OUTPUT_FILE_PATH}")

if __name__ == "__main__":
    main()
