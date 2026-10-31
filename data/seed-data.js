// data/seed-data.js — Full MITS Club & Society seed data (Upgraded with 9 new feature models)

const SEED_DATA = {
  settings: {
    allowClubCreation: true,
    maintenanceMode: false,
    siteName: "MITS StudentHub",
    academicYear: "2026-27"
  },

  users: [
    // Students
    { id: 1,  name: "Priya Sharma",     email: "priya@mits.edu",    password: "password123", role: "student",     avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&q=80",  rollNo: "0901CS221045", department: "Computer Science", year: "3rd Year", phone: "+91 98261 45890", clubMemberships: [101, 108] },
    { id: 2,  name: "Rahul Verma",      email: "rahul@mits.edu",    password: "password123", role: "student",     avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&q=80",  rollNo: "0901IT221082", department: "Information Tech", year: "3rd Year", phone: "+91 98932 78120", clubMemberships: [103, 115] },
    { id: 3,  name: "Ananya Singh",     email: "ananya@mits.edu",   password: "password123", role: "student",     avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&q=80",  rollNo: "0901EC231012", department: "Electronics Eng.", year: "2nd Year", phone: "+91 94251 33451", clubMemberships: [106] },
    { id: 4,  name: "Dev Patel",        email: "dev@mits.edu",      password: "password123", role: "student",     avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&q=80",  rollNo: "0901ME221034", department: "Mechanical Eng.",  year: "3rd Year", phone: "+91 97521 89012", clubMemberships: [104] },
    { id: 5,  name: "Sneha Gupta",      email: "sneha@mits.edu",    password: "password123", role: "student",     avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&q=80",  rollNo: "0901EE231055", department: "Electrical Eng.",  year: "2nd Year", phone: "+91 91114 56789", clubMemberships: [112, 120] },
    // Club Leaders
    { id: 10, name: "Arjun Mehta",      email: "leader@mits.edu",   password: "password123", role: "club-leader", avatar: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&q=80",  rollNo: "0901CS211029", department: "Computer Science", year: "4th Year", phone: "+91 98270 12345", clubMemberships: [101] },
    { id: 11, name: "Kavya Reddy",      email: "kavya@mits.edu",    password: "password123", role: "club-leader", avatar: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=150&q=80",  rollNo: "0901IT211060", department: "Information Tech", year: "4th Year", phone: "+91 98260 54321", clubMemberships: [102] },
    { id: 12, name: "Rohan Das",        email: "rohan@mits.edu",    password: "password123", role: "club-leader", avatar: "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150&q=80",  rollNo: "0901EC211075", department: "Electronics Eng.", year: "4th Year", phone: "+91 94065 99887", clubMemberships: [103] },
    // Super Admin
    { id: 20, name: "Dr. Admin",        email: "admin@mits.edu",    password: "password123", role: "superadmin",  avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&q=80",  rollNo: "FACULTY-01",   department: "Dean Student Welfare", year: "Faculty", phone: "+91 751 2409300", clubMemberships: [] },
    { id: 21, name: "Prof. Coordinator",email: "coord@mits.edu",    password: "password123", role: "superadmin",  avatar: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150&q=80",  rollNo: "FACULTY-02",   department: "Club Activity Cell",   year: "Faculty", phone: "+91 751 2409301", clubMemberships: [] }
  ],

  clubs: [
    { id: 101, name: "The AI Club",                    category: "Technology",   members: 134, leaderId: 10, logo: "https://ui-avatars.com/api/?name=AI&background=4a1c84&color=fff&bold=true",  description: "Exploring the frontier of Artificial Intelligence, Machine Learning, and Data Science. Build smart systems and compete in AI challenges.",  status: "active", createdAt: "2023-07-01", budget: 50000 },
    { id: 102, name: "MITS CODE WAR",                  category: "Technology",   members: 210, leaderId: 11, logo: "https://ui-avatars.com/api/?name=CW&background=1a1a2e&color=0ff&bold=true",  description: "Competitive programming battles, coding sprints, and algorithmic problem solving. Train hard, code harder.",                                   status: "active", createdAt: "2022-08-15", budget: 65000 },
    { id: 103, name: "Webbers Club",                   category: "Technology",   members: 98,  leaderId: 12, logo: "https://ui-avatars.com/api/?name=WC&background=11a096&color=fff&bold=true",  description: "Full-stack web development, UI/UX design, and modern frameworks. Build the web of tomorrow, today.",                                          status: "active", createdAt: "2023-01-10", budget: 40000 },
    { id: 104, name: "ASIMOV (Robotics Club)",         category: "Technology",   members: 76,  leaderId: 10, logo: "https://ui-avatars.com/api/?name=RB&background=ff4757&color=fff&bold=true",  description: "Design, build and program robots for competitions. From line followers to autonomous bots — we build them all.",                              status: "active", createdAt: "2022-03-05", budget: 75000 },
    { id: 105, name: "IOT Internet of Things",         category: "Technology",   members: 65,  leaderId: 11, logo: "https://ui-avatars.com/api/?name=IOT&background=2ed573&color=fff&bold=true", description: "Connect the physical world to the digital. Sensors, microcontrollers, cloud platforms, and smart systems.",                                  status: "active", createdAt: "2023-04-20", budget: 35000 },
    { id: 106, name: "Aerospace Club",                 category: "Technology",   members: 54,  leaderId: 12, logo: "https://ui-avatars.com/api/?name=AE&background=1e90ff&color=fff&bold=true",  description: "Aviation, rocketry, drone technology, and space exploration. Aim for the stars — literally.",                                                status: "active", createdAt: "2023-06-01", budget: 45000 },
    { id: 115, name: "Photography & Film Club",        category: "Arts",         members: 96,  leaderId: 12, logo: "https://ui-avatars.com/api/?name=PF&background=6c5ce7&color=fff&bold=true",  description: "Visual storytelling through photography and filmmaking. From DSLRs to documentaries, we capture life.",                                       status: "active", createdAt: "2022-05-01", budget: 30000 },
    { id: 116, name: "Dance Club",                     category: "Arts",         members: 112, leaderId: 10, logo: "https://ui-avatars.com/api/?name=DC&background=e84393&color=fff&bold=true",  description: "Classical, contemporary, and fusion dance forms. Perform on stage, express through movement.",                                               status: "active", createdAt: "2021-11-10", budget: 25000 },
    { id: 120, name: "The Quiz Club",                  category: "Academic",     members: 73,  leaderId: 11, logo: "https://ui-avatars.com/api/?name=QZ&background=0984e3&color=fff&bold=true",  description: "General knowledge, current affairs, and technical quizzes. Compete, learn, and become the ultimate quizzer.", status: "active", createdAt: "2022-03-01", budget: 20000 },
    { id: 127, name: "TEDx Club",                      category: "Academic",     members: 93,  leaderId: 12, logo: "https://ui-avatars.com/api/?name=TX&background=e74c3c&color=fff&bold=true",  description: "Organizing TEDx MITS events — curating talks, speakers, and ideas worth spreading on campus.",           status: "active", createdAt: "2023-01-01", budget: 120000 }
  ],

  events: [
    {
      id: 201,
      title: "MITS HackFest 2026",
      clubId: 102,
      date: "2026-11-10T09:00:00",
      venue: "Main Auditorium & Computing Center",
      capacity: 120,
      image: "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=800&q=80",
      description: "48-hour competitive hackathon open to all students. Build innovative full-stack solutions for real-world problems. Cash prizes worth ₹1 Lakh!",
      rsvps: [1, 2, 4],
      isPaid: false,
      price: 0,
      createdAt: "2026-10-01"
    },
    {
      id: 202,
      title: "AI & Generative Deep Dive",
      clubId: 101,
      date: "2026-11-05T14:00:00",
      venue: "Seminar Hall 2, Dept. of CSE",
      capacity: 80,
      image: "https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800&q=80",
      description: "Hands-on workshop exploring Large Language Models, Transformer architectures, and agentic workflows with industry experts.",
      rsvps: [1, 3, 5],
      isPaid: true,
      price: 149,
      createdAt: "2026-10-05"
    },
    {
      id: 203,
      title: "Campus Photo Walk & Framing Workshop",
      clubId: 115,
      date: "2026-10-15T06:30:00",
      venue: "MITS Heritage Courtyard & Botanical Garden",
      capacity: 40,
      image: "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=800&q=80",
      description: "Golden hour photography session guided by professional photographers. Master framing, rule of thirds, and street portraits.",
      rsvps: [2, 5],
      isPaid: false,
      price: 0,
      createdAt: "2026-09-25"
    },
    {
      id: 204,
      title: "TEDx MITS: Horizons of Tomorrow",
      clubId: 127,
      date: "2026-10-20T10:00:00",
      venue: "Silver Jubilee Auditorium",
      capacity: 250,
      image: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&q=80",
      description: "The annual TEDx conference featuring 6 visionary thinkers, researchers, and entrepreneurs discussing cutting-edge ideas.",
      rsvps: [1, 2, 3, 4, 5],
      isPaid: true,
      price: 299,
      createdAt: "2026-09-20"
    }
  ],

  // 1. Post-Event Reports submitted to SuperAdmin
  eventReports: [
    {
      id: 501,
      eventId: 203,
      clubId: 115,
      submittedBy: 12,
      submittedByName: "Rohan Das",
      eventTitle: "Campus Photo Walk & Framing Workshop",
      conductedDate: "2026-10-15",
      venue: "MITS Heritage Courtyard & Botanical Garden",
      attendanceCount: 38,
      registeredCount: 40,
      budgetSpent: 4200,
      guestExperts: "Vikram Sengupta (National Geographic Contributor)",
      summary: "A 3-hour immersive photography workshop covering manual exposure control, compositional depth, and architectural preservation.",
      objectivesAchieved: "1. 38 students successfully learned shutter priority and RAW processing.\n2. Over 150 curated photographs submitted to college media archive.",
      keyOutcomes: "Top 3 participant photo entries were selected for the annual college calendar exhibition.",
      status: "approved",
      superAdminRemarks: "Commendable turnout. Excellent utilization of campus outdoor spaces. Approved for record.",
      submittedAt: "2026-10-16T11:30:00"
    },
    {
      id: 502,
      eventId: 204,
      clubId: 127,
      submittedBy: 12,
      submittedByName: "Rohan Das",
      eventTitle: "TEDx MITS: Horizons of Tomorrow",
      conductedDate: "2026-10-20",
      venue: "Silver Jubilee Auditorium",
      attendanceCount: 232,
      registeredCount: 250,
      budgetSpent: 52000,
      guestExperts: "Dr. Sunita Rao (ISRO Scientist), Aman Gupta (Founder, EcoEnergy)",
      summary: "Full-day TEDx conference with 6 national speakers, engaging over 230 students and faculty across disciplines.",
      objectivesAchieved: "Disseminated student innovations, held live panel discussion on clean tech, and recorded high-definition talks for TEDx Global platform.",
      keyOutcomes: "All 6 recorded videos submitted to TEDx headquarters for YouTube indexing.",
      status: "submitted",
      superAdminRemarks: "Under review by Dean Student Welfare.",
      submittedAt: "2026-10-22T16:00:00"
    }
  ],

  // 2. Dedicated Event Registrations & 3. Live Attendance System
  eventRegistrations: [
    {
      id: 601,
      eventId: 202,
      studentId: 1,
      studentName: "Priya Sharma",
      studentEmail: "priya@mits.edu",
      rollNo: "0901CS221045",
      branch: "Computer Science & Engineering",
      year: "3rd Year",
      phone: "+91 98261 45890",
      expectations: "Want to understand practical implementation of LLM fine-tuning and agent memory architectures.",
      registrationCode: "REG-202-8812",
      isPaid: true,
      amountPaid: 149,
      paymentStatus: "PAID",
      transactionId: "TXN-MITS-2026-8812",
      paymentMethod: "UPI (GPay)",
      registeredAt: "2026-10-06T10:15:00",
      attended: true,
      attendedAt: "2026-11-05T13:45:00"
    },
    {
      id: 602,
      eventId: 202,
      studentId: 3,
      studentName: "Ananya Singh",
      studentEmail: "ananya@mits.edu",
      rollNo: "0901EC231012",
      branch: "Electronics & Communication",
      year: "2nd Year",
      phone: "+91 94251 33451",
      expectations: "Interested in edge AI deployment on embedded platforms like Jetson Nano.",
      registrationCode: "REG-202-3914",
      isPaid: true,
      amountPaid: 149,
      paymentStatus: "PAID",
      transactionId: "TXN-MITS-2026-3914",
      paymentMethod: "Card (•••• 4242)",
      registeredAt: "2026-10-07T12:00:00",
      attended: true,
      attendedAt: "2026-11-05T13:52:00"
    },
    {
      id: 603,
      eventId: 202,
      studentId: 5,
      studentName: "Sneha Gupta",
      studentEmail: "sneha@mits.edu",
      rollNo: "0901EE231055",
      branch: "Electrical Engineering",
      year: "2nd Year",
      phone: "+91 91114 56789",
      expectations: "Looking to integrate smart grid predictive algorithms with neural networks.",
      registrationCode: "REG-202-7721",
      isPaid: true,
      amountPaid: 149,
      paymentStatus: "PAID",
      transactionId: "TXN-MITS-2026-7721",
      paymentMethod: "NetBanking (SBI)",
      registeredAt: "2026-10-08T15:30:00",
      attended: false,
      attendedAt: null
    },
    {
      id: 604,
      eventId: 201,
      studentId: 1,
      studentName: "Priya Sharma",
      studentEmail: "priya@mits.edu",
      rollNo: "0901CS221045",
      branch: "Computer Science & Engineering",
      year: "3rd Year",
      phone: "+91 98261 45890",
      expectations: "Building an AI-driven healthcare diagnosis triage application with my team.",
      registrationCode: "REG-201-1049",
      isPaid: false,
      amountPaid: 0,
      paymentStatus: "FREE",
      transactionId: "FREE-ENTRY",
      paymentMethod: "Free Registration",
      registeredAt: "2026-10-02T11:20:00",
      attended: false,
      attendedAt: null
    },
    {
      id: 605,
      eventId: 201,
      studentId: 2,
      studentName: "Rahul Verma",
      studentEmail: "rahul@mits.edu",
      rollNo: "0901IT221082",
      branch: "Information Technology",
      year: "3rd Year",
      phone: "+91 98932 78120",
      expectations: "Developing a decentralized document verification portal using zero-knowledge proofs.",
      registrationCode: "REG-201-5521",
      registeredAt: "2026-10-02T14:40:00",
      attended: false,
      attendedAt: null
    }
  ],

  // 4. Resource Persons & Invited Experts Information
  resourcePersons: [
    {
      id: 701,
      clubId: 101,
      eventId: 202,
      name: "Dr. Aris Thorne",
      title: "Senior AI Research Scientist",
      organization: "Google DeepMind / AI Institute",
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&q=80",
      bio: "Ph.D. in Computer Vision from Carnegie Mellon. Specializes in Transformer interpretability and multi-agent systems.",
      expertise: "Generative AI, Large Language Models, Multi-Agent Systems",
      email: "aris.thorne@deepmind-alumni.org",
      linkedin: "https://linkedin.com/in/aris-thorne-ai",
      addedAt: "2026-10-04"
    },
    {
      id: 702,
      clubId: 115,
      eventId: 203,
      name: "Vikram Sengupta",
      title: "Documentary Visual Storyteller & Cinematographer",
      organization: "National Geographic Creative Collective",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&q=80",
      bio: "Over 14 years of experience documenting endangered tribal arts across India. Recipient of Golden Lens Photography Award 2024.",
      expertise: "Composition, Natural Light Framing, Documentary Storytelling",
      email: "vikram@senguptastudio.in",
      linkedin: "https://linkedin.com/in/vikram-sengupta-visuals",
      addedAt: "2026-09-28"
    },
    {
      id: 703,
      clubId: 127,
      eventId: 204,
      name: "Dr. Sunita Rao",
      title: "Senior Mission Director (Retd.)",
      organization: "ISRO Satellite Centre",
      avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&q=80",
      bio: "Instrumental in Mars Orbiter Mission payload telemetry. Passionate educator inspiring young engineers toward space research.",
      expertise: "Aerospace Systems, Satellite Telemetry, Mission Design",
      email: "dr.sunitarao@isro-alumni.in",
      linkedin: "https://linkedin.com/in/dr-sunita-rao-space",
      addedAt: "2026-09-20"
    }
  ],

  // 5. Glimpses of Events (Photo Gallery)
  eventGallery: [
    {
      id: 801,
      clubId: 101,
      eventId: 202,
      imageUrl: "https://images.unsplash.com/photo-1531482615713-2afd69097998?w=800&q=80",
      caption: "Interactive Q&A session with students during the Generative AI live coding demo.",
      tag: "Live Workshop",
      uploadedBy: 10,
      uploadedAt: "2026-11-05"
    },
    {
      id: 802,
      clubId: 101,
      eventId: 202,
      imageUrl: "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=800&q=80",
      caption: "Teams collaborating on fine-tuning open-source LLMs in the Computer Science Lab.",
      tag: "Hands-on Lab",
      uploadedBy: 10,
      uploadedAt: "2026-11-05"
    },
    {
      id: 803,
      clubId: 115,
      eventId: 203,
      imageUrl: "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=800&q=80",
      caption: "Early morning framing drills at the MITS historic library courtyard.",
      tag: "Photo Walk",
      uploadedBy: 12,
      uploadedAt: "2026-10-15"
    },
    {
      id: 804,
      clubId: 115,
      eventId: 203,
      imageUrl: "https://images.unsplash.com/photo-1552664730-d307ca884978?w=800&q=80",
      caption: "Critique session: Reviewing participant photo submissions with mentor Vikram Sengupta.",
      tag: "Mentorship",
      uploadedBy: 12,
      uploadedAt: "2026-10-15"
    },
    {
      id: 805,
      clubId: 127,
      eventId: 204,
      imageUrl: "https://images.unsplash.com/photo-1475721027785-f74eccf877e2?w=800&q=80",
      caption: "Keynote address on 'Engineering with Purpose' at the TEDx MITS Main Stage.",
      tag: "Keynote Talk",
      uploadedBy: 12,
      uploadedAt: "2026-10-20"
    },
    {
      id: 806,
      clubId: 102,
      eventId: 201,
      imageUrl: "https://images.unsplash.com/photo-1515187029135-18ee286d815b?w=800&q=80",
      caption: "Midnight sprint: Hackathon participants brainstorming algorithmic optimizations.",
      tag: "Hackathon",
      uploadedBy: 11,
      uploadedAt: "2026-10-02"
    }
  ],

  // 6. Club Leadership Hierarchy / Post Section (President, VP, Secretary, etc.)
  clubHierarchy: [
    // Club 101: The AI Club
    {
      id: 901,
      clubId: 101,
      studentId: 10,
      name: "Arjun Mehta",
      position: "President",
      order: 1,
      department: "Computer Science & Engineering",
      year: "4th Year",
      avatar: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=200&q=80",
      bio: "Specializing in deep learning and NLP. Published 2 IEEE conference papers. Leads club vision and external tie-ups.",
      email: "arjun.m@mits.edu",
      linkedin: "https://linkedin.com/in/arjun-mehta-ai"
    },
    {
      id: 902,
      clubId: 101,
      studentId: 1,
      name: "Priya Sharma",
      position: "Vice President",
      order: 2,
      department: "Computer Science & Engineering",
      year: "3rd Year",
      avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&q=80",
      bio: "Oversees hands-on workshop design and student research mentorship circles. Kaggle 3x Notebooks Expert.",
      email: "priya@mits.edu",
      linkedin: "https://linkedin.com/in/priya-sharma-cs"
    },
    {
      id: 903,
      clubId: 101,
      studentId: 2,
      name: "Tanya Kapoor",
      position: "Secretary",
      order: 3,
      department: "Information Technology",
      year: "3rd Year",
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&q=80",
      bio: "Manages club administrative documentation, event clearance approvals, and inter-department coordination.",
      email: "tanya.k@mits.edu",
      linkedin: "https://linkedin.com/in/tanya-kapoor-it"
    },
    {
      id: 904,
      clubId: 101,
      studentId: 4,
      name: "Dev Patel",
      position: "Treasurer",
      order: 4,
      department: "Mechanical Engineering",
      year: "3rd Year",
      avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&q=80",
      bio: "In charge of annual sponsorship procurement, project hardware budget tracking, and event finance reports.",
      email: "dev@mits.edu",
      linkedin: "https://linkedin.com/in/dev-patel-mits"
    },
    {
      id: 905,
      clubId: 101,
      studentId: 3,
      name: "Karan Johal",
      position: "Technical Head",
      order: 5,
      department: "Electronics Engineering",
      year: "3rd Year",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&q=80",
      bio: "Manages AI GPU server racks, leads competition team selections, and runs weekly algorithm study jams.",
      email: "karan.j@mits.edu",
      linkedin: "https://linkedin.com/in/karan-johal"
    },

    // Club 102: MITS CODE WAR
    {
      id: 911,
      clubId: 102,
      studentId: 11,
      name: "Kavya Reddy",
      position: "President",
      order: 1,
      department: "Information Technology",
      year: "4th Year",
      avatar: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=200&q=80",
      bio: "Candidate Master on Codeforces (Rating 1940). ICPC Regionalist 2025. Coordinates weekly algorithmic contests.",
      email: "kavya@mits.edu",
      linkedin: "https://linkedin.com/in/kavya-reddy-cw"
    },
    {
      id: 912,
      clubId: 102,
      studentId: 5,
      name: "Sneha Gupta",
      position: "Vice President",
      order: 2,
      department: "Electrical Engineering",
      year: "3rd Year",
      avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=200&q=80",
      bio: "Leads problem-setting panels, junior mentoring clinics, and annual MITS HackFest logistics.",
      email: "sneha@mits.edu",
      linkedin: "https://linkedin.com/in/sneha-gupta-cw"
    }
  ],

  // 7. Enhanced Join Requests with detailed reason, skills & contributions
  joinRequests: [
    {
      id: 301,
      clubId: 101,
      studentId: 4,
      studentName: "Dev Patel",
      studentEmail: "dev@mits.edu",
      rollNo: "0901ME221034",
      department: "Mechanical Engineering",
      year: "3rd Year",
      phone: "+91 97521 89012",
      reason: "I am passionate about combining mechanical robotics with autonomous perception models.",
      skills: "Python, ROS2 basics, SolidWorks, Arduino, kinematics modeling.",
      contributions: "Can build custom robotic chassis for the AI club's autonomous rover challenge.",
      status: "pending",
      createdAt: "2026-10-24"
    },
    {
      id: 302,
      clubId: 103,
      studentId: 5,
      studentName: "Sneha Gupta",
      studentEmail: "sneha@mits.edu",
      rollNo: "0901EE231055",
      department: "Electrical Engineering",
      year: "2nd Year",
      phone: "+91 91114 56789",
      reason: "I want to transition from basic web design to full-stack cloud-native web engineering.",
      skills: "HTML/CSS, JavaScript, TailwindCSS, learning Node.js and MongoDB.",
      contributions: "Help design responsive frontend interfaces for college department portals.",
      status: "pending",
      createdAt: "2026-10-25"
    },
    {
      id: 303,
      clubId: 101,
      studentId: 3,
      studentName: "Ananya Singh",
      studentEmail: "ananya@mits.edu",
      rollNo: "0901EC231012",
      department: "Electronics Engineering",
      year: "2nd Year",
      phone: "+91 94251 33451",
      reason: "Eager to explore neural signal processing and Edge AI algorithms on low-power silicon.",
      skills: "C++, Python, MATLAB, PyTorch basics, circuit prototyping.",
      contributions: "Lead hardware-software integration workshops for junior club inductees.",
      status: "approved",
      createdAt: "2026-10-18"
    }
  ],

  // 8. Event Feedback given by students
  eventFeedback: [
    {
      id: 1001,
      eventId: 202,
      clubId: 101,
      studentId: 1,
      studentName: "Priya Sharma",
      ratingOverall: 5,
      ratingSpeaker: 5,
      ratingOrganization: 4,
      ratingRelevance: 5,
      comments: "Exceptional depth! Dr. Thorne explained multi-agent orchestration with clean live diagrams. The lab exercises were top tier.",
      suggestions: "Would love a follow-up 2-day hands-on hackathon dedicated specifically to autonomous agent evaluation.",
      submittedAt: "2026-11-05T17:30:00"
    },
    {
      id: 1002,
      eventId: 202,
      clubId: 101,
      studentId: 3,
      studentName: "Ananya Singh",
      ratingOverall: 4,
      ratingSpeaker: 5,
      ratingOrganization: 4,
      ratingRelevance: 5,
      comments: "The workshop bridged high-level theory with runnable Jupyter notebooks seamlessly.",
      suggestions: "Please share GPU cluster compute vouchers beforehand so everyone can execute models simultaneously.",
      submittedAt: "2026-11-05T18:15:00"
    },
    {
      id: 1003,
      eventId: 203,
      clubId: 115,
      studentId: 2,
      studentName: "Rahul Verma",
      ratingOverall: 5,
      ratingSpeaker: 5,
      ratingOrganization: 5,
      ratingRelevance: 4,
      comments: "Loved the framing critique in the botanical garden! Mentors took time to personally review everyone's shot angles.",
      suggestions: "More photo walk sessions in night and low-light urban settings.",
      submittedAt: "2026-10-15T12:00:00"
    }
  ],

  // 9. Three-Month (Quarterly) Club Performance Reports
  quarterlyReports: [
    {
      id: 1101,
      clubId: 101,
      quarter: "Q1 (July - September 2026)",
      academicYear: "2026-2027",
      submittedBy: 10,
      submittedByName: "Arjun Mehta (President)",
      eventsConducted: 4,
      totalFootfall: 310,
      newMembersJoined: 42,
      budgetAllocated: 25000,
      budgetUtilized: 21400,
      guestSpeakersCount: 3,
      executiveSummary: "Q1 focused on foundation building for inductees, running weekly Python & ML study tracks, and hosting guest lectures from prominent alumni in AI.",
      keyAchievements: "1. 42 new members successfully cleared the induction challenge.\n2. Hosted 3 high-impact technical workshops with zero budget overruns.\n3. Formed 4 dedicated research teams for upcoming Smart India Hackathon.",
      challengesFaced: "GPU compute resource constraints in Lab 3 during peak attendance sessions.",
      planNextQuarter: "Launch MITS Generative AI Summit in Q2 and deploy two production apps for student campus navigation.",
      status: "approved",
      superAdminFeedback: "Outstanding quarterly performance. Additional compute grant of ₹15,000 sanctioned for Q2.",
      submittedAt: "2026-10-02T10:00:00"
    },
    {
      id: 1102,
      clubId: 102,
      quarter: "Q1 (July - September 2026)",
      academicYear: "2026-2027",
      submittedBy: 11,
      submittedByName: "Kavya Reddy (President)",
      eventsConducted: 6,
      totalFootfall: 480,
      newMembersJoined: 65,
      budgetAllocated: 30000,
      budgetUtilized: 26800,
      guestSpeakersCount: 2,
      executiveSummary: "Conducted bi-weekly contest leagues, weekly DSA drills, and finalized logistics for the national-level MITS HackFest 2026.",
      keyAchievements: "1. Over 180 active students participating in weekly leaderboard contests.\n2. Secured industry sponsorship worth ₹50,000 for upcoming hackathon.",
      challengesFaced: "Contest server downtime during heavy traffic round on Codeforces platform.",
      planNextQuarter: "Host flagship HackFest 2026 with 48-hour overnight mentorship track.",
      status: "approved",
      superAdminFeedback: "Impressive contest engagement. Well organized. Keep up the high standard.",
      submittedAt: "2026-10-05T14:30:00"
    }
  ],

  announcements: [
    { id: 401, clubId: 101, message: "🚨 AI Workshop seats filling up fast! Register before Nov 3. Check the events tab.", createdAt: "2026-10-26" },
    { id: 402, clubId: 102, message: "📢 HackFest team registration portal is now open. Form teams of 2-4 members.", createdAt: "2026-10-25" },
    { id: 403, clubId: 103, message: "💻 Next Webbers meeting: Nov 2, 5PM at Lab 204. We'll be reviewing project submissions.", createdAt: "2026-10-24" },
    { id: 404, clubId: 127, message: "🎤 TEDx MITS highlights and photo glimpses have been published in the gallery!", createdAt: "2026-10-23" }
  ]
};

window.SEED_DATA = SEED_DATA;
