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
```bash
UPDATE SOON
```
