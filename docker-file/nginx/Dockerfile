
FROM nginx:alpine

# Supprime la conf par défaut
RUN rm /etc/nginx/conf.d/default.conf

# Copie notre conf
COPY nginx.conf /etc/nginx/nginx.conf
COPY conf.d/default.conf /etc/nginx/conf.d/default.conf

# Permissions
RUN chown -R nginx:nginx /var/cache/nginx && \
    chown -R nginx:nginx /var/log/nginx && \
    chown -R nginx:nginx /etc/nginx/conf.d
RUN touch /var/run/nginx.pid && \
    chown -R nginx:nginx /var/run/nginx.pid

USER nginx

EXPOSE 80

# Healthcheck optionnel
HEALTHCHECK CMD curl --fail http://localhost/ || exit 1