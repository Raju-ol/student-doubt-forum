export const levelOf = record => record?.academicLevel || (record?.semester ? { system: 'semester', index: record.semester, label: `Semester ${record.semester}` } : null);
export const levelLabel = record => levelOf(record)?.label || 'Academic level not specified';
export function parseAcademicForm(body) {
  if (typeof body.academicLevel === 'string') body.academicLevel = JSON.parse(body.academicLevel);
  return body;
}
