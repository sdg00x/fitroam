import { prisma } from './prisma'

/**
 * Development seed script.
 * Adds a handful of real London gyms so the API returns actual results.
 * Run with: npx tsx src/lib/seed.ts
 */

async function seed() {
  console.log('Seeding gyms...')

  await prisma.gym.createMany({
    skipDuplicates: true,
    data: [
      {
        placesId:      'ChIJ_test_puregym_angel',
        name:          'PureGym London Angel',
        address:       '40 Islington High St, London N1 8EQ',
        lat:           51.5322,
        lng:           -0.1057,
        equipmentTags: ['free_weights', 'barbells', 'cables', 'treadmill', 'bikes'],
        rating:        4.1,
        ratingCount:   312,
      },
      {
        placesId:      'ChIJ_test_fitness4less_city',
        name:          'Fitness4Less City',
        address:       '61 Aldgate High St, London EC3N 1AL',
        lat:           51.5136,
        lng:           -0.0763,
        equipmentTags: ['free_weights', 'barbells', 'power_rack', 'cables', 'treadmill'],
        rating:        3.9,
        ratingCount:   187,
      },
      {
        placesId:      'ChIJ_test_calisthenics_shoreditch',
        name:          'Movement Shoreditch',
        address:       'Old St, London EC1V 9HX',
        lat:           51.5265,
        lng:           -0.0877,
        equipmentTags: ['pull_up_bars', 'dip_bars', 'rings', 'parallettes', 'free_weights'],
        rating:        4.6,
        ratingCount:   203,
      },
      {
        placesId:      'ChIJ_test_gym_soho',
        name:          'Third Space Soho',
        address:       '21 Sherwood St, London W1F 7ED',
        lat:           51.5108,
        lng:           -0.1350,
        equipmentTags: ['free_weights', 'barbells', 'cables', 'pool', 'treadmill', 'bikes'],
        rating:        4.5,
        ratingCount:   891,
      },
    ],
  })

  // Add price reports for a couple of gyms
  const puregym = await prisma.gym.findUnique({
    where: { placesId: 'ChIJ_test_puregym_angel' },
  })

  const movement = await prisma.gym.findUnique({
    where: { placesId: 'ChIJ_test_calisthenics_shoreditch' },
  })

  // We need a user to attach price reports to — create a seed user
  const seedUser = await prisma.user.upsert({
    where:  { clerkId: 'seed_user' },
    update: {},
    create: {
      clerkId: 'seed_user',
      email:   'seed@fitroam.dev',
    },
  })

 if (puregym) {
    const existing = await prisma.priceReport.findFirst({
      where: { gymId: puregym.id, reportedBy: seedUser.id },
    })
    if (!existing) {
      await prisma.priceReport.create({
        data: {
          gymId:        puregym.id,
          reportedBy:   seedUser.id,
          dayPassPence: 800,
          monthlyPence: 2499,
          verified:     true,
          visitedAt:    new Date('2026-04-01'),
        },
      })
    }
  }

  if (movement) {
    const existing = await prisma.priceReport.findFirst({
      where: { gymId: movement.id, reportedBy: seedUser.id },
    })
    if (!existing) {
      await prisma.priceReport.create({
        data: {
          gymId:        movement.id,
          reportedBy:   seedUser.id,
          dayPassPence: null,
          monthlyPence: 6500,
          verified:     true,
          visitedAt:    new Date('2026-04-10'),
        },
      })
    }
  }

  console.log('Done — gyms and price reports seeded.')
  await prisma.$disconnect()
}

seed().catch(async err => {
  console.error(err)
  await prisma.$disconnect()
  process.exit(1)
})