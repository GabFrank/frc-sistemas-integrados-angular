#!/usr/bin/env python3
import csv
import datetime
from collections import defaultdict

def adjust_date(date_str, time_str):
    """
    Adjusts the date based on the time.
    If time is before 5:00 AM, the adjusted date is the previous day.
    """
    # Parse the datetime
    dt = datetime.datetime.strptime(f"{date_str} {time_str}", "%d/%m/%Y %H:%M")
    
    # If time is before 5:00 AM, assign to previous day
    if dt.hour < 5:
        dt = dt - datetime.timedelta(days=1)
    
    # Return the adjusted date (just the date part)
    return dt.date()

def process_csv(input_file, encoding='latin-1'):
    """Process the CSV file with the given encoding"""
    daily_totals = defaultdict(int)
    row_count = 0
    processed_count = 0
    
    try:
        # Try to read the file with the specified encoding
        with open(input_file, 'r', encoding=encoding) as f:
            reader = csv.reader(f, delimiter=';')
            
            # Skip header
            header = next(reader)
            print(f"Started processing with encoding: {encoding}")
            
            # Process each row
            for row in reader:
                row_count += 1
                if row_count % 50 == 0:
                    print(f"Processed {row_count} rows so far...")
                
                if not row or len(row) < 12:  # Ensure we have enough columns
                    continue
                    
                # Extract date, time and amount
                fecha_venta = row[0]
                if not fecha_venta:
                    continue
                    
                # Split date and time
                date_parts = fecha_venta.split()
                if len(date_parts) != 2:
                    continue
                    
                date_str, time_str = date_parts
                
                # Get amount (Importe)
                try:
                    importe = int(row[11])
                except (ValueError, IndexError):
                    continue
                
                # Adjust date based on the time
                adjusted_date = adjust_date(date_str, time_str)
                
                # Add to daily totals
                daily_totals[adjusted_date] += importe
                processed_count += 1
                
        print(f"Completed processing {row_count} rows, with {processed_count} valid transactions.")
        return daily_totals
    except Exception as e:
        print(f"Error processing CSV with encoding {encoding}: {e}")
        return None

def main():
    input_file = "utilitarios/resumen-tarjetas.csv"
    output_file = "utilitarios/daily_sales_summary.txt"
    
    print(f"Starting to process sales data from {input_file}...")
    
    # Try different encodings
    encodings = ['latin-1', 'utf-8', 'cp1252', 'iso-8859-1']
    
    daily_totals = None
    for encoding in encodings:
        daily_totals = process_csv(input_file, encoding)
        if daily_totals:
            print(f"Successfully processed CSV with encoding: {encoding}")
            break
    
    if not daily_totals:
        print("Failed to process CSV file with any of the attempted encodings.")
        return
    
    # Sort dates
    sorted_dates = sorted(daily_totals.keys())
    
    # Write output to TXT file
    with open(output_file, 'w', encoding='utf-8') as f:
        f.write("DAILY SALES SUMMARY (5 AM to 4:59 AM)\n")
        f.write("=====================================\n\n")
        
        for date in sorted_dates:
            f.write(f"{date.strftime('%d/%m/%Y')}: {daily_totals[date]:,} PYG\n")
        
        # Add total
        total = sum(daily_totals.values())
        f.write("\n=====================================\n")
        f.write(f"TOTAL: {total:,} PYG\n")
    
    print(f"Daily sales summary has been written to {output_file}")

if __name__ == "__main__":
    main() 