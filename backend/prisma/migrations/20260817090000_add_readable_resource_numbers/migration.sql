BEGIN;

CREATE SEQUENCE "groups_group_number_seq";
ALTER TABLE "groups" ADD COLUMN "group_number" INTEGER;
UPDATE "groups" SET "group_number" = nextval('"groups_group_number_seq"');
ALTER TABLE "groups" ALTER COLUMN "group_number" SET NOT NULL;
ALTER TABLE "groups" ALTER COLUMN "group_number" SET DEFAULT nextval('"groups_group_number_seq"');
ALTER SEQUENCE "groups_group_number_seq" OWNED BY "groups"."group_number";
CREATE UNIQUE INDEX "groups_group_number_key" ON "groups"("group_number");

CREATE SEQUENCE "group_activities_activity_number_seq";
ALTER TABLE "group_activities" ADD COLUMN "activity_number" INTEGER;
UPDATE "group_activities" SET "activity_number" = nextval('"group_activities_activity_number_seq"');
ALTER TABLE "group_activities" ALTER COLUMN "activity_number" SET NOT NULL;
ALTER TABLE "group_activities" ALTER COLUMN "activity_number" SET DEFAULT nextval('"group_activities_activity_number_seq"');
ALTER SEQUENCE "group_activities_activity_number_seq" OWNED BY "group_activities"."activity_number";
CREATE UNIQUE INDEX "group_activities_activity_number_key" ON "group_activities"("activity_number");

COMMIT;
