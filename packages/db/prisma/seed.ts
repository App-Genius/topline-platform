import { PrismaClient, RoleType, Industry, KpiType, BudgetCategory } from '@prisma/client'
import { hash } from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // Create demo organization
  const org = await prisma.organization.create({
    data: {
      name: 'The Capital Grille',
      industry: Industry.RESTAURANT,
      settings: {
        timezone: 'America/New_York',
        currency: 'USD',
      },
    },
  })
  console.log(`✅ Created organization: ${org.name}`)

  // Create roles
  const roles = await Promise.all([
    prisma.role.create({
      data: {
        name: 'Admin',
        type: RoleType.ADMIN,
        organizationId: org.id,
        permissions: ['*'],
      },
    }),
    prisma.role.create({
      data: {
        name: 'Manager',
        type: RoleType.MANAGER,
        organizationId: org.id,
        permissions: ['read:*', 'write:behaviors', 'write:entries', 'verify:behaviors'],
      },
    }),
    prisma.role.create({
      data: {
        name: 'Server',
        type: RoleType.SERVER,
        organizationId: org.id,
        permissions: ['read:own', 'write:behaviors'],
      },
    }),
    prisma.role.create({
      data: {
        name: 'Host',
        type: RoleType.HOST,
        organizationId: org.id,
        permissions: ['read:own', 'write:behaviors'],
      },
    }),
    prisma.role.create({
      data: {
        name: 'Bartender',
        type: RoleType.BARTENDER,
        organizationId: org.id,
        permissions: ['read:own', 'write:behaviors'],
      },
    }),
  ])
  console.log(`✅ Created ${roles.length} roles`)

  const [adminRole, managerRole, serverRole, hostRole, bartenderRole] = roles

  // Create users
  const passwordHash = await hash('demo123', 12)
  const users = await Promise.all([
    prisma.user.create({
      data: {
        email: 'admin@topline.demo',
        passwordHash,
        name: 'Alex Admin',
        avatar: 'AA',
        organizationId: org.id,
        roleId: adminRole.id,
      },
    }),
    prisma.user.create({
      data: {
        email: 'manager@topline.demo',
        passwordHash,
        name: 'Maria Manager',
        avatar: 'MM',
        organizationId: org.id,
        roleId: managerRole.id,
      },
    }),
    prisma.user.create({
      data: {
        email: 'sam@topline.demo',
        passwordHash,
        name: 'Sam S.',
        avatar: 'SS',
        organizationId: org.id,
        roleId: serverRole.id,
      },
    }),
    prisma.user.create({
      data: {
        email: 'taylor@topline.demo',
        passwordHash,
        name: 'Taylor T.',
        avatar: 'TT',
        organizationId: org.id,
        roleId: serverRole.id,
      },
    }),
    prisma.user.create({
      data: {
        email: 'jordan@topline.demo',
        passwordHash,
        name: 'Jordan J.',
        avatar: 'JJ',
        organizationId: org.id,
        roleId: serverRole.id,
      },
    }),
    prisma.user.create({
      data: {
        email: 'casey@topline.demo',
        passwordHash,
        name: 'Casey C.',
        avatar: 'CC',
        organizationId: org.id,
        roleId: hostRole.id,
      },
    }),
    prisma.user.create({
      data: {
        email: 'riley@topline.demo',
        passwordHash,
        name: 'Riley R.',
        avatar: 'RR',
        organizationId: org.id,
        roleId: bartenderRole.id,
      },
    }),
  ])
  console.log(`✅ Created ${users.length} users`)

  // Create location
  const location = await prisma.location.create({
    data: {
      name: 'Downtown',
      address: '123 Main Street, New York, NY 10001',
      organizationId: org.id,
    },
  })
  console.log(`✅ Created location: ${location.name}`)

  // Create behaviors
  const behaviors = await Promise.all([
    prisma.behavior.create({
      data: {
        name: 'Upsell Wine',
        description: 'Suggest a bottle instead of a glass',
        targetPerDay: 5,
        points: 2,
        organizationId: org.id,
        roles: { connect: [{ id: serverRole.id }, { id: bartenderRole.id }] },
      },
    }),
    prisma.behavior.create({
      data: {
        name: 'Suggest Appetizer',
        description: 'Recommend an appetizer to start',
        targetPerDay: 8,
        points: 1,
        organizationId: org.id,
        roles: { connect: [{ id: serverRole.id }] },
      },
    }),
    prisma.behavior.create({
      data: {
        name: 'Offer Dessert',
        description: 'Present the dessert menu and make a recommendation',
        targetPerDay: 6,
        points: 1,
        organizationId: org.id,
        roles: { connect: [{ id: serverRole.id }] },
      },
    }),
    prisma.behavior.create({
      data: {
        name: 'Premium Spirit Upsell',
        description: 'Suggest a premium spirit upgrade',
        targetPerDay: 4,
        points: 2,
        organizationId: org.id,
        roles: { connect: [{ id: bartenderRole.id }] },
      },
    }),
    prisma.behavior.create({
      data: {
        name: 'VIP Recognition',
        description: 'Greet returning guests by name',
        targetPerDay: 3,
        points: 3,
        organizationId: org.id,
        roles: { connect: [{ id: hostRole.id }, { id: serverRole.id }] },
      },
    }),
  ])
  console.log(`✅ Created ${behaviors.length} behaviors`)

  // Create KPIs
  const kpis = await Promise.all([
    prisma.kpi.create({
      data: {
        name: 'Daily Revenue',
        type: KpiType.REVENUE,
        target: 15000,
        unit: '$',
        organizationId: org.id,
      },
    }),
    prisma.kpi.create({
      data: {
        name: 'Average Check',
        type: KpiType.AVERAGE_CHECK,
        target: 55,
        unit: '$',
        organizationId: org.id,
      },
    }),
    prisma.kpi.create({
      data: {
        name: 'Covers',
        type: KpiType.COVERS,
        target: 200,
        unit: 'guests',
        organizationId: org.id,
      },
    }),
    prisma.kpi.create({
      data: {
        name: 'Guest Rating',
        type: KpiType.RATING,
        target: 4.5,
        unit: 'stars',
        organizationId: org.id,
      },
    }),
  ])
  console.log(`✅ Created ${kpis.length} KPIs`)

  // Create benchmark
  const benchmark = await prisma.benchmark.create({
    data: {
      organizationId: org.id,
      year: 2024,
      totalRevenue: 4500000,
      daysOpen: 320,
      baselineAvgCheck: 52,
      baselineRating: 4.2,
    },
  })
  console.log(`✅ Created benchmark for ${benchmark.year}`)

  // Create sample daily entries for the last 30 days
  const today = new Date()
  const dailyEntries = []
  for (let i = 29; i >= 0; i--) {
    const date = new Date(today)
    date.setDate(date.getDate() - i)
    date.setHours(0, 0, 0, 0)

    const revenue = 12000 + Math.random() * 6000
    const covers = 150 + Math.floor(Math.random() * 100)

    dailyEntries.push(
      prisma.dailyEntry.create({
        data: {
          locationId: location.id,
          date,
          totalRevenue: Math.round(revenue * 100) / 100,
          totalCovers: covers,
        },
      })
    )
  }
  await Promise.all(dailyEntries)
  console.log(`✅ Created ${dailyEntries.length} daily entries`)

  // Create sample behavior logs
  const behaviorLogs = []
  const staffUsers = users.filter(u => u.roleId === serverRole.id || u.roleId === bartenderRole.id)

  for (let i = 29; i >= 0; i--) {
    const date = new Date(today)
    date.setDate(date.getDate() - i)

    for (const user of staffUsers) {
      // Each staff member logs 3-8 behaviors per day
      const numLogs = 3 + Math.floor(Math.random() * 6)
      for (let j = 0; j < numLogs; j++) {
        const behavior = behaviors[Math.floor(Math.random() * behaviors.length)]
        const logDate = new Date(date)
        logDate.setHours(11 + Math.floor(Math.random() * 10), Math.floor(Math.random() * 60))

        behaviorLogs.push(
          prisma.behaviorLog.create({
            data: {
              userId: user.id,
              behaviorId: behavior.id,
              locationId: location.id,
              verified: Math.random() > 0.3,
              verifiedById: Math.random() > 0.3 ? users[1].id : null,
              verifiedAt: Math.random() > 0.3 ? logDate : null,
              createdAt: logDate,
              metadata: {
                tableNumber: String(Math.floor(Math.random() * 30) + 1),
                checkAmount: 40 + Math.floor(Math.random() * 80),
              },
            },
          })
        )
      }
    }
  }
  await Promise.all(behaviorLogs)
  console.log(`✅ Created ${behaviorLogs.length} behavior logs`)

  // Create training topics
  const topics = await Promise.all([
    prisma.trainingTopic.create({
      data: {
        name: 'The Sullivan Nod',
        description: 'Use positive body language to increase acceptance of suggestions',
        content: '# The Sullivan Nod\n\nA subtle technique to increase guest acceptance of your recommendations.',
        duration: 2,
        organizationId: org.id,
      },
    }),
    prisma.trainingTopic.create({
      data: {
        name: 'Wine Pairing Basics',
        description: 'Learn fundamental wine pairing principles',
        duration: 5,
        organizationId: org.id,
      },
    }),
    prisma.trainingTopic.create({
      data: {
        name: 'Reading the Table',
        description: 'Identify upsell opportunities based on guest behavior',
        duration: 3,
        organizationId: org.id,
      },
    }),
  ])
  console.log(`✅ Created ${topics.length} training topics`)

  console.log('\n🎉 Seed completed successfully!')
  console.log('\n📧 Demo accounts:')
  console.log('   admin@topline.demo / demo123')
  console.log('   manager@topline.demo / demo123')
  console.log('   sam@topline.demo / demo123')
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
