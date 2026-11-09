import React from 'react';
import { useAuth } from './context';
export function InstitutionSelect({ defaultValue = '', id = 'institution' }) {
  const { institutions } = useAuth();
  return <label htmlFor={id}>College (optional)<select id={id} name="institution" defaultValue={defaultValue || ''}><option value="">No college / independent learner</option>{defaultValue && !institutions.some(item => item._id === defaultValue) && <option value={defaultValue}>Current college</option>}{institutions.map(item => <option key={item._id} value={item._id}>{item.name}{item.country ? ` (${item.country})` : ''}</option>)}</select><small>College selection helps filter public questions. It is self-reported and does not verify membership.</small></label>;
}
