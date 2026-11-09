import { User, Doubt } from './models.js';
export async function migrateAcademicLevels({ apply = false } = {}) {
  const summary = { mode: apply ? 'apply' : 'dry-run', users: 0, questions: 0 };
  for (const [name, Model] of [['users', User], ['questions', Doubt]]) {
    const filter = { academicLevel: { $exists: false }, semester: { $gte: 1, $lte: 8 } };
    for await (const doc of Model.find(filter).select('_id semester').lean().cursor()) {
      summary[name]++;
      if (apply) await Model.updateOne({ _id: doc._id, academicLevel: { $exists: false } }, { $set: { academicLevel: { system: 'semester', index: doc.semester, label: `Semester ${doc.semester}` } } });
    }
  }
  return summary;
}
