import { boolean, integer, json, pgTable, serial, varchar, text, timestamp, index } from 'drizzle-orm/pg-core';

export const USER_TABLE = pgTable('users', {
    id: serial('id').primaryKey(),
    name: varchar('name').notNull(),
    email: varchar('email').notNull(),
    isMember: boolean('isMember').default(false),
    credits: integer('credits').default(5), // free tier starts with 5 credits
    createdAt: timestamp('created_at').defaultNow(),
}, (table) => [
    index('users_email_idx').on(table.email),
]);

export const STUDY_MATERIAL_TABLE = pgTable('studyMaterial', {
    id: serial('id').primaryKey(),
    courseId: varchar('courseId').notNull(),
    courseType: varchar('courseType').notNull(),
    topic: varchar('topic').notNull(),
    difficulty: varchar('difficulty').default('Easy'),
    courseLayout: json('courseLayout'),
    createdBy: varchar('createdBy').notNull(),
    status: varchar('status').default('Generating'),
    deletedAt: timestamp('deleted_at'),
    createdAt: timestamp('created_at').defaultNow(),
}, (table) => [
    index('study_material_user_idx').on(table.createdBy),
    index('study_material_course_idx').on(table.courseId),
    index('study_material_deleted_idx').on(table.deletedAt),
]);

export const CHAPTER_NOTES_TABLE = pgTable('ChapterNotes', {
    id: serial('id').primaryKey(),
    courseId: varchar('courseId').notNull(),
    chapterId: integer('chapterId').notNull(),
    notes: text('notes'),
    createdAt: timestamp('created_at').defaultNow(),
}, (table) => [
    index('chapter_notes_course_idx').on(table.courseId),
]);

export const STUDY_TYPE_CONTENT_TABLE = pgTable('studyTypeContent', {
    id: serial('id').primaryKey(),
    courseId: varchar('courseId').notNull(),
    content: json('content'),
    type: varchar('type').notNull(),
    status: varchar('status').default('Generating'),
    createdAt: timestamp('created_at').defaultNow(),
}, (table) => [
    index('study_type_content_course_type_idx').on(table.courseId, table.type),
]);

export const QUIZ_ATTEMPTS_TABLE = pgTable('quizAttempts', {
    id: serial('id').primaryKey(),
    courseId: varchar('courseId').notNull(),
    userEmail: varchar('userEmail').notNull(),
    score: integer('score').notNull(),
    totalQuestions: integer('totalQuestions').notNull(),
    answersJSON: json('answersJSON'),
    createdAt: timestamp('created_at').defaultNow(),
}, (table) => [
    index('quiz_attempts_course_idx').on(table.courseId),
    index('quiz_attempts_user_idx').on(table.userEmail),
]);
