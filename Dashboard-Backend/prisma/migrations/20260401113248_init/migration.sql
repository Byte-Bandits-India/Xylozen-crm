-- AlterTable
ALTER TABLE `ActivityAuditLog` MODIFY `entityType` ENUM('USER', 'CLIENT', 'INVOICE', 'INVOICE_PAYMENT', 'EXPENSE', 'CONTRIBUTION', 'TRANSACTION', 'REPORT', 'SITE') NOT NULL;

-- CreateTable
CREATE TABLE `Site` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `publicId` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `userName` VARCHAR(191) NOT NULL,
    `url` VARCHAR(191) NOT NULL,
    `password` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `createdByPublicId` VARCHAR(191) NULL,

    UNIQUE INDEX `Site_publicId_key`(`publicId`),
    INDEX `Site_createdByPublicId_idx`(`createdByPublicId`),
    INDEX `Site_name_idx`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Site` ADD CONSTRAINT `Site_createdByPublicId_fkey` FOREIGN KEY (`createdByPublicId`) REFERENCES `Account`(`publicId`) ON DELETE SET NULL ON UPDATE CASCADE;
