/**
 * Migration script: read data from MongoDB and insert into MySQL via Sequelize models.
 * Usage: set MONGO_URI and MYSQL_* env vars in server/.env then run:
 * node scripts/migrateMongoToMySQL.js
 */

require('dotenv').config();
const { MongoClient } = require('mongodb');
const { sequelize, User, Job, Application, EmployerProfile, JobSeekerProfile, GeoJob, Worker } = require('../models');

async function migrate() {
  const mongoUri = process.env.MONGO_URI;
  if (!mongoUri) {
    console.error('MONGO_URI missing in env');
    process.exit(1);
  }

  const client = new MongoClient(mongoUri);

  try {
    await client.connect();
    console.log('Connected to MongoDB');
    const db = client.db();

    // Ensure MySQL tables exist
    await sequelize.sync({ alter: true });
    console.log('Ensured MySQL schema');

    const idMaps = {
      users: new Map(),
      jobs: new Map(),
      applications: new Map(),
      employerProfiles: new Map(),
      jobSeekerProfiles: new Map(),
      geoJobs: new Map(),
      workers: new Map()
    };

    // Users
    const users = await db.collection('users').find().toArray();
    for (const u of users) {
      const created = await User.create({
        name: u.name,
        email: u.email,
        password: u.password,
        phone: u.phone,
        role: u.role || 'jobseeker',
        isVerified: !!u.isVerified
      });
      idMaps.users.set(u._id.toString(), created.id);
    }
    console.log(`Migrated ${users.length} users`);

    // EmployerProfiles
    const employers = await db.collection('employerprofiles').find().toArray().catch(()=>[]);
    for (const e of employers) {
      const newUserId = idMaps.users.get(e.userId?.toString());
      const created = await EmployerProfile.create({
        userId: newUserId || null,
        companyName: e.companyName,
        companyLogo: e.companyLogo,
        website: e.website,
        description: e.description,
        location: e.location,
        industry: e.industry
      });
      idMaps.employerProfiles.set(e._id.toString(), created.id);
    }
    console.log(`Migrated ${employers.length} employer profiles`);

    // JobSeekerProfiles
    const seekers = await db.collection('jobseekerprofiles').find().toArray().catch(()=>[]);
    for (const s of seekers) {
      const newUserId = idMaps.users.get(s.userId?.toString());
      const created = await JobSeekerProfile.create({
        userId: newUserId || null,
        name: s.name,
        email: s.email,
        address: s.address,
        age: s.age,
        about: s.about,
        profilePhoto: s.profilePhoto,
        resume: s.resume,
        skills: s.skills || [],
        experience: s.experience || [],
        education: s.education || []
      });
      idMaps.jobSeekerProfiles.set(s._id.toString(), created.id);

      // savedJobs: create associations later after jobs migrated
    }
    console.log(`Migrated ${seekers.length} jobseeker profiles`);

    // Jobs
    const jobs = await db.collection('jobs').find().toArray();
    for (const j of jobs) {
      const newEmployerId = idMaps.users.get(j.employerId?.toString());
      const created = await Job.create({
        employerId: newEmployerId || null,
        title: j.title,
        companyName: j.companyName,
        description: j.description,
        requirements: j.requirements,
        category: j.category,
        jobType: j.jobType,
        salaryMin: j.salary?.min || null,
        salaryMax: j.salary?.max || null,
        salaryCurrency: j.salary?.currency || 'USD',
        location: j.location,
        address: j.address,
        experienceLevel: j.experienceLevel,
        postedDate: j.postedDate || null,
        deadline: j.deadline || null,
        status: j.status || 'active',
        removedByAdmin: !!j.removedByAdmin,
        removedReason: j.removedReason || ''
      });
      idMaps.jobs.set(j._id.toString(), created.id);
    }
    console.log(`Migrated ${jobs.length} jobs`);

    // GeoJobs
    const geoJobs = await db.collection('geojobs').find().toArray().catch(()=>[]);
    for (const g of geoJobs) {
      const point = g.location && g.location.coordinates ? { type: 'Point', coordinates: g.location.coordinates } : null;
      const created = await GeoJob.create({
        employerName: g.employerName,
        shopName: g.shopName,
        jobTypeNeeded: g.jobTypeNeeded,
        pay: g.pay,
        location: point,
        expiresAt: g.expiresAt
      });
      idMaps.geoJobs.set(g._id.toString(), created.id);
    }
    console.log(`Migrated ${geoJobs.length} geo jobs`);

    // Workers
    const workers = await db.collection('workers').find().toArray().catch(()=>[]);
    for (const w of workers) {
      const point = w.location && w.location.coordinates ? { type: 'Point', coordinates: w.location.coordinates } : null;
      const created = await Worker.create({
        name: w.name,
        phone: w.phone,
        jobType: w.jobType,
        location: point,
        isAvailable: !!w.isAvailable,
        availableUntil: w.availableUntil
      });
      idMaps.workers.set(w._id.toString(), created.id);
    }
    console.log(`Migrated ${workers.length} workers`);

    // Applications
    const applications = await db.collection('applications').find().toArray().catch(()=>[]);
    for (const a of applications) {
      const newJobId = idMaps.jobs.get(a.jobId?.toString());
      const newSeekerId = idMaps.users.get(a.jobSeekerId?.toString());
      const created = await Application.create({
        jobId: newJobId || null,
        jobSeekerId: newSeekerId || null,
        resume: a.resume,
        coverLetter: a.coverLetter,
        status: a.status || 'applied',
        appliedDate: a.appliedDate || null
      });
      idMaps.applications.set(a._id.toString(), created.id);
    }
    console.log(`Migrated ${applications.length} applications`);

    // Saved jobs associations (jobseekerprofiles.savedJobs)
    for (const s of seekers) {
      const profileNewId = idMaps.jobSeekerProfiles.get(s._id.toString());
      if (!profileNewId) continue;
      const profile = await JobSeekerProfile.findByPk(profileNewId);
      if (!profile) continue;
      const saved = s.savedJobs || [];
      for (const savedJobId of saved) {
        const newJobId = idMaps.jobs.get(savedJobId.toString());
        if (newJobId) {
          await profile.addSavedJob(newJobId);
        }
      }
    }

    console.log('Saved jobs associations migrated');

    console.log('Migration complete');
  } catch (err) {
    console.error('Migration error', err);
  } finally {
    await client.close();
    await sequelize.close();
    process.exit(0);
  }
}

migrate();
