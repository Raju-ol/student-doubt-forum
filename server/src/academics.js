import { fail, text, semester } from './validation.js';
export function academicFields(body) {
  if (Object.hasOwn(body, 'academicLevel')) {
    const value = body.academicLevel;
    if (value === null) return { academicLevel: null, semester: undefined };
    if (!value || typeof value !== 'object' || Array.isArray(value) || !['semester', 'year', 'grade', 'other'].includes(value.system)) fail(400, 'Choose a valid academic system.');
    const level = { system: value.system };
    if (value.system === 'other') level.label = text(value.label, 'Academic level', 1, 60);
    else {
      if (!['number', 'string'].includes(typeof value.index) || !/^\d{1,2}$/.test(String(value.index)) || Number(value.index) < 1 || Number(value.index) > 30) fail(400, 'Academic level must be from 1 to 30.');
      level.index = Number(value.index);
      level.label = `${value.system[0].toUpperCase() + value.system.slice(1)} ${level.index}`;
    }
    return { academicLevel: level, semester: level.system === 'semester' && level.index <= 8 ? level.index : undefined };
  }
  if (body.semester !== undefined && body.semester !== '') {
    const index = semester(body.semester); return { academicLevel: { system: 'semester', index, label: `Semester ${index}` }, semester: index };
  }
  return {};
}
export const effectiveLevel = user => user.academicLevel || (user.semester ? { system: 'semester', index: user.semester, label: `Semester ${user.semester}` } : null);
