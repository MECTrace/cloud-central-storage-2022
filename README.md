# Penta Security Server 

## Description

[NestJS](https://github.com/nestjs/nest) framework TypeScript starter repository.

## Table of Contents

- [Quick run](#quick-run)
- [Links](#links)
- [Database utils](#database-utils)
- [Generate SSL Cert](#generate-ssl-cert)

## Quick run

```bash
$ cp env-example .env
$ npm install
$ npm run migration:run
$ npm run seed:run
$ npm run start:dev
```

## Links

- Swagger: http://localhost:3001/api/docs
- Socket: http://localhost:3001

## Database utils

Generate migration

```bash
npm run migration:create -- CreateNameTable
```

Run migration

```bash
npm run migration:run
```

Revert migration

```bash
npm run migration:revert
```

Drop all tables in database

```bash
npm run schema:drop
```

Run seed

```bash
npm run seed:run
```

## Generate SSL Cert
### First, Create cert folder
```bash
mkdir cert && cd cert
```

Create rootCA.cnf and cert.cnf from example-config.cnf

```bash
cp example-config.cnf rootCA.cnf && cp example-config.cnf cert.cnf
```

Fill or replace information in rootCA.cnf and cert.cnf file

### Create Certificate Authority
```bash
openssl req -config rootCA.cnf -newkey rsa:2048 \
-nodes -x509 -sha256 \
-keyout ca-key.pem \
-out ca-cert.pem \-days 365
```

### Create Self-Signed Certificates using OpenSSL
```bash
openssl req -newkey rsa:2048 \
-keyout cloud-key.pem \
-out cloud-req.pem \
-config cert.cnf \
-nodes -days 365
```

### Generate SSL certificate With self signed CA
```bash
openssl x509 -req -days 365 -sha256 -extfile cert.cnf -set_serial 01 \
   -in cloud-req.pem \
   -out cloud-cert.pem \
   -CA ca-cert.pem \
   -CAkey ca-key.pem
```

### Verify with root CA 
```bash
openssl verify -CAfile ca-cert.pem cloud-cert.pem ca-cert.pem
``` 