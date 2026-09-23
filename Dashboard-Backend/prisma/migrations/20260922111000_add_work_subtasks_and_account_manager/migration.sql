-- AlterTable
ALTER TABLE `Account` ADD COLUMN `accessiblePages` JSON NULL,
    ADD COLUMN `managerPublicId` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `WorkItem` ADD COLUMN `isMainCompleted` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `managerPublicId` VARCHAR(191) NULL,
    ADD COLUMN `subtasks` JSON NULL;

-- CreateIndex
CREATE INDEX `Account_managerPublicId_idx` ON `Account`(`managerPublicId`);

-- CreateIndex
CREATE INDEX `WorkItem_managerPublicId_idx` ON `WorkItem`(`managerPublicId`);

-- AddForeignKey
ALTER TABLE `Account` ADD CONSTRAINT `Account_managerPublicId_fkey` FOREIGN KEY (`managerPublicId`) REFERENCES `Account`(`publicId`) ON DELETE SET NULL ON UPDATE CASCADE;
