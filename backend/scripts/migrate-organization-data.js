require('dotenv').config();
const mongoose = require('mongoose');
const Organization = require('../models/organization-model');
const User = require('../models/user-model');
const Visitor = require('../models/visitor-model');
const Appointment = require('../models/appointment-model');
const Pass = require('../models/pass-model');
const CheckLog = require('../models/check-log-model');

const models = {
  users: User,
  visitors: Visitor,
  appointments: Appointment,
  passes: Pass,
  checkLogs: CheckLog,
};

const migrationOrganization = {
  name: 'Legacy Data Migration Organization',
  slug: 'legacy-data-migration',
  type: 'other',
  email: 'legacy-migration@invalid.local',
  status: 'active',
};

const nodeKey = (type, id) => `${type}:${id}`;

const addEdge = (graph, left, right) => {
  if (!left || !right || !graph.has(left) || !graph.has(right)) return;
  graph.get(left).add(right);
  graph.get(right).add(left);
};

const getOrganizationId = (record) => (
  record.organizationId ? String(record.organizationId) : null
);

const findComponents = (graph) => {
  const visited = new Set();
  const components = [];

  for (const key of graph.keys()) {
    if (visited.has(key)) continue;
    const component = [];
    const queue = [key];
    visited.add(key);
    while (queue.length) {
      const current = queue.shift();
      component.push(current);
      for (const neighbor of graph.get(current)) {
        if (!visited.has(neighbor)) {
          visited.add(neighbor);
          queue.push(neighbor);
        }
      }
    }
    components.push(component);
  }
  return components;
};

const run = async () => {
  if (!process.env.URL) throw new Error('Set URL in backend/.env before running this migration.');

  const { setServers } = require("node:dns");
  setServers(["8.8.8.8", "1.1.1.1"]);

  await mongoose.connect(process.env.URL);

  const records = {};
  let legacyCount = 0;
  for (const [type, Model] of Object.entries(models)) {
    records[type] = await Model.find().select('+organizationId').lean();
    legacyCount += records[type].filter((record) => !record.organizationId).length;
  }

  if (!legacyCount) {
    console.log('No legacy records require organization migration. Nothing changed.');
    return;
  }

  const graph = new Map();
  const recordByKey = new Map();
  for (const [type, items] of Object.entries(records)) {
    for (const record of items) {
      const key = nodeKey(type, record._id);
      graph.set(key, new Set());
      recordByKey.set(key, { type, record });
    }
  }

  for (const record of records.appointments) {
    const appointmentKey = nodeKey('appointments', record._id);
    addEdge(graph, appointmentKey, nodeKey('visitors', record.visitor));
    addEdge(graph, appointmentKey, nodeKey('users', record.host));
  }
  for (const record of records.passes) {
    const passKey = nodeKey('passes', record._id);
    addEdge(graph, passKey, nodeKey('visitors', record.visitor));
    addEdge(graph, passKey, nodeKey('appointments', record.appointment));
    addEdge(graph, passKey, nodeKey('users', record.issuedBy));
  }
  for (const record of records.checkLogs) {
    const logKey = nodeKey('checkLogs', record._id);
    addEdge(graph, logKey, nodeKey('visitors', record.visitor));
    addEdge(graph, logKey, nodeKey('passes', record.pass));
    addEdge(graph, logKey, nodeKey('users', record.scannedBy));
  }

  const components = findComponents(graph);
  const assignments = new Map();
  const review = [];
  let defaultOrganization = null;

  for (const component of components) {
    const knownOrganizations = new Set(
      component
        .map((key) => getOrganizationId(recordByKey.get(key).record))
        .filter(Boolean)
    );
    const missingKeys = component.filter(
      (key) => !getOrganizationId(recordByKey.get(key).record)
    );
    if (!missingKeys.length) continue;

    if (knownOrganizations.size > 1) {
      review.push({
        records: missingKeys.map((key) => key),
        organizations: [...knownOrganizations],
        reason: 'Related records belong to multiple organizations',
      });
      continue;
    }

    if (!knownOrganizations.size) {
      if (!defaultOrganization) {
        defaultOrganization = await Organization.findOneAndUpdate(
          { slug: migrationOrganization.slug },
          { $setOnInsert: migrationOrganization },
          { new: true, upsert: true }
        ).select('_id name slug');
      }
      knownOrganizations.add(String(defaultOrganization._id));
    }

    for (const key of missingKeys) assignments.set(key, [...knownOrganizations][0]);
  }

  const migrated = Object.fromEntries(Object.keys(models).map((type) => [type, 0]));
  for (const [key, organizationId] of assignments) {
    const { type, record } = recordByKey.get(key);
    const result = await models[type].updateOne(
      {
        _id: record._id,
        $or: [
          { organizationId: { $exists: false } },
          { organizationId: null },
        ],
      },
      { $set: { organizationId } }
    );
    migrated[type] += result.modifiedCount;
  }

  console.log('Legacy organization migration completed.');
  console.log(`Legacy records found: ${legacyCount}`);
  console.log(`Records migrated: ${Object.entries(migrated).map(([type, count]) => `${type}=${count}`).join(', ')}`);
  if (defaultOrganization) {
    console.log(`Migration-only default organization: ${defaultOrganization.name} (${defaultOrganization._id})`);
  }
  if (review.length) {
    console.warn(`Records requiring manual review: ${review.reduce((total, item) => total + item.records.length, 0)}`);
    for (const item of review) {
      console.warn(`- ${item.reason}: ${item.records.join(', ')}`);
    }
  } else {
    console.log('Records requiring manual review: 0');
  }
};

run()
  .catch((error) => {
    console.error('Organization data migration failed:', error.message);
    process.exitCode = 1;
  })
  .finally(() => mongoose.disconnect().catch(() => {}));
