const MOCK_DATA = {
  users: [
    { id: 1, name: "Sarah J.", role: "student", avatar: "https://i.pravatar.cc/150?img=1" },
    { id: 2, name: "Prof. Alan", role: "advisor", avatar: "https://i.pravatar.cc/150?img=11" },
    { id: 3, name: "Admin Mark", role: "superadmin", avatar: "https://i.pravatar.cc/150?img=15" },
    { id: 4, name: "Alex R.", role: "club-leader", avatar: "https://i.pravatar.cc/150?img=33" }
  ],
  clubs: [
    { 
      id: 101, 
      name: "Computer Science Society", 
      logo: "https://ui-avatars.com/api/?name=CS&background=11a096&color=fff", 
      description: "A community for tech enthusiasts, coders, and innovators.",
      members: 120,
      leaderId: 4
    },
    { 
      id: 102, 
      name: "Debate Club", 
      logo: "https://ui-avatars.com/api/?name=DC&background=ff8c5f&color=fff", 
      description: "Discuss, debate, and develop your public speaking skills.",
      members: 45,
      leaderId: 2
    },
    { 
      id: 103, 
      name: "Photography Club", 
      logo: "https://ui-avatars.com/api/?name=PC&background=4a1c84&color=fff", 
      description: "Capture the world through your lens. Beginners and pros welcome.",
      members: 75,
      leaderId: null
    }
  ],
  events: [
    {
      id: 201,
      title: "Annual Hackathon 2026",
      clubId: 101,
      date: "2026-09-15T09:00:00",
      image: "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
      description: "Join us for 24 hours of coding, pizza, and prizes!"
    },
    {
      id: 202,
      title: "Model UN Prep Session",
      clubId: 102,
      date: "2026-08-25T17:00:00",
      image: "https://images.unsplash.com/photo-1521791055366-0d553872125f?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
      description: "Prepare for the upcoming regional Model UN conference."
    },
    {
      id: 203,
      title: "Campus Photo Walk",
      clubId: 103,
      date: "2026-08-20T16:00:00",
      image: "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
      description: "Explore the hidden gems of our campus."
    }
  ],
  joinRequests: [
    { id: 301, clubId: 101, studentId: 1, status: "pending", message: "I would love to learn more about AI!" }
  ]
};

// Simple utility to get club by ID
function getClubById(id) {
  return MOCK_DATA.clubs.find(c => c.id === id);
}

window.MOCK_DATA = MOCK_DATA;
window.getClubById = getClubById;
