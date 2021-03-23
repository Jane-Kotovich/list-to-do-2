-- CreateTable
CREATE TABLE "list_to_do" (
    "id" SERIAL NOT NULL,
    "item_to_do" VARCHAR(255) NOT NULL,
    "authorId" INTEGER NOT NULL,
    "done" BOOLEAN NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL,

    PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Users" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "firstname" TEXT NOT NULL,
    "secondname" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL,

    PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Users.email_unique" ON "Users"("email");

-- AddForeignKey
ALTER TABLE "list_to_do" ADD FOREIGN KEY ("authorId") REFERENCES "Users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
