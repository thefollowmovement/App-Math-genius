/** School grades covered by the app, from CP (age 6) to 3e (age 14). */
export const GRADES = ['CP', 'CE1', 'CE2', 'CM1', 'CM2', '6e', '5e', '4e', '3e'] as const;

export type Grade = (typeof GRADES)[number];

/** Position of a grade in school order, to compare grades (CP = 0). */
export const gradeRank = (grade: Grade): number => GRADES.indexOf(grade);
