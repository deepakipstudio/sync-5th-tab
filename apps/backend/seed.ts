import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // Create first tenant
  const tenant = await prisma.tenant.create({
    data: {
      name: 'IPSTUDIO Sandbox',
      slug: 'ipstudio.sandbox',
      mtSubdomain: 'ipstudio.sandbox',  // Will be: testdev.marianatek.com
      clientId: '0GfyDkp4rMIIyN5h5LKR6SiVDr5Z6ZhV5Kkxuak7',
      clientSecret: 'in26nPvBxjujptAt1UX0E7diwhSWFosZXYeiw7YkGRahu07NlsVikZXerhVG29EMBvdGBKzIDHOY91E5FtpI6BvodaWJtzNORrxI68RIN0EWunRNr0qCpWwBOPJf8tqT',
    },
  })

  console.log('✅ Tenant created:')
  console.log(tenant)
  console.log()
  console.log('📝 Next steps:')
  console.log('1. Go to https://testdev.marianatek.com/developer')
  console.log('2. Create OAuth application with redirect URI: http://localhost:3000/auth/callback')
  console.log('3. Copy Client ID and Client Secret')
  console.log('4. Update database with real credentials using Prisma Studio:')
  console.log('   npx prisma studio')
  console.log('5. Or update via SQL:')
  console.log(`   UPDATE "Tenant" SET "clientId" = '...', "clientSecret" = '...' WHERE id = '${tenant.id}'`)
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
