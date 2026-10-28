ARG RUNTIME_BASE=nginx:1.28-alpine
FROM ${RUNTIME_BASE}
USER root
RUN rm -rf /usr/share/nginx/html/*
COPY --chown=nginx:nginx --chmod=0644 deploy/security-headers.conf /etc/nginx/cybereader-security.conf
COPY --chown=nginx:nginx --chmod=0644 deploy/nginx.conf /etc/nginx/nginx.conf
COPY --chown=nginx:nginx dist/ /usr/share/nginx/html/cybereader/
USER nginx
EXPOSE 8080
ENTRYPOINT []
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 CMD wget -q -O - http://127.0.0.1:8080/healthz | grep -qx ok
CMD ["nginx", "-g", "daemon off;"]
