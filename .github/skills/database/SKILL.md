# Database Skills

Prisma ORM with PostgreSQL. Multi-tenant schema with UUID v7 primary keys and cascade relationships.

## Schema Patterns

**File:** `apps/backend/prisma/schema.prisma`

### Primary Keys

```prisma
model Product {
  id String @id @default(uuid(7))
}
```

UUID v7 for all primary keys.

### Multi-Tenant Links

All models link to `Tenant`:

```prisma
model Product {
  tenantId String
  tenant   Tenant @relation(fields: [tenantId], references: [id])
}
```

### Unique Constraints

Composite unique on tenant + external ID:

```prisma
model Product {
  @@unique([tenantId, mtProductId])
}
```

### Indexes

```prisma
model Product {
  @@index([tenantId])
  @@index([mtProductId])
}
```

Index on `tenantId` and frequently queried fields.

### Cascade Deletes

```prisma
model ProductVariant {
  product Product @relation(fields: [productId], references: [id], onDelete: Cascade)
}
```

Related records deleted when parent is deleted.

## Query Conventions

### Always Filter by tenantId

```typescript
const products = await prisma.product.findMany({
  where: { tenantId: tenant },
})
```

### Include Relations

```typescript
const product = await prisma.product.findUnique({
  where: { id },
  include: {
    tenant: true,
    variants: {
      orderBy: { sortOrder: 'asc' },
    },
    images: {
      orderBy: [{ isFeatured: 'desc' }, { sortOrder: 'asc' }],
    },
  },
})
```

### Order By

```typescript
orderBy: [
  { sortOrder: 'asc' },
  { createdAt: 'desc' },
]
```

Sort by `sortOrder` first, then `createdAt`.

### Unique Lookups

```typescript
const existing = await prisma.product.findUnique({
  where: {
    tenantId_mtProductId: {
      tenantId: tenant,
      mtProductId: String(mtProductId),
    },
  },
})
```

### Transactions

```typescript
await prisma.$transaction(async (tx) => {
  const product = await tx.product.create({ ... })
  await tx.productVariant.createMany({ ... })
})
```

## Models

**Key Models:**

- `Tenant` - OAuth config, mtSubdomain
- `Session` - Access tokens, role, expiresAt
- `Product` - Links to MT product, custom description
- `ProductVariant` - SKU, MT variant ID
- `ProductImage` - Product/variant images
- `Banner` - Tenant banners with expiration
- `User` - Tenant users with role

## File Locations

- Schema: `apps/backend/prisma/schema.prisma`
- Client: `apps/backend/src/prisma.ts`
- Example queries: `apps/backend/src/routes/products.ts`

## Important Notes

- Always filter by `tenantId` in queries
- Use `include` for relations, not separate queries
- Order by `sortOrder` then `createdAt`
- Use transactions for multi-step operations
- Cascade deletes handle cleanup automatically








