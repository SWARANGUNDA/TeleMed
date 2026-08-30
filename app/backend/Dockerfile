FROM python:3.12-slim

WORKDIR /app

# Install system dependencies for psycopg2 and compilation if needed
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    libpq-dev \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install Python dependencies
COPY web_platform/backend/requirements.txt ./requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# Copy complete project source code into /app
COPY . /app

# Set PYTHONPATH so package imports resolve cleanly
ENV PYTHONPATH=/app

WORKDIR /app/web_platform/backend

EXPOSE 8000

CMD ["uvicorn", "web_platform.backend.main:app", "--host", "0.0.0.0", "--port", "8000"]
