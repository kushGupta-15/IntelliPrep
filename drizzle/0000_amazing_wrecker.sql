CREATE TABLE "chapter_notes" (
	"id" serial PRIMARY KEY NOT NULL,
	"course_id" varchar NOT NULL,
	"chapter_id" integer NOT NULL,
	"notes" text
);
--> statement-breakpoint
CREATE TABLE "study_materials" (
	"id" serial PRIMARY KEY NOT NULL,
	"course_id" varchar NOT NULL,
	"course_type" varchar NOT NULL,
	"topic" varchar NOT NULL,
	"difficulty" varchar DEFAULT 'Easy',
	"course_layout" json,
	"created_by" varchar NOT NULL,
	"status" varchar DEFAULT 'Generating'
);
--> statement-breakpoint
CREATE TABLE "study_type_content" (
	"id" serial PRIMARY KEY NOT NULL,
	"course_id" varchar NOT NULL,
	"content" json,
	"type" varchar NOT NULL,
	"status" varchar DEFAULT 'Generating'
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar NOT NULL,
	"email" varchar NOT NULL,
	"is_member" boolean DEFAULT false
);
