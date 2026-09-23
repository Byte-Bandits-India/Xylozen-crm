-- CreateTable
CREATE TABLE `Lead` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `publicId` VARCHAR(191) NOT NULL,
    `companyName` VARCHAR(191) NOT NULL,
    `industry` VARCHAR(191) NOT NULL DEFAULT 'Technology',
    `email` VARCHAR(191) NOT NULL,
    `phone` VARCHAR(191) NULL,
    `clientName` VARCHAR(191) NOT NULL,
    `service` VARCHAR(191) NOT NULL DEFAULT 'Web Development',
    `description` TEXT NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'enquired',
    `assignedUserId` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Lead_publicId_key`(`publicId`),
    INDEX `Lead_status_idx`(`status`),
    INDEX `Lead_assignedUserId_idx`(`assignedUserId`),
    INDEX `Lead_createdAt_idx`(`createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Lead` ADD CONSTRAINT `Lead_assignedUserId_fkey` FOREIGN KEY (`assignedUserId`) REFERENCES `Account`(`publicId`) ON DELETE SET NULL ON UPDATE CASCADE;
