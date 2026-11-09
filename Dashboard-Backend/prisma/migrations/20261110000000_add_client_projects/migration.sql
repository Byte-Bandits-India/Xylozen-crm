-- CreateTable
CREATE TABLE `ClientProject` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `publicId` VARCHAR(191) NOT NULL,
    `clientId` BIGINT NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `companyName` VARCHAR(191) NULL,
    `logoUrl` TEXT NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'backlog',
    `summaryTitle` VARCHAR(191) NULL,
    `summaryText` TEXT NULL,
    `memberIds` TEXT NULL,
    `progress` INTEGER NOT NULL DEFAULT 0,
    `payment` DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `ClientProject_publicId_key`(`publicId`),
    INDEX `ClientProject_clientId_idx`(`clientId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `ClientProject` ADD CONSTRAINT `ClientProject_clientId_fkey` FOREIGN KEY (`clientId`) REFERENCES `Client`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
