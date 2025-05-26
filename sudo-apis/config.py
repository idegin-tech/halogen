import os
from pathlib import Path
from typing import List

class Config:
    API_HOST: str = os.getenv("API_HOST", "0.0.0.0")
    API_PORT: int = int(os.getenv("API_PORT", "8082"))
    API_RELOAD: bool = os.getenv("API_RELOAD", "True").lower() == "true"
    API_LOG_LEVEL: str = os.getenv("API_LOG_LEVEL", "info")
    
    NGINX_SITES_AVAILABLE: str = os.getenv("NGINX_SITES_AVAILABLE", "/etc/nginx/sites-available")
    NGINX_SITES_ENABLED: str = os.getenv("NGINX_SITES_ENABLED", "/etc/nginx/sites-enabled")
    NGINX_CONFIG_DIR: str = os.getenv("NGINX_CONFIG_DIR", "/home/msuser/nginx-configs")
    NGINX_TEMPLATES_DIR: str = os.getenv("NGINX_TEMPLATES_DIR", "/home/msuser/nginx-templates")
    
    WEBROOT_DIR: str = os.getenv("WEBROOT_DIR", "/var/www/certbot")
    CERTBOT_LIVE_DIR: str = os.getenv("CERTBOT_LIVE_DIR", "/etc/letsencrypt/live")
    DEFAULT_EMAIL: str = os.getenv("DEFAULT_EMAIL", "admin@example.com")
    
    ALLOWED_ORIGINS: List[str] = os.getenv(
        "ALLOWED_ORIGINS", 
        "http://localhost:3000,http://localhost:8081,https://mortarstudio.site,https://*.mortarstudio.site"
    ).split(",")
    
    LOG_LEVEL: str = os.getenv("LOG_LEVEL", "INFO")
    LOG_FORMAT: str = os.getenv(
        "LOG_FORMAT", 
        "%(asctime)s - %(name)s - %(levelname)s - %(message)s"
    )    
    @classmethod
    def ensure_directories(cls) -> None:
        directories = [
            cls.NGINX_CONFIG_DIR,
            cls.NGINX_TEMPLATES_DIR,
            cls.WEBROOT_DIR,
            f"{cls.WEBROOT_DIR}/.well-known/acme-challenge"
        ]
        
        for directory in directories:
            Path(directory).mkdir(parents=True, exist_ok=True)
    
    @classmethod
    def validate_system_dependencies(cls) -> dict:
        dependencies = {
            "nginx": False,
            "certbot": False,
            "sudo": False
        }
        
        import subprocess
        
        for cmd in dependencies.keys():
            try:
                subprocess.run([cmd, "--version"], capture_output=True, check=False)
                dependencies[cmd] = True
            except FileNotFoundError:
                dependencies[cmd] = False
        
        return dependencies

config = Config()
