-- AlterTable
ALTER TABLE `UserProfile` ADD COLUMN `functionalRole` VARCHAR(191) NULL,
    ADD COLUMN `affiliation` VARCHAR(191) NULL DEFAULT 'internal';

-- CreateTable
CREATE TABLE IF NOT EXISTS `FunctionalRole` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `publicId` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NULL,
    `color` VARCHAR(191) NULL DEFAULT 'indigo',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `FunctionalRole_publicId_key`(`publicId`),
    UNIQUE INDEX `FunctionalRole_name_key`(`name`),
    INDEX `FunctionalRole_name_idx`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE IF NOT EXISTS `WorkItem` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `publicId` VARCHAR(191) NOT NULL,
    `customId` VARCHAR(191) NULL,
    `title` VARCHAR(191) NOT NULL,
    `description` LONGTEXT NULL,
    `priority` VARCHAR(191) NOT NULL DEFAULT 'medium',
    `status` VARCHAR(191) NOT NULL DEFAULT 'new',
    `dueDate` DATETIME(3) NULL,
    `milestoneCompleted` INTEGER NOT NULL DEFAULT 0,
    `milestoneTotal` INTEGER NOT NULL DEFAULT 1,
    `attachmentsCount` INTEGER NOT NULL DEFAULT 0,
    `attachments` JSON NULL,
    `assignees` JSON NULL,
    `commentsCount` INTEGER NOT NULL DEFAULT 0,
    `createdByPublicId` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `WorkItem_publicId_key`(`publicId`),
    UNIQUE INDEX `WorkItem_customId_key`(`customId`),
    INDEX `WorkItem_status_idx`(`status`),
    INDEX `WorkItem_priority_idx`(`priority`),
    INDEX `WorkItem_createdByPublicId_idx`(`createdByPublicId`),
    INDEX `WorkItem_createdAt_idx`(`createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
