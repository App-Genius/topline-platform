/**
 * AC Hotel Seed Data
 *
 * This seed file creates the initial data for AC Hotel.
 * Behavior points and targets are configurable defaults - adjust as needed.
 *
 * Run with: npm run db:seed:ac-hotel
 */

import { PrismaClient, RoleType, Industry, KpiType } from '@prisma/client'
import { hash } from 'bcryptjs'

const prisma = new PrismaClient()

// Configurable behavior definitions per role
// Points and targets are suggestions - can be adjusted in the app
const HOTEL_BEHAVIORS = {
  FRONT_DESK: [
    { name: 'Offer room upgrade', description: 'Suggest available room upgrade options', points: 10, targetPerDay: 5 },
    { name: 'Suggest late checkout', description: 'Offer late checkout option to guests', points: 5, targetPerDay: 3 },
    { name: 'Recommend restaurant', description: 'Recommend hotel restaurant or nearby dining', points: 3, targetPerDay: 10 },
    { name: 'Note special requests', description: 'Document and communicate guest special requests', points: 2, targetPerDay: 5 },
    { name: 'Upsell amenity package', description: 'Offer spa, breakfast, or experience packages', points: 15, targetPerDay: 2 },
  ],
  SERVER: [
    { name: 'Suggest appetizer', description: 'Recommend a starter to begin the meal', points: 3, targetPerDay: 10 },
    { name: 'Recommend wine pairing', description: 'Suggest wine that complements the meal', points: 5, targetPerDay: 5 },
    { name: 'Offer dessert', description: 'Present dessert options after main course', points: 3, targetPerDay: 10 },
    { name: 'Mention daily special', description: 'Highlight chef specials or featured items', points: 2, targetPerDay: 15 },
    { name: 'Suggest room service', description: 'Mention room service availability for future orders', points: 5, targetPerDay: 3 },
  ],
  BARTENDER: [
    { name: 'Suggest premium spirit', description: 'Offer top-shelf upgrade for cocktails', points: 5, targetPerDay: 10 },
    { name: 'Recommend cocktail', description: 'Suggest signature or seasonal cocktails', points: 3, targetPerDay: 15 },
    { name: 'Offer bar snack', description: 'Suggest food items from bar menu', points: 3, targetPerDay: 10 },
  ],
  HOUSEKEEPING: [
    { name: 'Complete room checklist', description: 'Follow full room inspection checklist', points: 5, targetPerDay: 12 },
    { name: 'Report maintenance issue', description: 'Document and report any maintenance needs', points: 3, targetPerDay: 2 },
    { name: 'Restock amenities', description: 'Ensure all room amenities are fully stocked', points: 2, targetPerDay: 12 },
  ],
  CHEF: [
    { name: 'Log food waste', description: 'Track and document food waste daily', points: 3, targetPerDay: 3 },
    { name: 'Update 86d items', description: 'Communicate out-of-stock items to service', points: 5, targetPerDay: 2 },
    { name: 'Portion control check', description: 'Verify portion consistency', points: 3, targetPerDay: 5 },
  ],
  PURCHASER: [
    { name: 'Compare vendor prices', description: 'Review pricing from multiple vendors', points: 10, targetPerDay: 1 },
    { name: 'Review cost of sales', description: 'Analyze daily COGS reports', points: 5, targetPerDay: 1 },
    { name: 'Audit invoices', description: 'Verify invoice accuracy against orders', points: 3, targetPerDay: 3 },
  ],
}

async function main() {
  console.log('🏨 Seeding AC Hotel database...\n')

  // Check if AC Hotel org already exists
  const existingOrg = await prisma.organization.findFirst({
    where: { name: 'AC Hotel' }
  })

  if (existingOrg) {
    console.log('⚠️  AC Hotel organization already exists. Skipping seed.')
    console.log('   To reseed, delete the existing organization first.')
    return
  }

  // Create AC Hotel organization
  const org = await prisma.organization.create({
    data: {
      name: 'AC Hotel',
      industry: Industry.HOSPITALITY,
      settings: {
        timezone: 'America/New_York',
        currency: 'USD',
        operatingHours: { open: '06:00', close: '23:00' },
      },
    },
  })
  console.log(`✅ Created organization: ${org.name}`)

  // Create roles
  const roleData = [
    { name: 'General Manager', type: RoleType.ADMIN, permissions: ['*'] },
    { name: 'Front Office Manager', type: RoleType.MANAGER, permissions: ['read:*', 'write:behaviors', 'write:entries', 'verify:behaviors', 'manage:staff'] },
    { name: 'F&B Manager', type: RoleType.MANAGER, permissions: ['read:*', 'write:behaviors', 'write:entries', 'verify:behaviors', 'manage:staff'] },
    { name: 'Front Desk Agent', type: RoleType.FRONT_DESK, permissions: ['read:own', 'write:behaviors'] },
    { name: 'Server', type: RoleType.SERVER, permissions: ['read:own', 'write:behaviors'] },
    { name: 'Bartender', type: RoleType.BARTENDER, permissions: ['read:own', 'write:behaviors'] },
    { name: 'Room Attendant', type: RoleType.HOUSEKEEPING, permissions: ['read:own', 'write:behaviors'] },
    { name: 'Line Cook', type: RoleType.CHEF, permissions: ['read:own', 'write:behaviors'] },
    { name: 'Purchaser', type: RoleType.PURCHASER, permissions: ['read:costs', 'write:behaviors', 'manage:vendors'] },
  ]

  const roles: Record<string, Awaited<ReturnType<typeof prisma.role.create>>> = {}
  for (const role of roleData) {
    const created = await prisma.role.create({
      data: {
        name: role.name,
        type: role.type,
        organizationId: org.id,
        permissions: role.permissions,
      },
    })
    roles[role.type] = created
  }
  console.log(`✅ Created ${roleData.length} roles`)

  // Create users
  const passwordHash = await hash('achotel123', 12)
  const userData = [
    { email: 'joel@achotel.com', name: 'Joel Dean', avatar: 'JD', roleType: RoleType.ADMIN },
    { email: 'sarah@achotel.com', name: 'Sarah Manager', avatar: 'SM', roleType: RoleType.MANAGER },
    { email: 'mike@achotel.com', name: 'Mike Lobby', avatar: 'ML', roleType: RoleType.FRONT_DESK },
    { email: 'emma@achotel.com', name: 'Emma Desk', avatar: 'ED', roleType: RoleType.FRONT_DESK },
    { email: 'lisa@achotel.com', name: 'Lisa Server', avatar: 'LS', roleType: RoleType.SERVER },
    { email: 'tom@achotel.com', name: 'Tom Bartender', avatar: 'TB', roleType: RoleType.BARTENDER },
    { email: 'ana@achotel.com', name: 'Ana Rooms', avatar: 'AR', roleType: RoleType.HOUSEKEEPING },
    { email: 'maria@achotel.com', name: 'Maria Clean', avatar: 'MC', roleType: RoleType.HOUSEKEEPING },
    { email: 'carlos@achotel.com', name: 'Carlos Chef', avatar: 'CC', roleType: RoleType.CHEF },
    { email: 'david@achotel.com', name: 'David Buyer', avatar: 'DB', roleType: RoleType.PURCHASER },
  ]

  const users: Record<string, Awaited<ReturnType<typeof prisma.user.create>>> = {}
  for (const user of userData) {
    const created = await prisma.user.create({
      data: {
        email: user.email,
        passwordHash,
        name: user.name,
        avatar: user.avatar,
        organizationId: org.id,
        roleId: roles[user.roleType].id,
      },
    })
    users[user.email] = created
  }
  console.log(`✅ Created ${userData.length} users`)

  // Create location
  const location = await prisma.location.create({
    data: {
      name: 'AC Hotel Main',
      address: '123 Hotel Street, City, State 12345',
      organizationId: org.id,
    },
  })
  console.log(`✅ Created location: ${location.name}`)

  // Create behaviors for each role
  const behaviors: Awaited<ReturnType<typeof prisma.behavior.create>>[] = []
  for (const [roleType, behaviorList] of Object.entries(HOTEL_BEHAVIORS)) {
    const role = roles[roleType as RoleType]
    if (!role) continue

    for (const behavior of behaviorList) {
      const created = await prisma.behavior.create({
        data: {
          name: behavior.name,
          description: behavior.description,
          targetPerDay: behavior.targetPerDay,
          points: behavior.points,
          organizationId: org.id,
          roles: { connect: [{ id: role.id }] },
        },
      })
      behaviors.push(created)
    }
  }
  console.log(`✅ Created ${behaviors.length} behaviors`)

  // Create KPIs
  const kpiData = [
    { name: 'Daily Revenue', type: KpiType.REVENUE, target: 10000, unit: '$' },
    { name: 'Average Check', type: KpiType.AVERAGE_CHECK, target: 45, unit: '$' },
    { name: 'Covers/Guests', type: KpiType.COVERS, target: 150, unit: 'guests' },
    { name: 'Customer Rating', type: KpiType.RATING, target: 4.2, unit: 'stars' },
    { name: 'Behavior Adoption', type: KpiType.BEHAVIOR_COUNT, target: 100, unit: '%' },
    { name: 'Food Cost', type: KpiType.FOOD_COST, target: 30, unit: '%' },
    { name: 'Labor Cost', type: KpiType.LABOR_COST, target: 25, unit: '%' },
  ]

  for (const kpi of kpiData) {
    await prisma.kpi.create({
      data: {
        name: kpi.name,
        type: kpi.type,
        target: kpi.target,
        unit: kpi.unit,
        organizationId: org.id,
      },
    })
  }
  console.log(`✅ Created ${kpiData.length} KPIs`)

  // Create benchmark
  await prisma.benchmark.create({
    data: {
      organizationId: org.id,
      year: 2024,
      totalRevenue: 3650000, // ~$10K/day
      daysOpen: 365,
      baselineAvgCheck: 45,
      baselineRating: 4.2,
    },
  })
  console.log('✅ Created benchmark for 2024')

  // Create sample daily entries for the last 30 days
  const today = new Date()
  for (let i = 29; i >= 0; i--) {
    const date = new Date(today)
    date.setDate(date.getDate() - i)
    date.setHours(0, 0, 0, 0)

    const revenue = 8000 + Math.random() * 4000 // $8K-$12K per day
    const covers = 120 + Math.floor(Math.random() * 60)

    await prisma.dailyEntry.create({
      data: {
        locationId: location.id,
        date,
        totalRevenue: Math.round(revenue * 100) / 100,
        totalCovers: covers,
      },
    })
  }
  console.log('✅ Created 30 daily entries')

  // Create sample behavior logs for the last 7 days
  const staffUsers = userData.filter(u =>
    [RoleType.FRONT_DESK, RoleType.SERVER, RoleType.BARTENDER, RoleType.HOUSEKEEPING].includes(u.roleType as RoleType)
  )
  const managerUser = Object.values(users).find(u => u.email === 'sarah@achotel.com')

  let logCount = 0
  for (let i = 6; i >= 0; i--) {
    const date = new Date(today)
    date.setDate(date.getDate() - i)

    for (const staffData of staffUsers) {
      const user = users[staffData.email]
      const numLogs = 3 + Math.floor(Math.random() * 5)

      for (let j = 0; j < numLogs; j++) {
        const behavior = behaviors[Math.floor(Math.random() * behaviors.length)]
        const logDate = new Date(date)
        logDate.setHours(8 + Math.floor(Math.random() * 12), Math.floor(Math.random() * 60))

        const verified = Math.random() > 0.4

        await prisma.behaviorLog.create({
          data: {
            userId: user.id,
            behaviorId: behavior.id,
            locationId: location.id,
            verified,
            verifiedById: verified && managerUser ? managerUser.id : null,
            verifiedAt: verified ? logDate : null,
            createdAt: logDate,
            metadata: {},
          },
        })
        logCount++
      }
    }
  }
  console.log(`✅ Created ${logCount} behavior logs`)

  // Create training topics
  const topicData = [
    { name: 'Guest Recognition', description: 'Techniques for recognizing and greeting returning guests', duration: 2 },
    { name: 'Upselling Techniques', description: 'How to naturally suggest upgrades and add-ons', duration: 3 },
    { name: 'Handling Complaints', description: 'Professional complaint resolution strategies', duration: 5 },
    { name: 'Local Area Knowledge', description: 'Key attractions and recommendations for guests', duration: 3 },
    { name: 'Food Safety Basics', description: 'Essential food handling and safety practices', duration: 5 },
  ]

  for (const topic of topicData) {
    await prisma.trainingTopic.create({
      data: {
        name: topic.name,
        description: topic.description,
        duration: topic.duration,
        organizationId: org.id,
      },
    })
  }
  console.log(`✅ Created ${topicData.length} training topics`)

  console.log('\n🎉 AC Hotel seed completed successfully!')
  console.log('\n📋 Login credentials:')
  console.log('   Admin:    joel@achotel.com / achotel123')
  console.log('   Manager:  sarah@achotel.com / achotel123')
  console.log('   Staff:    mike@achotel.com / achotel123')
  console.log('\n💡 Behavior points and targets are configurable in the app.')
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
