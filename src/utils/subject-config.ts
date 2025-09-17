// Configuration for which columns to show for different subjects

export const isOfficeOrLibrary = (subject: string): boolean => {
  return subject === 'Office' || subject === 'Library';
};

export const shouldShowMarksColumns = (subject: string): boolean => {
  return !isOfficeOrLibrary(subject);
};

export const shouldShowAssignmentColumn = (subject: string): boolean => {
  return !isOfficeOrLibrary(subject);
};

export const shouldShowDepartmentFeesColumn = (subject: string): boolean => {
  return !isOfficeOrLibrary(subject);
};

export const shouldShowDueStatusColumn = (subject: string): boolean => {
  return !isOfficeOrLibrary(subject);
};

export const getSubjectColumnConfig = (subject: string) => ({
  showMarks: shouldShowMarksColumns(subject), // IAT1, IAT2, Model
  showAssignment: shouldShowAssignmentColumn(subject),
  showDepartmentFees: shouldShowDepartmentFeesColumn(subject),
  showDueStatus: shouldShowDueStatusColumn(subject),
  showSignature: true // Always show signature column
});
