FROM python:3.11-slim

WORKDIR /app

# Copy requirements first for better layer caching
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the application
COPY . .

# Create logs directory
RUN mkdir -p logs

# Expose the port that FastAPI will run on
EXPOSE 8000

# Command to run the FastAPI application using our server script
CMD ["python", "server.py"] 