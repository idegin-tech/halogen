#!/usr/bin/env node

/**
 * Migration script to add verification tokens to existing projects
 * This ensures all projects have a verification token that can be used for domain verification
 *
 * Usage:
 *   node generate-project-tokens.js
 */

const mongoose = require("mongoose");
const crypto = require("crypto");
require("dotenv").config();

// Constants
const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://localhost:27017/halogen";
const VERIFICATION_TXT_NAME = "halogen-domain-verification";

// Generate a TXT record value
function generateVerificationToken() {
  const randomToken = crypto.randomBytes(32).toString("hex");
  return `${VERIFICATION_TXT_NAME}=${randomToken}`;
}

// Connect to MongoDB
mongoose
  .connect(MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => {
    console.error("MongoDB connection error:", err);
    process.exit(1);
  });

// Define the Project schema for this migration
const ProjectSchema = new mongoose.Schema({
  verificationToken: String,
  verificationTokenUpdatedAt: Date,
  project_id: String,
  name: String,
});

const Project = mongoose.model("Project", ProjectSchema);

// Main migration function
async function migrateProjects() {
  try {
    console.log("Starting verification token migration...");

    // Find all projects without a verification token
    const projects = await Project.find({
      $or: [
        { verificationToken: null },
        { verificationToken: { $exists: false } },
      ],
    });

    console.log(
      `Found ${projects.length} projects without verification tokens`
    );

    if (projects.length === 0) {
      console.log("No projects to migrate.");
      process.exit(0);
    }

    // Update each project with a verification token
    let updated = 0;
    for (const project of projects) {
      const token = generateVerificationToken(
        project.project_id || project._id.toString()
      );

      await Project.updateOne(
        { _id: project._id },
        {
          verificationToken: token,
          verificationTokenUpdatedAt: new Date(),
        }
      );

      console.log(
        `Updated project "${project.name}" (${project._id}) with token`
      );
      updated++;
    }

    console.log(
      `Successfully updated ${updated} projects with verification tokens`
    );
  } catch (error) {
    console.error("Error during migration:", error);
    process.exit(1);
  } finally {
    mongoose.connection.close();
  }
}

// Run the migration
migrateProjects();
