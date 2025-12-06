# Nginx Configuration for BizCore (Laragon)

To serve the Next.js application correctly via `bizcore.test`, you need to configure Nginx to proxy requests to the Node.js server running on port 3000.

1. Open Laragon.
2. Go to **Menu > Nginx > sites-enabled**.
3. Find the file named `bizcore.test.conf` (or similar).
4. Replace its content with the following configuration:

```nginx
server {
    listen 80;
    listen 443 ssl;
    server_name bizcore.test *.bizcore.test;
    
    # SSL Configuration (if enabled in Laragon)
    # ssl_certificate "C:/laragon/etc/ssl/bizcore.test.crt";
    # ssl_certificate_key "C:/laragon/etc/ssl/bizcore.test.key";

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        
        # Pass client IP
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

5. Save the file.
6. **Reload Nginx** in Laragon (Menu > Nginx > Reload).
7. Ensure your Next.js app is running (`npm run start`).

This configuration ensures that all requests, including those for static assets (`/_next/...`), are correctly routed to the Next.js application.
