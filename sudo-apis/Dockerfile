FROM python:3.11-slim

# Install system dependencies
RUN apt-get update && apt-get install -y \
    nginx \
    certbot \
    python3-certbot-nginx \
    sudo \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Create a non-root user with sudo privileges
RUN useradd -m -s /bin/bash apiuser && \
    echo "apiuser ALL=(ALL) NOPASSWD: ALL" >> /etc/sudoers

# Set working directory
WORKDIR /app

# Copy requirements and install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Create required directories
RUN mkdir -p /home/msuser/nginx-configs /home/msuser/nginx-templates /var/www/certbot/.well-known/acme-challenge && \
    chown -R www-data:www-data /var/www/certbot && \
    chmod -R 755 /var/www/certbot

# Expose port
EXPOSE 8082

# Switch to non-root user
USER apiuser

# Run the application
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8082"]
