# File Handling Skills

Multer for uploads with memory storage. Storage service abstraction for local filesystem (can swap to S3).

## Multer Configuration

**File:** `apps/backend/src/routes/admin.ts`

```typescript
import multer from 'multer'

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
  fileFilter: (_req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
    if (allowed.includes(file.mimetype)) {
      cb(null, true)
    } else {
      cb(new Error('Invalid file type'))
    }
  },
})
```

### Allowed Types

- `image/jpeg`
- `image/png`
- `image/webp`
- `image/gif`

### File Size Limit

2MB maximum.

## Upload Middleware

```typescript
// Single file
export const uploadBannerImage = upload.single('image')

// Multiple files
export const uploadProductImages = upload.array('images', 10)
```

### Error Handling

```typescript
export function handleMulterError(err: any, req: Request, res: Response, next: NextFunction) {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'File too large. Maximum size is 2MB.' })
    }
    return res.status(400).json({ error: err.message })
  }
  if (err) {
    return res.status(400).json({ error: err.message })
  }
  next()
}
```

### Route Usage

```typescript
app.post('/admin/:tenant/banners', 
  uploadBannerImage, 
  handleMulterError, 
  postTenantBanner
)
```

## Storage Service

**File:** `apps/backend/src/services/storage.ts`

### Interface

```typescript
interface StorageService {
  saveFile(buffer: Buffer, originalName: string, mimeType: string): Promise<string>
  deleteFile(filename: string): Promise<void>
  getFileUrl(filename: string): string
  saveImage(buffer: Buffer, originalName: string, mimeType: string, type: 'product' | 'variant'): Promise<string>
  deleteImage(filename: string, type: 'product' | 'variant'): Promise<void>
  getImageUrl(filename: string, type: 'product' | 'variant'): string
}
```

### Usage

```typescript
import { storage } from '../services/storage'

// Save image
const filename = await storage.saveImage(
  req.file.buffer,
  req.file.originalname,
  req.file.mimetype,
  'product'
)

// Get URL
const imageUrl = storage.getImageUrl(filename, 'product')
// => "/uploads/products/uuid.jpg"

// Delete
await storage.deleteImage(filename, 'product')
```

## File Naming

UUID-based filenames with proper extensions:

```typescript
const filename = `${randomUUID()}${getExtension(mimeType)}`
// => "155332df-c516-423f-8f42-10ef46f43114.jpg"
```

## Directory Structure

```
uploads/
  banners/
  products/
  variants/
```

## File Locations

- Storage service: `apps/backend/src/services/storage.ts`
- Upload config: `apps/backend/src/routes/admin.ts`
- Upload directories: `apps/backend/uploads/`

## Important Notes

- Files stored in memory during upload (Multer memory storage)
- UUID-based filenames prevent conflicts
- Storage service can be swapped to S3 later
- File URLs: `/uploads/{type}/{filename}`
- Always validate file type and size before saving








