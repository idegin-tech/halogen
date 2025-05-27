import asyncio
import subprocess
import logging
from pathlib import Path
from typing import Dict, List, Optional
from datetime import datetime
import os
import shutil

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
import uvicorn
from config import config

logging.basicConfig(
    level=getattr(logging, config.LOG_LEVEL),
    format=config.LOG_FORMAT
)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="Halogen Sudo API",
    description="API for privileged operations: Nginx configuration and SSL certificate management",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=config.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

NGINX_SITES_AVAILABLE = config.NGINX_SITES_AVAILABLE
NGINX_SITES_ENABLED = config.NGINX_SITES_ENABLED
NGINX_CONFIG_DIR = config.NGINX_CONFIG_DIR
NGINX_TEMPLATES_DIR = config.NGINX_TEMPLATES_DIR
WEBROOT_DIR = config.WEBROOT_DIR
CERTBOT_LIVE_DIR = config.CERTBOT_LIVE_DIR

class DomainRequest(BaseModel):
    domain: str = Field(..., description="Domain name")
    project_id: str = Field(..., description="Project ID")

class NginxConfigRequest(DomainRequest):
    ssl_enabled: bool = Field(default=False, description="Enable SSL configuration")
    config_content: Optional[str] = Field(default=None, description="Custom Nginx configuration content")

class SSLCertificateRequest(DomainRequest):
    email: str = Field(..., description="Email for certificate registration")
    force_renewal: bool = Field(default=False, description="Force certificate renewal")

class DomainSetupRequest(BaseModel):
    domain: str = Field(..., description="Domain name")
    project_id: str = Field(..., description="Project ID")
    ssl_enabled: bool = Field(default=True, description="Enable SSL")
    email: str = Field(..., description="Email for SSL certificate")

class ApiResponse(BaseModel):
    success: bool
    message: str
    data: Optional[Dict] = None
    error: Optional[str] = None

async def run_command(command: List[str], check: bool = True) -> subprocess.CompletedProcess:
    try:
        logger.info(f"Executing command: {' '.join(command)}")
        result = await asyncio.create_subprocess_exec(
            *command,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE
        )
        stdout, stderr = await result.communicate()
        
        if check and result.returncode != 0:
            error_msg = stderr.decode() if stderr else "Command failed"
            logger.error(f"Command failed: {' '.join(command)}, Error: {error_msg}")
            raise subprocess.CalledProcessError(result.returncode, command, stdout, stderr)
        
        return subprocess.CompletedProcess(
            args=command,
            returncode=result.returncode,
            stdout=stdout.decode(),
            stderr=stderr.decode()
        )
    except Exception as e:
        logger.error(f"Error executing command: {e}")
        raise

def generate_nginx_config(domain: str, project_id: str, ssl_enabled: bool = False) -> str:
    if ssl_enabled:
        return f"""server {{
    listen 80;
    listen [::]:80;
    server_name {domain};
    return 301 https://$server_name$request_uri;
}}

server {{
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name {domain};

    ssl_certificate /etc/letsencrypt/live/{domain}/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/{domain}/privkey.pem;
    
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_prefer_server_ciphers off;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384;
    
    add_header Strict-Transport-Security "max-age=63072000" always;
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";

    location / {{
        proxy_pass http://localhost:8081;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }}

    location ~ /\\.(?!well-known) {{
        deny all;
    }}
}}"""
    else:
        return f"""server {{
    listen 80;
    listen [::]:80;
    server_name {domain};

    location / {{
        proxy_pass http://localhost:8081;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }}

    location ~ /\\.(?!well-known) {{
        deny all;
    }}
}}"""

@app.get("/health")
async def health_check():
    try:
        nginx_available = await check_command_available("nginx")
        certbot_available = await check_command_available("certbot")
        
        dependencies = {
            "nginx": nginx_available,
            "certbot": certbot_available,
        }
        
        config.ensure_directories()
        
        return ApiResponse(
            success=True,
            message="API is healthy",
            data={
                "status": "healthy",
                "dependencies": dependencies,
                "timestamp": datetime.now().isoformat()
            }
        )
    except Exception as e:
        logger.error(f"Health check failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

async def check_command_available(command: str) -> bool:
    try:
        await run_command([command, "--version"], check=False)
        return True
    except:
        return False

@app.post("/nginx/deploy")
async def deploy_nginx_config(request: NginxConfigRequest) -> ApiResponse:
    try:
        domain = request.domain.lower().strip()
        project_id = request.project_id
        
        if not domain or not project_id:
            raise HTTPException(status_code=400, detail="Domain and project_id are required")
        
        config.ensure_directories()
        
        config_content = request.config_content or generate_nginx_config(
            domain, project_id, request.ssl_enabled
        )
        
        local_config_path = Path(NGINX_CONFIG_DIR) / f"{domain}.conf"
        sites_available_path = Path(NGINX_SITES_AVAILABLE) / domain
        sites_enabled_path = Path(NGINX_SITES_ENABLED) / domain
        
        local_config_path.write_text(config_content)
        logger.info(f"Nginx config written to {local_config_path}")
        
        await run_command(["sudo", "cp", str(local_config_path), str(sites_available_path)])
        
        if sites_enabled_path.exists():
            await run_command(["sudo", "rm", str(sites_enabled_path)])
        await run_command(["sudo", "ln", "-s", str(sites_available_path), str(sites_enabled_path)])
        
        await run_command(["sudo", "nginx", "-t"])
        
        await run_command(["sudo", "systemctl", "reload", "nginx"])
        
        return ApiResponse(
            success=True,
            message=f"Nginx configuration deployed successfully for {domain}",
            data={
                "domain": domain,
                "project_id": project_id,
                "ssl_enabled": request.ssl_enabled,
                "config_path": str(local_config_path)
            }
        )
    
    except subprocess.CalledProcessError as e:
        error_msg = f"Command failed: {e.stderr or e.stdout or str(e)}"
        logger.error(error_msg)
        raise HTTPException(status_code=500, detail=error_msg)
    except Exception as e:
        logger.error(f"Error deploying nginx config: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/nginx/remove")
async def remove_nginx_config(request: DomainRequest) -> ApiResponse:
    try:
        domain = request.domain.lower().strip()
        
        sites_enabled_path = Path(NGINX_SITES_ENABLED) / domain
        sites_available_path = Path(NGINX_SITES_AVAILABLE) / domain
        local_config_path = Path(NGINX_CONFIG_DIR) / f"{domain}.conf"
        
        if sites_enabled_path.exists():
            await run_command(["sudo", "rm", str(sites_enabled_path)])
        
        if sites_available_path.exists():
            await run_command(["sudo", "rm", str(sites_available_path)])
        
        if local_config_path.exists():
            local_config_path.unlink()
        
        await run_command(["sudo", "nginx", "-t"])
        await run_command(["sudo", "systemctl", "reload", "nginx"])
        
        return ApiResponse(
            success=True,
            message=f"Nginx configuration removed successfully for {domain}",
            data={"domain": domain}
        )
    
    except subprocess.CalledProcessError as e:
        error_msg = f"Command failed: {e.stderr or e.stdout or str(e)}"
        logger.error(error_msg)
        raise HTTPException(status_code=500, detail=error_msg)
    except Exception as e:
        logger.error(f"Error removing nginx config: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/nginx/status/{domain}")
async def get_nginx_status(domain: str) -> ApiResponse:
    try:
        domain = domain.lower().strip()
        
        sites_available_path = Path(NGINX_SITES_AVAILABLE) / domain
        sites_enabled_path = Path(NGINX_SITES_ENABLED) / domain
        local_config_path = Path(NGINX_CONFIG_DIR) / f"{domain}.conf"
        
        status = {
            "domain": domain,
            "sites_available_exists": sites_available_path.exists(),
            "sites_enabled_exists": sites_enabled_path.exists(),
            "local_config_exists": local_config_path.exists(),
            "nginx_test_passed": False
        }
        
        try:
            await run_command(["sudo", "nginx", "-t"], check=True)
            status["nginx_test_passed"] = True
        except subprocess.CalledProcessError:
            status["nginx_test_passed"] = False
        
        return ApiResponse(
            success=True,
            message=f"Nginx status retrieved for {domain}",
            data=status
        )
    
    except Exception as e:
        logger.error(f"Error getting nginx status: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/ssl/generate")
async def generate_ssl_certificate(request: SSLCertificateRequest) -> ApiResponse:
    try:
        domain = request.domain.lower().strip()
        email = request.email
        
        config.ensure_directories()
        
        cert_path = Path(CERTBOT_LIVE_DIR) / domain / "fullchain.pem"
        
        if cert_path.exists() and not request.force_renewal:
            return ApiResponse(
                success=True,
                message=f"SSL certificate already exists for {domain}",
                data={
                    "domain": domain,
                    "certificate_path": str(cert_path),
                    "already_exists": True
                }
            )
        
        certbot_command = [
            "sudo", "certbot", "certonly",
            "--webroot",
            "-w", WEBROOT_DIR,
            "-d", domain,
            "--email", email,
            "--agree-tos",
            "--non-interactive"
        ]
        
        if request.force_renewal:
            certbot_command.append("--force-renewal")
        
        result = await run_command(certbot_command)
        
        if not cert_path.exists():
            raise HTTPException(
                status_code=500, 
                detail=f"Certificate generation completed but certificate file not found at {cert_path}"
            )
        
        return ApiResponse(
            success=True,
            message=f"SSL certificate generated successfully for {domain}",
            data={
                "domain": domain,
                "certificate_path": str(cert_path),
                "command_output": result.stdout
            }
        )
    
    except subprocess.CalledProcessError as e:
        error_msg = f"Certbot failed: {e.stderr or e.stdout or str(e)}"
        logger.error(error_msg)
        raise HTTPException(status_code=500, detail=error_msg)
    except Exception as e:
        logger.error(f"Error generating SSL certificate: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/ssl/renew")
async def renew_ssl_certificate(request: DomainRequest) -> ApiResponse:
    try:
        domain = request.domain.lower().strip()
        
        result = await run_command([
            "sudo", "certbot", "renew",
            "--cert-name", domain,
            "--non-interactive"
        ])
        
        return ApiResponse(
            success=True,
            message=f"SSL certificate renewal initiated for {domain}",
            data={
                "domain": domain,
                "command_output": result.stdout
            }
        )
    
    except subprocess.CalledProcessError as e:
        error_msg = f"Certificate renewal failed: {e.stderr or e.stdout or str(e)}"
        logger.error(error_msg)
        raise HTTPException(status_code=500, detail=error_msg)
    except Exception as e:
        logger.error(f"Error renewing SSL certificate: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/ssl/status/{domain}")
async def get_ssl_status(domain: str) -> ApiResponse:
    try:
        domain = domain.lower().strip()
        
        cert_path = Path(CERTBOT_LIVE_DIR) / domain / "fullchain.pem"
        key_path = Path(CERTBOT_LIVE_DIR) / domain / "privkey.pem"
        
        status = {
            "domain": domain,
            "certificate_exists": cert_path.exists(),
            "private_key_exists": key_path.exists(),
            "certificate_info": None
        }
        
        if cert_path.exists():
            try:
                result = await run_command([
                    "sudo", "openssl", "x509", "-in", str(cert_path), "-noout", "-dates"
                ])
                status["certificate_info"] = result.stdout.strip()
            except subprocess.CalledProcessError as e:
                status["certificate_info"] = f"Error reading certificate: {e.stderr}"
        
        return ApiResponse(
            success=True,
            message=f"SSL status retrieved for {domain}",
            data=status
        )
    
    except Exception as e:
        logger.error(f"Error getting SSL status: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/ssl/remove")
async def remove_ssl_certificate(request: DomainRequest) -> ApiResponse:
    try:
        domain = request.domain.lower().strip()
        
        result = await run_command([
            "sudo", "certbot", "delete",
            "--cert-name", domain,
            "--non-interactive"
        ])
        
        return ApiResponse(
            success=True,
            message=f"SSL certificate removed successfully for {domain}",
            data={
                "domain": domain,
                "command_output": result.stdout
            }
        )
    
    except subprocess.CalledProcessError as e:
        error_msg = f"Certificate removal failed: {e.stderr or e.stdout or str(e)}"
        logger.error(error_msg)
        raise HTTPException(status_code=500, detail=error_msg)
    except Exception as e:
        logger.error(f"Error removing SSL certificate: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/domain/setup")
async def setup_domain(request: DomainSetupRequest) -> ApiResponse:
    try:
        domain = request.domain.lower().strip()
        project_id = request.project_id
        ssl_enabled = request.ssl_enabled
        email = request.email
        
        result_data = {
            "domain": domain,
            "project_id": project_id,
            "ssl_enabled": ssl_enabled,
            "nginx_deployed": False,
            "ssl_generated": False,
            "ssl_nginx_updated": False
        }
        
        nginx_request = NginxConfigRequest(
            domain=domain,
            project_id=project_id,
            ssl_enabled=False
        )
        
        nginx_response = await deploy_nginx_config(nginx_request)
        if nginx_response.success:
            result_data["nginx_deployed"] = True
        else:
            raise HTTPException(status_code=500, detail="Failed to deploy initial Nginx configuration")
        
        if ssl_enabled:
            ssl_request = SSLCertificateRequest(
                domain=domain,
                project_id=project_id,
                email=email
            )
            
            ssl_response = await generate_ssl_certificate(ssl_request)
            if ssl_response.success:
                nginx_ssl_request = NginxConfigRequest(
                    domain=domain,
                    project_id=project_id,
                    ssl_enabled=True
                )
                
                nginx_ssl_response = await deploy_nginx_config(nginx_ssl_request)
                if nginx_ssl_response.success:
                    result_data["ssl_generated"] = True
                    result_data["ssl_nginx_updated"] = True
                else:
                    raise HTTPException(status_code=500, detail="SSL generated but failed to update Nginx configuration")
            else:
                raise HTTPException(status_code=500, detail="Failed to generate SSL certificate")
        
        return ApiResponse(
            success=True,
            message=f"Domain setup completed successfully for {domain}",
            data=result_data
        )
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error setting up domain: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/domain/complete-setup")
async def complete_domain_setup(request: DomainSetupRequest) -> ApiResponse:
    try:
        domain = request.domain.lower().strip()
        project_id = request.project_id
        ssl_enabled = request.ssl_enabled
        email = request.email
        
        result_data = {
            "domain": domain,
            "project_id": project_id,
            "ssl_enabled": ssl_enabled,
            "nginx_deployed": False,
            "ssl_generated": False,
            "ssl_nginx_updated": False
        }
        
        nginx_request = NginxConfigRequest(
            domain=domain,
            project_id=project_id,
            ssl_enabled=False
        )
        
        nginx_response = await deploy_nginx_config(nginx_request)
        if nginx_response.success:
            result_data["nginx_deployed"] = True
            logger.info(f"Initial Nginx config deployed for {domain}")
        else:
            raise HTTPException(status_code=500, detail="Failed to deploy initial Nginx configuration")
        
        if ssl_enabled:
            ssl_request = SSLCertificateRequest(
                domain=domain,
                project_id=project_id,
                email=email
            )
            
            ssl_response = await generate_ssl_certificate(ssl_request)
            if ssl_response.success:
                result_data["ssl_generated"] = True
                logger.info(f"SSL certificate generated for {domain}")
                
                nginx_ssl_request = NginxConfigRequest(
                    domain=domain,
                    project_id=project_id,
                    ssl_enabled=True
                )
                
                nginx_ssl_response = await deploy_nginx_config(nginx_ssl_request)
                if nginx_ssl_response.success:
                    result_data["ssl_nginx_updated"] = True
                    logger.info(f"Nginx config updated with SSL for {domain}")
                else:
                    raise HTTPException(status_code=500, detail="SSL generated but failed to update Nginx configuration")
            else:
                logger.warning(f"SSL generation failed for {domain}, continuing with HTTP only")
        
        return ApiResponse(
            success=True,
            message=f"Domain setup completed for {domain}",
            data=result_data
        )
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in complete domain setup: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/domain/cleanup")
async def cleanup_domain(request: DomainRequest) -> ApiResponse:
    try:
        domain = request.domain.lower().strip()
        
        result_data = {
            "domain": domain,
            "nginx_removed": False,
            "ssl_removed": False
        }
        
        nginx_remove_response = await remove_nginx_config(request)
        if nginx_remove_response.success:
            result_data["nginx_removed"] = True
        
        ssl_remove_response = await remove_ssl_certificate(request)
        if ssl_remove_response.success:
            result_data["ssl_removed"] = True
        
        return ApiResponse(
            success=True,
            message=f"Domain cleanup completed for {domain}",
            data=result_data
        )
    
    except Exception as e:
        logger.error(f"Error cleaning up domain: {e}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    config.ensure_directories()
    uvicorn.run(
        "main:app",
        host=config.API_HOST,
        port=config.API_PORT,
        reload=config.API_RELOAD,
        log_level=config.API_LOG_LEVEL
    )
