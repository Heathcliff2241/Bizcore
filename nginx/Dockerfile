FROM nginx:latest

# Copy nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf

# Expose ports
EXPOSE 80 443

# Run nginx in foreground
CMD ["nginx", "-g", "daemon off;"]
