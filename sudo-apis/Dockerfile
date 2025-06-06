FROM python:3.11-slim

RUN apt-get update && apt-get install -y \
    nginx \
    certbot \
    python3-certbot-nginx \
    sudo \
    curl \
    && rm -rf /var/lib/apt/lists/*

RUN useradd -m -s /bin/bash apiuser && \
    echo "apiuser ALL=(ALL) NOPASSWD: ALL" >> /etc/sudoers

WORKDIR /app

# Copy requirements and install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Create required directories
RUN mkdir -p /home/msuser/nginx-configs /home/msuser/nginx-templates /var/www/certbot/.well-known/acme-challenge && \
    chown -R www-data:www-data /var/www/certbot && \
    chmod -R 755 /var/www/certbot

EXPOSE 8082

USER apiuser

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8082"]
