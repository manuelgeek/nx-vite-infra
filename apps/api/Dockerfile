FROM --platform=linux/x86-64 public.ecr.aws/docker/library/node:20

WORKDIR /usr/src/app

# Install node dependencies
COPY package.json ./

RUN npm install

# Copy source code
COPY . .

RUN chmod +x /usr/src/app/docker-entrypoint.sh

ENV PORT 80
EXPOSE 80

ENTRYPOINT ["/usr/src/app/docker-entrypoint.sh"]
CMD ["server"]
