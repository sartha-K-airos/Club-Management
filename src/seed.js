// src/seed.js — Production database seeder for MITS StudentHub
// Retains ONLY the administrative credentials and foundation club charters
const bcrypt = require('bcryptjs');
const prisma = require('./lib/prisma');

async function seed() {
  console.log('🌱 Starting clean production database seeding...');

  try {
    // Clear existing data (in dependency order)
    console.log('Cleaning existing records...');
    await prisma.eventFeedback.deleteMany();
    await prisma.eventRegistration.deleteMany();
    await prisma.eventGallery.deleteMany();
    await prisma.resourcePerson.deleteMany();
    await prisma.eventReport.deleteMany();
    await prisma.announcement.deleteMany();
    await prisma.joinRequest.deleteMany();
    await prisma.clubHierarchy.deleteMany();
    await prisma.quarterlyReport.deleteMany();
    await prisma.event.deleteMany();
    await prisma.club.deleteMany();
    await prisma.user.deleteMany();
    await prisma.settings.deleteMany();

    const adminPassword = await bcrypt.hash('admin123', 12);

    // 1. Seed Institutional Settings
    console.log('Seeding institutional settings...');
    await prisma.settings.create({
      data: {
        id: 1,
        maintenanceMode: false,
        registrationOpen: true,
        collegeName: 'Madhav Institute of Technology & Science (MITS), Gwalior',
        data: JSON.stringify({
          siteName: 'MITS StudentHub',
          academicYear: '2026-27',
          contactEmail: 'clubs@mits.ac.in',
          allowClubCreation: true
        })
      }
    });

    // 2. Seed ONLY Super Admin Account (All other users register via Sign Up in production)
    console.log('Seeding Administrator account...');
    await prisma.user.create({
      data: {
        id: 1,
        name: 'Dr. Admin',
        email: 'admin@mits.edu',
        passwordHash: adminPassword,
        role: 'superadmin',
        department: 'Dean Student Welfare',
        rollNo: 'FACULTY-01',
        year: 'Faculty',
        phone: '+91 751 2409300',
        avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&q=80',
        clubMemberships: JSON.stringify([])
      }
    });

    // 3. Seed Official Clubs Foundation
    console.log('Seeding official club charters...');
    const clubsData = [
      {
        id: 101,
        name: 'The AI Club',
        code: 'AI_CLUB',
        category: 'Technology',
        members: 0,
        leaderId: null,
        leaderName: 'Unassigned',
        icon: 'https://ui-avatars.com/api/?name=AI&background=4a1c84&color=fff&bold=true',
        description: 'Exploring the frontier of Artificial Intelligence, Machine Learning, and Data Science. Build smart systems and compete in AI challenges.',
        status: 'active',
        budget: 50000
      },
      {
        id: 102,
        name: 'MITS CODE WAR',
        code: 'CODE_WAR',
        category: 'Technology',
        members: 0,
        leaderId: null,
        leaderName: 'Unassigned',
        icon: 'https://ui-avatars.com/api/?name=CW&background=1a1a2e&color=0ff&bold=true',
        description: 'Competitive programming battles, coding sprints, and algorithmic problem solving. Train hard, code harder.',
        status: 'active',
        budget: 65000
      },
      {
        id: 103,
        name: 'Webbers Club',
        code: 'WEBBERS',
        category: 'Technology',
        members: 0,
        leaderId: null,
        leaderName: 'Unassigned',
        icon: 'https://ui-avatars.com/api/?name=WC&background=11a096&color=fff&bold=true',
        description: 'Full-stack web development, UI/UX design, and modern frameworks. Build the web of tomorrow, today.',
        status: 'active',
        budget: 40000
      },
      {
        id: 104,
        name: 'ASIMOV (Robotics Club)',
        code: 'ASIMOV',
        category: 'Technology',
        members: 0,
        leaderId: null,
        leaderName: 'Unassigned',
        icon: 'https://ui-avatars.com/api/?name=RB&background=ff4757&color=fff&bold=true',
        description: 'Design, build and program robots for competitions. From line followers to autonomous bots — we build them all.',
        status: 'active',
        budget: 75000
      },
      {
        id: 115,
        name: 'Photography & Film Club',
        code: 'PHOTO_FILM',
        category: 'Arts',
        members: 0,
        leaderId: null,
        leaderName: 'Unassigned',
        icon: 'https://ui-avatars.com/api/?name=PF&background=6c5ce7&color=fff&bold=true',
        description: 'Visual storytelling through photography and filmmaking. From DSLRs to documentaries, we capture life.',
        status: 'active',
        budget: 30000
      },
      {
        id: 120,
        name: 'The Quiz Club',
        code: 'QUIZ_CLUB',
        category: 'Academic',
        members: 0,
        leaderId: null,
        leaderName: 'Unassigned',
        icon: 'https://ui-avatars.com/api/?name=QZ&background=0984e3&color=fff&bold=true',
        description: 'General knowledge, current affairs, and technical quizzes. Compete, learn, and become the ultimate quizzer.',
        status: 'active',
        budget: 20000
      }
    ];

    for (const c of clubsData) {
      await prisma.club.create({ data: c });
    }

    // 4. Seed Upcoming Campus Events
    console.log('Seeding upcoming events...');
    const eventsData = [
      {
        id: 201,
        title: 'MITS HackFest 2026',
        clubId: 102,
        clubName: 'MITS CODE WAR',
        date: '2026-11-10T09:00:00',
        venue: 'Main Auditorium & Computing Center',
        capacity: 120,
        image: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=800&q=80',
        description: '48-hour competitive hackathon open to all students. Build innovative full-stack solutions for real-world problems. Cash prizes worth ₹1 Lakh!',
        rsvps: JSON.stringify([]),
        isPaid: false,
        price: 0,
        status: 'upcoming'
      },
      {
        id: 202,
        title: 'AI & Generative Deep Dive',
        clubId: 101,
        clubName: 'The AI Club',
        date: '2026-11-05T14:00:00',
        venue: 'Seminar Hall 2, Dept. of CSE',
        capacity: 80,
        image: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800&q=80',
        description: 'Hands-on workshop exploring Large Language Models, Transformer architectures, and agentic workflows with industry experts.',
        rsvps: JSON.stringify([]),
        isPaid: true,
        price: 149,
        status: 'upcoming'
      },
      {
        id: 204,
        title: 'Full-Stack Modern Web Bootcamp',
        clubId: 103,
        clubName: 'Webbers Club',
        date: '2026-11-18T10:00:00',
        venue: 'Lab 4, Dept. of IT',
        capacity: 60,
        image: 'https://images.unsplash.com/photo-1593720213428-28a5b9e94613?w=800&q=80',
        description: 'Build and deploy production-ready modern web applications from scratch with Express, Prisma, Tailwind, and React.',
        rsvps: JSON.stringify([]),
        isPaid: true,
        price: 99,
        status: 'upcoming'
      }
    ];

    for (const e of eventsData) {
      await prisma.event.create({ data: e });
    }

    // 5. Seed Official Announcements
    console.log('Seeding initial announcement...');
    await prisma.announcement.create({
      data: {
        clubId: 102,
        clubName: 'MITS CODE WAR',
        title: 'Registrations Open for HackFest 2026',
        message: 'Registrations for MITS HackFest 2026 are now live! Students can register directly via the portal to receive their verified QR pass.',
        priority: 'high',
        author: 'Activity Cell'
      }
    });

    console.log('✅ Clean production seeding completed successfully!');
    console.log('Only Super Admin account retained:');
    console.log('  👑 Superadmin: admin@mits.edu / admin123');
    console.log('  All student and leader accounts will now be created via real Sign Up registrations.');
  } catch (error) {
    console.error('❌ Seeding error:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

seed();
