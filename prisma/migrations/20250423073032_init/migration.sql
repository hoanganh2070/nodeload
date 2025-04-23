-- CreateEnum
CREATE TYPE "DownloadType" AS ENUM ('HTTP', 'FTP', 'SFTP', 'SCP', 'RSYNC', 'WEBDAV', 'S3');

-- CreateEnum
CREATE TYPE "DownloadStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'FAILED');

-- CreateTable
CREATE TABLE "User" (
    "id" UUID NOT NULL,
    "name" STRING,
    "password" STRING,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Task" (
    "id" UUID NOT NULL,
    "url" STRING NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" UUID,
    "metadata" JSONB,
    "status" "DownloadStatus" NOT NULL,
    "type" "DownloadType" NOT NULL,
    "progress" FLOAT8,
    "error" STRING,
    "filePath" STRING,
    "fileSize" INT4,
    "fileName" STRING,

    CONSTRAINT "Task_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
