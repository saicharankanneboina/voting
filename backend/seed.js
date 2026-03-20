const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const dotenv = require("dotenv");

dotenv.config();

const User = require("./models/User");
const Election = require("./models/Election");
const Candidate = require("./models/Candidate");
const Vote = require("./models/Vote");

async function seed() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);

    await Promise.all([
      User.deleteMany({}),
      Election.deleteMany({}),
      Candidate.deleteMany({}),
      Vote.deleteMany({})
    ]);

    const adminPassword = await bcrypt.hash("Admin@123", 10);
    const voterPassword = await bcrypt.hash("Voter@123", 10);

    const [activeElection, upcomingElection, endedElection] = await Election.create([
      {
        title: "National Youth Council Election",
        description: "Vote for the next council leadership with a transparent digital ballot.",
        date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
        type: "General",
        status: "Active"
      },
      {
        title: "City Development Board Poll",
        description: "Upcoming local body election focused on civic planning and development.",
        date: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
        type: "Local",
        status: "Upcoming"
      },
      {
        title: "University Senate Election",
        description: "Finalized results for the annual university senate representative vote.",
        date: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000),
        type: "University",
        status: "Ended"
      }
    ]);

    const [admin, voter, pendingVoter] = await User.create([
      {
        fullName: "System Administrator",
        email: "admin@smartvote.com",
        phone: "9000000001",
        dob: new Date("1988-03-15"),
        age: 38,
        gender: "male",
        password: adminPassword,
        role: "admin",
        isVerified: true
      },
      {
        fullName: "Priya Verma",
        email: "voter@smartvote.com",
        phone: "9000000002",
        dob: new Date("2001-08-21"),
        age: 24,
        gender: "female",
        password: voterPassword,
        role: "voter",
        electionId: activeElection._id,
        isVerified: true
      },
      {
        fullName: "Rahul Nair",
        email: "pending@smartvote.com",
        phone: "9000000003",
        dob: new Date("2000-01-09"),
        age: 25,
        gender: "male",
        password: voterPassword,
        role: "voter",
        electionId: upcomingElection._id,
        isVerified: false
      }
    ]);

    const activeCandidates = await Candidate.create([
      {
        name: "Ananya Rao",
        party: "Forward Future Alliance",
        symbol: "/images/ffa-symbol.svg",
        electionId: activeElection._id,
        votes: 0
      },
      {
        name: "Kabir Sharma",
        party: "People First Movement",
        symbol: "/images/pfm-symbol.svg",
        electionId: activeElection._id,
        votes: 0
      },
      {
        name: "Meera Patel",
        party: "Unity Reform Party",
        symbol: "/images/urp-symbol.svg",
        electionId: activeElection._id,
        votes: 0
      }
    ]);

    await Candidate.create([
      {
        name: "Riya Menon",
        party: "Civic Progress Front",
        symbol: "/images/cpf-symbol.svg",
        electionId: upcomingElection._id,
        votes: 0
      },
      {
        name: "Arjun Das",
        party: "Neighborhood Growth League",
        symbol: "/images/ngl-symbol.svg",
        electionId: upcomingElection._id,
        votes: 0
      },
      {
        name: "Neha Iyer",
        party: "Campus Voice Union",
        symbol: "/images/cvu-symbol.svg",
        electionId: endedElection._id,
        votes: 45
      },
      {
        name: "Samar Khanna",
        party: "Student Impact Forum",
        symbol: "/images/sif-symbol.svg",
        electionId: endedElection._id,
        votes: 38
      }
    ]);

    console.log("Seed complete.");
    console.log("Admin:", admin.email, "password: Admin@123");
    console.log("Verified voter:", voter.email, "password: Voter@123");
    console.log("Pending voter:", pendingVoter.email, "password: Voter@123");
    console.log("Active election sample candidate:", activeCandidates[0].name);
  } catch (error) {
    console.error("Seed failed:", error.message);
  } finally {
    await mongoose.connection.close();
  }
}

seed();
