CREATE TABLE "restaurants" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"name" varchar(256) NOT NULL
);
