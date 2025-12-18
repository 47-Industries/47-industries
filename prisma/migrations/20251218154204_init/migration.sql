-- CreateTable
CREATE TABLE `User` (
    `id` VARCHAR(191) NOT NULL,
    `username` VARCHAR(191) NULL,
    `email` VARCHAR(191) NULL,
    `name` VARCHAR(191) NULL,
    `password` VARCHAR(191) NULL,
    `image` VARCHAR(191) NULL,
    `role` ENUM('CUSTOMER', 'ADMIN', 'SUPER_ADMIN') NOT NULL DEFAULT 'CUSTOMER',
    `emailVerified` DATETIME(3) NULL,
    `backupEmail` VARCHAR(191) NULL,
    `permissions` JSON NULL,
    `emailAccess` JSON NULL,
    `isFounder` BOOLEAN NOT NULL DEFAULT false,
    `zohoAccessToken` TEXT NULL,
    `zohoRefreshToken` TEXT NULL,
    `zohoTokenExpiry` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `User_username_key`(`username`),
    UNIQUE INDEX `User_email_key`(`email`),
    INDEX `User_username_idx`(`username`),
    INDEX `User_email_idx`(`email`),
    INDEX `User_isFounder_idx`(`isFounder`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Account` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `type` VARCHAR(191) NOT NULL,
    `provider` VARCHAR(191) NOT NULL,
    `providerAccountId` VARCHAR(191) NOT NULL,
    `refresh_token` TEXT NULL,
    `access_token` TEXT NULL,
    `expires_at` INTEGER NULL,
    `token_type` VARCHAR(191) NULL,
    `scope` VARCHAR(191) NULL,
    `id_token` TEXT NULL,
    `session_state` VARCHAR(191) NULL,

    INDEX `Account_userId_idx`(`userId`),
    UNIQUE INDEX `Account_provider_providerAccountId_key`(`provider`, `providerAccountId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Session` (
    `id` VARCHAR(191) NOT NULL,
    `sessionToken` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `expires` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Session_sessionToken_key`(`sessionToken`),
    INDEX `Session_userId_idx`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `VerificationToken` (
    `identifier` VARCHAR(191) NOT NULL,
    `token` VARCHAR(191) NOT NULL,
    `expires` DATETIME(3) NOT NULL,

    UNIQUE INDEX `VerificationToken_token_key`(`token`),
    UNIQUE INDEX `VerificationToken_identifier_token_key`(`identifier`, `token`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Category` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `slug` VARCHAR(191) NOT NULL,
    `description` TEXT NULL,
    `image` VARCHAR(191) NULL,
    `productType` ENUM('PHYSICAL', 'DIGITAL') NOT NULL DEFAULT 'PHYSICAL',
    `parentId` VARCHAR(191) NULL,
    `active` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Category_slug_key`(`slug`),
    INDEX `Category_slug_idx`(`slug`),
    INDEX `Category_parentId_idx`(`parentId`),
    INDEX `Category_productType_idx`(`productType`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Product` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `slug` VARCHAR(191) NOT NULL,
    `description` TEXT NOT NULL,
    `shortDesc` VARCHAR(500) NULL,
    `price` DECIMAL(10, 2) NOT NULL,
    `comparePrice` DECIMAL(10, 2) NULL,
    `costPrice` DECIMAL(10, 2) NULL,
    `images` JSON NOT NULL,
    `categoryId` VARCHAR(191) NOT NULL,
    `stock` INTEGER NOT NULL DEFAULT 0,
    `sku` VARCHAR(191) NULL,
    `tags` JSON NULL,
    `featured` BOOLEAN NOT NULL DEFAULT false,
    `active` BOOLEAN NOT NULL DEFAULT true,
    `productType` ENUM('PHYSICAL', 'DIGITAL') NOT NULL DEFAULT 'PHYSICAL',
    `linkedProductId` VARCHAR(191) NULL,
    `weight` DECIMAL(10, 2) NULL,
    `dimensions` VARCHAR(191) NULL,
    `requiresShipping` BOOLEAN NOT NULL DEFAULT true,
    `digitalFileUrl` TEXT NULL,
    `digitalFileName` VARCHAR(191) NULL,
    `digitalFileSize` INTEGER NULL,
    `downloadLimit` INTEGER NULL DEFAULT 5,
    `downloadExpiry` INTEGER NULL DEFAULT 30,
    `material` VARCHAR(191) NULL,
    `printTime` INTEGER NULL,
    `layerHeight` DECIMAL(5, 3) NULL,
    `infill` INTEGER NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Product_slug_key`(`slug`),
    UNIQUE INDEX `Product_sku_key`(`sku`),
    INDEX `Product_slug_idx`(`slug`),
    INDEX `Product_categoryId_idx`(`categoryId`),
    INDEX `Product_sku_idx`(`sku`),
    INDEX `Product_featured_idx`(`featured`),
    INDEX `Product_productType_idx`(`productType`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ProductVariant` (
    `id` VARCHAR(191) NOT NULL,
    `productId` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `sku` VARCHAR(191) NULL,
    `price` DECIMAL(10, 2) NOT NULL,
    `comparePrice` DECIMAL(10, 2) NULL,
    `stock` INTEGER NOT NULL DEFAULT 0,
    `options` JSON NOT NULL,
    `image` VARCHAR(191) NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `sortOrder` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `ProductVariant_sku_key`(`sku`),
    INDEX `ProductVariant_productId_idx`(`productId`),
    INDEX `ProductVariant_sku_idx`(`sku`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ProductOptionType` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `values` JSON NOT NULL,
    `sortOrder` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `ProductOptionType_name_key`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `DigitalDownload` (
    `id` VARCHAR(191) NOT NULL,
    `productId` VARCHAR(191) NOT NULL,
    `orderId` VARCHAR(191) NOT NULL,
    `orderItemId` VARCHAR(191) NOT NULL,
    `downloadToken` VARCHAR(191) NOT NULL,
    `downloadCount` INTEGER NOT NULL DEFAULT 0,
    `maxDownloads` INTEGER NULL,
    `expiresAt` DATETIME(3) NULL,
    `customerEmail` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `lastDownloadAt` DATETIME(3) NULL,

    UNIQUE INDEX `DigitalDownload_downloadToken_key`(`downloadToken`),
    INDEX `DigitalDownload_productId_idx`(`productId`),
    INDEX `DigitalDownload_orderId_idx`(`orderId`),
    INDEX `DigitalDownload_downloadToken_idx`(`downloadToken`),
    INDEX `DigitalDownload_customerEmail_idx`(`customerEmail`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `CartItem` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NULL,
    `productId` VARCHAR(191) NOT NULL,
    `quantity` INTEGER NOT NULL DEFAULT 1,
    `sessionId` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `CartItem_userId_idx`(`userId`),
    INDEX `CartItem_productId_idx`(`productId`),
    INDEX `CartItem_sessionId_idx`(`sessionId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Order` (
    `id` VARCHAR(191) NOT NULL,
    `orderNumber` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NULL,
    `customerName` VARCHAR(191) NOT NULL,
    `customerEmail` VARCHAR(191) NOT NULL,
    `customerPhone` VARCHAR(191) NULL,
    `subtotal` DECIMAL(10, 2) NOT NULL,
    `tax` DECIMAL(10, 2) NOT NULL DEFAULT 0,
    `shipping` DECIMAL(10, 2) NOT NULL DEFAULT 0,
    `discount` DECIMAL(10, 2) NOT NULL DEFAULT 0,
    `total` DECIMAL(10, 2) NOT NULL,
    `status` ENUM('PENDING', 'PROCESSING', 'PAID', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'REFUNDED') NOT NULL DEFAULT 'PENDING',
    `paymentStatus` ENUM('PENDING', 'PROCESSING', 'SUCCEEDED', 'FAILED', 'REFUNDED') NOT NULL DEFAULT 'PENDING',
    `stripePaymentId` VARCHAR(191) NULL,
    `stripeSessionId` VARCHAR(191) NULL,
    `shippingAddressId` VARCHAR(191) NULL,
    `trackingNumber` VARCHAR(191) NULL,
    `carrier` VARCHAR(191) NULL,
    `discountCode` VARCHAR(191) NULL,
    `customerNotes` TEXT NULL,
    `adminNotes` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Order_orderNumber_key`(`orderNumber`),
    UNIQUE INDEX `Order_stripePaymentId_key`(`stripePaymentId`),
    UNIQUE INDEX `Order_stripeSessionId_key`(`stripeSessionId`),
    INDEX `Order_userId_idx`(`userId`),
    INDEX `Order_orderNumber_idx`(`orderNumber`),
    INDEX `Order_status_idx`(`status`),
    INDEX `Order_stripePaymentId_idx`(`stripePaymentId`),
    INDEX `Order_shippingAddressId_idx`(`shippingAddressId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `OrderItem` (
    `id` VARCHAR(191) NOT NULL,
    `orderId` VARCHAR(191) NOT NULL,
    `productId` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `price` DECIMAL(10, 2) NOT NULL,
    `quantity` INTEGER NOT NULL,
    `total` DECIMAL(10, 2) NOT NULL,
    `image` VARCHAR(191) NULL,
    `sku` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `OrderItem_orderId_idx`(`orderId`),
    INDEX `OrderItem_productId_idx`(`productId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Address` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `fullName` VARCHAR(191) NOT NULL,
    `company` VARCHAR(191) NULL,
    `address1` VARCHAR(191) NOT NULL,
    `address2` VARCHAR(191) NULL,
    `city` VARCHAR(191) NOT NULL,
    `state` VARCHAR(191) NOT NULL,
    `zipCode` VARCHAR(191) NOT NULL,
    `country` VARCHAR(191) NOT NULL DEFAULT 'US',
    `phone` VARCHAR(191) NULL,
    `isDefault` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `Address_userId_idx`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `DiscountCode` (
    `id` VARCHAR(191) NOT NULL,
    `code` VARCHAR(191) NOT NULL,
    `description` TEXT NULL,
    `type` ENUM('PERCENTAGE', 'FIXED_AMOUNT') NOT NULL,
    `value` DECIMAL(10, 2) NOT NULL,
    `minPurchase` DECIMAL(10, 2) NULL,
    `maxUses` INTEGER NULL,
    `usedCount` INTEGER NOT NULL DEFAULT 0,
    `active` BOOLEAN NOT NULL DEFAULT true,
    `startsAt` DATETIME(3) NULL,
    `expiresAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `DiscountCode_code_key`(`code`),
    INDEX `DiscountCode_code_idx`(`code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `CustomRequest` (
    `id` VARCHAR(191) NOT NULL,
    `requestNumber` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `phone` VARCHAR(191) NULL,
    `company` VARCHAR(191) NULL,
    `fileUrl` VARCHAR(191) NOT NULL,
    `fileName` VARCHAR(191) NOT NULL,
    `fileSize` INTEGER NOT NULL,
    `material` VARCHAR(191) NOT NULL,
    `finish` VARCHAR(191) NOT NULL,
    `color` VARCHAR(191) NOT NULL,
    `quantity` INTEGER NOT NULL,
    `dimensions` VARCHAR(191) NULL,
    `scale` DECIMAL(5, 2) NULL,
    `notes` TEXT NULL,
    `deadline` DATETIME(3) NULL,
    `estimatedPrice` DECIMAL(10, 2) NULL,
    `estimatedDays` INTEGER NULL,
    `quoteNotes` TEXT NULL,
    `quotedAt` DATETIME(3) NULL,
    `quotedBy` VARCHAR(191) NULL,
    `status` ENUM('PENDING', 'REVIEWING', 'QUOTED', 'APPROVED', 'IN_PRODUCTION', 'COMPLETED', 'CANCELLED') NOT NULL DEFAULT 'PENDING',
    `adminNotes` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `CustomRequest_requestNumber_key`(`requestNumber`),
    INDEX `CustomRequest_email_idx`(`email`),
    INDEX `CustomRequest_status_idx`(`status`),
    INDEX `CustomRequest_requestNumber_idx`(`requestNumber`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ServiceInquiry` (
    `id` VARCHAR(191) NOT NULL,
    `inquiryNumber` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `phone` VARCHAR(191) NULL,
    `company` VARCHAR(191) NULL,
    `website` VARCHAR(191) NULL,
    `serviceType` ENUM('WEB_DEVELOPMENT', 'APP_DEVELOPMENT', 'AI_SOLUTIONS', 'CONSULTATION', 'OTHER') NOT NULL,
    `budget` VARCHAR(191) NULL,
    `timeline` VARCHAR(191) NULL,
    `description` TEXT NOT NULL,
    `packageId` VARCHAR(191) NULL,
    `attachments` JSON NULL,
    `status` ENUM('NEW', 'IN_PROGRESS', 'CONTACTED', 'QUOTED', 'PROPOSAL_SENT', 'NEGOTIATING', 'ACCEPTED', 'DECLINED', 'COMPLETED', 'CANCELLED') NOT NULL DEFAULT 'NEW',
    `assignedTo` VARCHAR(191) NULL,
    `estimatedCost` DECIMAL(10, 2) NULL,
    `proposalUrl` VARCHAR(191) NULL,
    `adminNotes` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `ServiceInquiry_inquiryNumber_key`(`inquiryNumber`),
    INDEX `ServiceInquiry_email_idx`(`email`),
    INDEX `ServiceInquiry_status_idx`(`status`),
    INDEX `ServiceInquiry_serviceType_idx`(`serviceType`),
    INDEX `ServiceInquiry_inquiryNumber_idx`(`inquiryNumber`),
    INDEX `ServiceInquiry_packageId_idx`(`packageId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `InquiryMessage` (
    `id` VARCHAR(191) NOT NULL,
    `inquiryId` VARCHAR(191) NOT NULL,
    `message` TEXT NOT NULL,
    `isFromAdmin` BOOLEAN NOT NULL DEFAULT false,
    `senderName` VARCHAR(191) NULL,
    `isQuote` BOOLEAN NOT NULL DEFAULT false,
    `quoteAmount` DECIMAL(10, 2) NULL,
    `quoteMonthly` DECIMAL(10, 2) NULL,
    `quoteValidDays` INTEGER NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `InquiryMessage_inquiryId_idx`(`inquiryId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ServicePackage` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `slug` VARCHAR(191) NOT NULL,
    `category` ENUM('WEB_DEVELOPMENT', 'WEB_APP', 'IOS_APP', 'ANDROID_APP', 'CROSS_PLATFORM_APP', 'AI_AUTOMATION', 'DESKTOP_APP', 'THREE_D_PRINTING') NOT NULL,
    `price` DECIMAL(10, 2) NULL,
    `priceDisplay` VARCHAR(191) NULL,
    `billingType` VARCHAR(191) NOT NULL DEFAULT 'one_time',
    `priceNote` VARCHAR(191) NULL,
    `shortDesc` VARCHAR(500) NOT NULL,
    `description` TEXT NOT NULL,
    `features` JSON NOT NULL,
    `includes` JSON NULL,
    `platforms` JSON NULL,
    `techStack` JSON NULL,
    `integrations` JSON NULL,
    `deliverables` JSON NULL,
    `supportIncluded` VARCHAR(191) NULL,
    `revisionRounds` INTEGER NULL,
    `isPopular` BOOLEAN NOT NULL DEFAULT false,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `sortOrder` INTEGER NOT NULL DEFAULT 0,
    `badge` VARCHAR(191) NULL,
    `estimatedDays` INTEGER NULL,
    `estimatedWeeks` INTEGER NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `ServicePackage_slug_key`(`slug`),
    INDEX `ServicePackage_category_idx`(`category`),
    INDEX `ServicePackage_isActive_idx`(`isActive`),
    INDEX `ServicePackage_slug_idx`(`slug`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ServiceFeature` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `description` TEXT NULL,
    `icon` VARCHAR(191) NULL,
    `category` ENUM('WEB_DEVELOPMENT', 'WEB_APP', 'IOS_APP', 'ANDROID_APP', 'CROSS_PLATFORM_APP', 'AI_AUTOMATION', 'DESKTOP_APP', 'THREE_D_PRINTING') NOT NULL,
    `sortOrder` INTEGER NOT NULL DEFAULT 0,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `ServiceFeature_category_idx`(`category`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ServiceProject` (
    `id` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `slug` VARCHAR(191) NOT NULL,
    `category` ENUM('WEB_DEVELOPMENT', 'WEB_APP', 'IOS_APP', 'ANDROID_APP', 'CROSS_PLATFORM_APP', 'AI_AUTOMATION', 'DESKTOP_APP', 'THREE_D_PRINTING') NOT NULL,
    `categories` JSON NULL,
    `clientName` VARCHAR(191) NOT NULL,
    `clientLogo` VARCHAR(191) NULL,
    `description` TEXT NOT NULL,
    `challenge` TEXT NULL,
    `solution` TEXT NULL,
    `results` TEXT NULL,
    `thumbnailUrl` VARCHAR(191) NULL,
    `images` JSON NULL,
    `videoUrl` VARCHAR(191) NULL,
    `liveUrl` VARCHAR(191) NULL,
    `technologies` JSON NULL,
    `testimonial` TEXT NULL,
    `testimonialAuthor` VARCHAR(191) NULL,
    `testimonialRole` VARCHAR(191) NULL,
    `isFeatured` BOOLEAN NOT NULL DEFAULT false,
    `showInNavbar` BOOLEAN NOT NULL DEFAULT false,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `sortOrder` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `ServiceProject_slug_key`(`slug`),
    INDEX `ServiceProject_category_idx`(`category`),
    INDEX `ServiceProject_isFeatured_idx`(`isFeatured`),
    INDEX `ServiceProject_showInNavbar_idx`(`showInNavbar`),
    INDEX `ServiceProject_slug_idx`(`slug`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `CustomerNote` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `authorId` VARCHAR(191) NOT NULL,
    `authorName` VARCHAR(191) NOT NULL,
    `content` TEXT NOT NULL,
    `isPinned` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `CustomerNote_userId_idx`(`userId`),
    INDEX `CustomerNote_authorId_idx`(`authorId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `CustomerSegment` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `description` TEXT NULL,
    `color` VARCHAR(191) NOT NULL DEFAULT '#3b82f6',
    `conditions` JSON NULL,
    `isAutomatic` BOOLEAN NOT NULL DEFAULT false,
    `memberIds` JSON NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `CustomerSegment_name_key`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Notification` (
    `id` VARCHAR(191) NOT NULL,
    `type` ENUM('ORDER_NEW', 'ORDER_STATUS', 'ORDER_REFUND', 'INVENTORY_LOW', 'INVENTORY_OUT', 'CUSTOM_REQUEST', 'SERVICE_INQUIRY', 'REVIEW_NEW', 'USER_SIGNUP', 'SYSTEM') NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `message` TEXT NOT NULL,
    `link` VARCHAR(191) NULL,
    `userId` VARCHAR(191) NULL,
    `isRead` BOOLEAN NOT NULL DEFAULT false,
    `readAt` DATETIME(3) NULL,
    `metadata` JSON NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `Notification_userId_idx`(`userId`),
    INDEX `Notification_isRead_idx`(`isRead`),
    INDEX `Notification_type_idx`(`type`),
    INDEX `Notification_createdAt_idx`(`createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ActivityLog` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `userName` VARCHAR(191) NOT NULL,
    `action` VARCHAR(191) NOT NULL,
    `entityType` VARCHAR(191) NOT NULL,
    `entityId` VARCHAR(191) NULL,
    `entityName` VARCHAR(191) NULL,
    `details` JSON NULL,
    `ipAddress` VARCHAR(191) NULL,
    `userAgent` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `ActivityLog_userId_idx`(`userId`),
    INDEX `ActivityLog_entityType_idx`(`entityType`),
    INDEX `ActivityLog_createdAt_idx`(`createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `InventoryAlert` (
    `id` VARCHAR(191) NOT NULL,
    `productId` VARCHAR(191) NOT NULL,
    `type` VARCHAR(191) NOT NULL,
    `threshold` INTEGER NOT NULL,
    `isResolved` BOOLEAN NOT NULL DEFAULT false,
    `resolvedAt` DATETIME(3) NULL,
    `resolvedBy` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `InventoryAlert_productId_idx`(`productId`),
    INDEX `InventoryAlert_isResolved_idx`(`isResolved`),
    INDEX `InventoryAlert_type_idx`(`type`),
    UNIQUE INDEX `InventoryAlert_productId_type_key`(`productId`, `type`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `StockMovement` (
    `id` VARCHAR(191) NOT NULL,
    `productId` VARCHAR(191) NOT NULL,
    `type` VARCHAR(191) NOT NULL,
    `quantity` INTEGER NOT NULL,
    `reason` TEXT NULL,
    `orderId` VARCHAR(191) NULL,
    `userId` VARCHAR(191) NULL,
    `userName` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `StockMovement_productId_idx`(`productId`),
    INDEX `StockMovement_type_idx`(`type`),
    INDEX `StockMovement_createdAt_idx`(`createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ReturnRequest` (
    `id` VARCHAR(191) NOT NULL,
    `orderId` VARCHAR(191) NOT NULL,
    `items` JSON NOT NULL,
    `reason` VARCHAR(191) NOT NULL DEFAULT 'OTHER',
    `notes` TEXT NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'PENDING',
    `refundAmount` DECIMAL(10, 2) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `ReturnRequest_orderId_idx`(`orderId`),
    INDEX `ReturnRequest_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `EmailCampaign` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `subject` VARCHAR(191) NOT NULL,
    `content` LONGTEXT NOT NULL,
    `segmentId` VARCHAR(191) NULL,
    `recipientType` VARCHAR(191) NOT NULL DEFAULT 'all',
    `recipientIds` JSON NULL,
    `scheduledAt` DATETIME(3) NULL,
    `sentAt` DATETIME(3) NULL,
    `totalRecipients` INTEGER NOT NULL DEFAULT 0,
    `sentCount` INTEGER NOT NULL DEFAULT 0,
    `openCount` INTEGER NOT NULL DEFAULT 0,
    `clickCount` INTEGER NOT NULL DEFAULT 0,
    `status` VARCHAR(191) NOT NULL DEFAULT 'draft',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `EmailCampaign_status_idx`(`status`),
    INDEX `EmailCampaign_scheduledAt_idx`(`scheduledAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `BlogPost` (
    `id` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `slug` VARCHAR(191) NOT NULL,
    `excerpt` VARCHAR(500) NULL,
    `content` LONGTEXT NOT NULL,
    `coverImage` VARCHAR(191) NULL,
    `featuredImage` VARCHAR(191) NULL,
    `images` JSON NULL,
    `metaTitle` VARCHAR(191) NULL,
    `metaDesc` TEXT NULL,
    `keywords` JSON NULL,
    `categoryId` VARCHAR(191) NULL,
    `tags` JSON NULL,
    `authorId` VARCHAR(191) NOT NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'draft',
    `publishedAt` DATETIME(3) NULL,
    `scheduledAt` DATETIME(3) NULL,
    `viewCount` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `BlogPost_slug_key`(`slug`),
    INDEX `BlogPost_slug_idx`(`slug`),
    INDEX `BlogPost_status_idx`(`status`),
    INDEX `BlogPost_authorId_idx`(`authorId`),
    INDEX `BlogPost_categoryId_idx`(`categoryId`),
    INDEX `BlogPost_publishedAt_idx`(`publishedAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `BlogCategory` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `slug` VARCHAR(191) NOT NULL,
    `description` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `BlogCategory_slug_key`(`slug`),
    INDEX `BlogCategory_slug_idx`(`slug`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Review` (
    `id` VARCHAR(191) NOT NULL,
    `productId` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `rating` INTEGER NOT NULL,
    `title` VARCHAR(191) NULL,
    `comment` TEXT NULL,
    `verified` BOOLEAN NOT NULL DEFAULT false,
    `approved` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `Review_productId_idx`(`productId`),
    INDEX `Review_userId_idx`(`userId`),
    INDEX `Review_approved_idx`(`approved`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Page` (
    `id` VARCHAR(191) NOT NULL,
    `slug` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `content` LONGTEXT NOT NULL,
    `metaTitle` VARCHAR(191) NULL,
    `metaDesc` TEXT NULL,
    `active` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Page_slug_key`(`slug`),
    INDEX `Page_slug_idx`(`slug`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Media` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `url` VARCHAR(191) NOT NULL,
    `type` ENUM('IMAGE', 'DOCUMENT', 'STL_FILE', 'OTHER') NOT NULL,
    `size` INTEGER NOT NULL,
    `mimeType` VARCHAR(191) NOT NULL,
    `alt` VARCHAR(191) NULL,
    `caption` TEXT NULL,
    `key` VARCHAR(191) NOT NULL,
    `bucket` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `Media_key_key`(`key`),
    INDEX `Media_type_idx`(`type`),
    INDEX `Media_key_idx`(`key`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Setting` (
    `id` VARCHAR(191) NOT NULL,
    `key` VARCHAR(191) NOT NULL,
    `value` TEXT NOT NULL,
    `description` TEXT NULL,
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Setting_key_key`(`key`),
    INDEX `Setting_key_idx`(`key`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `PageView` (
    `id` VARCHAR(191) NOT NULL,
    `path` VARCHAR(191) NOT NULL,
    `visitorId` VARCHAR(191) NOT NULL,
    `sessionId` VARCHAR(191) NOT NULL,
    `userAgent` TEXT NULL,
    `ip` VARCHAR(191) NULL,
    `referrer` TEXT NULL,
    `country` VARCHAR(191) NULL,
    `city` VARCHAR(191) NULL,
    `device` VARCHAR(191) NULL,
    `browser` VARCHAR(191) NULL,
    `os` VARCHAR(191) NULL,
    `duration` INTEGER NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `PageView_path_idx`(`path`),
    INDEX `PageView_visitorId_idx`(`visitorId`),
    INDEX `PageView_sessionId_idx`(`sessionId`),
    INDEX `PageView_createdAt_idx`(`createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Visitor` (
    `id` VARCHAR(191) NOT NULL,
    `visitorId` VARCHAR(191) NOT NULL,
    `firstVisit` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `lastVisit` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `totalVisits` INTEGER NOT NULL DEFAULT 1,
    `userId` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Visitor_visitorId_key`(`visitorId`),
    INDEX `Visitor_visitorId_idx`(`visitorId`),
    INDEX `Visitor_lastVisit_idx`(`lastVisit`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ActiveSession` (
    `id` VARCHAR(191) NOT NULL,
    `sessionId` VARCHAR(191) NOT NULL,
    `visitorId` VARCHAR(191) NOT NULL,
    `lastActive` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `currentPage` VARCHAR(191) NULL,
    `startedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `ip` VARCHAR(191) NULL,
    `country` VARCHAR(191) NULL,
    `countryCode` VARCHAR(191) NULL,
    `region` VARCHAR(191) NULL,
    `city` VARCHAR(191) NULL,
    `latitude` DOUBLE NULL,
    `longitude` DOUBLE NULL,

    UNIQUE INDEX `ActiveSession_sessionId_key`(`sessionId`),
    INDEX `ActiveSession_lastActive_idx`(`lastActive`),
    INDEX `ActiveSession_visitorId_idx`(`visitorId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AbandonedCart` (
    `id` VARCHAR(191) NOT NULL,
    `visitorId` VARCHAR(191) NOT NULL,
    `sessionId` VARCHAR(191) NULL,
    `email` VARCHAR(191) NULL,
    `items` JSON NOT NULL,
    `totalValue` DECIMAL(10, 2) NOT NULL,
    `recoveredAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `AbandonedCart_visitorId_idx`(`visitorId`),
    INDEX `AbandonedCart_email_idx`(`email`),
    INDEX `AbandonedCart_createdAt_idx`(`createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `EmailSignature` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `content` TEXT NOT NULL,
    `isDefault` BOOLEAN NOT NULL DEFAULT false,
    `forAddress` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `EmailSignature_userId_idx`(`userId`),
    INDEX `EmailSignature_forAddress_idx`(`forAddress`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ShippingZone` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `countries` JSON NOT NULL,
    `states` JSON NULL,
    `zipCodes` TEXT NULL,
    `active` BOOLEAN NOT NULL DEFAULT true,
    `priority` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `ShippingZone_active_idx`(`active`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ShippingRate` (
    `id` VARCHAR(191) NOT NULL,
    `zoneId` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NULL,
    `minOrderValue` DECIMAL(10, 2) NULL,
    `maxOrderValue` DECIMAL(10, 2) NULL,
    `minWeight` DECIMAL(10, 2) NULL,
    `maxWeight` DECIMAL(10, 2) NULL,
    `baseRate` DECIMAL(10, 2) NOT NULL,
    `perItemRate` DECIMAL(10, 2) NOT NULL DEFAULT 0,
    `perPoundRate` DECIMAL(10, 2) NOT NULL DEFAULT 0,
    `freeShippingMin` DECIMAL(10, 2) NULL,
    `minDays` INTEGER NOT NULL DEFAULT 3,
    `maxDays` INTEGER NOT NULL DEFAULT 7,
    `carrier` VARCHAR(191) NULL,
    `serviceCode` VARCHAR(191) NULL,
    `active` BOOLEAN NOT NULL DEFAULT true,
    `sortOrder` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `ShippingRate_zoneId_idx`(`zoneId`),
    INDEX `ShippingRate_active_idx`(`active`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `TaxRate` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `country` VARCHAR(191) NOT NULL DEFAULT 'US',
    `state` VARCHAR(191) NULL,
    `zipCode` VARCHAR(191) NULL,
    `city` VARCHAR(191) NULL,
    `rate` DECIMAL(6, 4) NOT NULL,
    `isCompound` BOOLEAN NOT NULL DEFAULT false,
    `includeShipping` BOOLEAN NOT NULL DEFAULT false,
    `priority` INTEGER NOT NULL DEFAULT 0,
    `active` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `TaxRate_country_state_idx`(`country`, `state`),
    INDEX `TaxRate_active_idx`(`active`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ShippingLabel` (
    `id` VARCHAR(191) NOT NULL,
    `orderId` VARCHAR(191) NOT NULL,
    `trackingNumber` VARCHAR(191) NULL,
    `carrier` VARCHAR(191) NOT NULL,
    `service` VARCHAR(191) NOT NULL,
    `labelCost` DECIMAL(10, 2) NOT NULL,
    `insuranceCost` DECIMAL(10, 2) NOT NULL DEFAULT 0,
    `totalCost` DECIMAL(10, 2) NOT NULL,
    `weight` DECIMAL(10, 2) NOT NULL,
    `length` DECIMAL(10, 2) NULL,
    `width` DECIMAL(10, 2) NULL,
    `height` DECIMAL(10, 2) NULL,
    `labelUrl` TEXT NULL,
    `labelData` LONGTEXT NULL,
    `providerLabelId` VARCHAR(191) NULL,
    `providerData` JSON NULL,
    `status` ENUM('PENDING', 'PURCHASED', 'VOIDED', 'USED') NOT NULL DEFAULT 'PENDING',
    `purchasedAt` DATETIME(3) NULL,
    `voidedAt` DATETIME(3) NULL,
    `fromAddress` JSON NOT NULL,
    `toAddress` JSON NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `ShippingLabel_orderId_idx`(`orderId`),
    INDEX `ShippingLabel_trackingNumber_idx`(`trackingNumber`),
    INDEX `ShippingLabel_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `SmsConsent` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `phone` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NULL,
    `ipAddress` VARCHAR(191) NULL,
    `userAgent` TEXT NULL,
    `agreedAt` DATETIME(3) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `SmsConsent_phone_idx`(`phone`),
    INDEX `SmsConsent_agreedAt_idx`(`agreedAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `FinanceExpense` (
    `id` VARCHAR(191) NOT NULL,
    `vendor` VARCHAR(191) NOT NULL,
    `amount` DECIMAL(10, 2) NOT NULL,
    `category` VARCHAR(191) NOT NULL,
    `date` DATETIME(3) NOT NULL,
    `notes` TEXT NULL,
    `recurring` BOOLEAN NOT NULL DEFAULT false,
    `createdBy` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `FinanceExpense_date_idx`(`date`),
    INDEX `FinanceExpense_category_idx`(`category`),
    INDEX `FinanceExpense_recurring_idx`(`recurring`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `FinanceIncome` (
    `id` VARCHAR(191) NOT NULL,
    `source` VARCHAR(191) NOT NULL,
    `amount` DECIMAL(10, 2) NOT NULL,
    `category` VARCHAR(191) NOT NULL,
    `date` DATETIME(3) NOT NULL,
    `notes` TEXT NULL,
    `createdBy` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `FinanceIncome_date_idx`(`date`),
    INDEX `FinanceIncome_category_idx`(`category`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Bill` (
    `id` VARCHAR(191) NOT NULL,
    `vendor` VARCHAR(191) NOT NULL,
    `vendorType` VARCHAR(191) NOT NULL,
    `amount` DECIMAL(10, 2) NOT NULL,
    `dueDate` DATETIME(3) NULL,
    `statementDate` DATETIME(3) NULL,
    `accountNumber` VARCHAR(191) NULL,
    `emailId` VARCHAR(191) NULL,
    `emailSubject` VARCHAR(191) NULL,
    `emailFrom` VARCHAR(191) NULL,
    `emailDate` DATETIME(3) NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'PENDING',
    `paidDate` DATETIME(3) NULL,
    `paidByUserId` VARCHAR(191) NULL,
    `notifiedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Bill_emailId_key`(`emailId`),
    INDEX `Bill_vendor_idx`(`vendor`),
    INDEX `Bill_vendorType_idx`(`vendorType`),
    INDEX `Bill_status_idx`(`status`),
    INDEX `Bill_dueDate_idx`(`dueDate`),
    INDEX `Bill_emailId_idx`(`emailId`),
    INDEX `Bill_createdAt_idx`(`createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `BillPayment` (
    `id` VARCHAR(191) NOT NULL,
    `billId` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `amount` DECIMAL(10, 2) NOT NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'PENDING',
    `paidDate` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `BillPayment_billId_idx`(`billId`),
    INDEX `BillPayment_userId_idx`(`userId`),
    INDEX `BillPayment_status_idx`(`status`),
    UNIQUE INDEX `BillPayment_billId_userId_key`(`billId`, `userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `GmailCredentials` (
    `id` VARCHAR(191) NOT NULL,
    `accountEmail` VARCHAR(191) NOT NULL,
    `accessToken` TEXT NOT NULL,
    `refreshToken` TEXT NOT NULL,
    `tokenExpiry` DATETIME(3) NULL,
    `lastSync` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `GmailCredentials_accountEmail_key`(`accountEmail`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ProcessedEmail` (
    `id` VARCHAR(191) NOT NULL,
    `emailId` VARCHAR(191) NOT NULL,
    `vendor` VARCHAR(191) NULL,
    `billId` VARCHAR(191) NULL,
    `processedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `ProcessedEmail_emailId_key`(`emailId`),
    INDEX `ProcessedEmail_emailId_idx`(`emailId`),
    INDEX `ProcessedEmail_processedAt_idx`(`processedAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `BlockedBillSender` (
    `id` VARCHAR(191) NOT NULL,
    `pattern` VARCHAR(191) NOT NULL,
    `patternType` VARCHAR(191) NOT NULL DEFAULT 'sender',
    `reason` VARCHAR(191) NULL,
    `blockedBillId` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `createdBy` VARCHAR(191) NULL,

    INDEX `BlockedBillSender_pattern_idx`(`pattern`),
    INDEX `BlockedBillSender_patternType_idx`(`patternType`),
    UNIQUE INDEX `BlockedBillSender_pattern_patternType_key`(`pattern`, `patternType`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `BankBalance` (
    `id` VARCHAR(191) NOT NULL,
    `bank` VARCHAR(191) NOT NULL,
    `accountType` VARCHAR(191) NOT NULL,
    `accountLast4` VARCHAR(191) NULL,
    `balance` DECIMAL(12, 2) NOT NULL,
    `emailSubject` VARCHAR(191) NULL,
    `emailDate` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `BankBalance_bank_idx`(`bank`),
    INDEX `BankBalance_accountType_idx`(`accountType`),
    INDEX `BankBalance_createdAt_idx`(`createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `RecurringBill` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `vendor` VARCHAR(191) NOT NULL,
    `amountType` VARCHAR(191) NOT NULL,
    `fixedAmount` DECIMAL(10, 2) NULL,
    `frequency` VARCHAR(191) NOT NULL,
    `dueDay` INTEGER NOT NULL,
    `emailPatterns` JSON NOT NULL,
    `paymentMethod` VARCHAR(191) NULL,
    `vendorType` VARCHAR(191) NOT NULL,
    `active` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `RecurringBill_active_idx`(`active`),
    INDEX `RecurringBill_vendor_idx`(`vendor`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `BillInstance` (
    `id` VARCHAR(191) NOT NULL,
    `recurringBillId` VARCHAR(191) NULL,
    `vendor` VARCHAR(191) NOT NULL,
    `vendorType` VARCHAR(191) NOT NULL,
    `amount` DECIMAL(10, 2) NOT NULL,
    `dueDate` DATETIME(3) NOT NULL,
    `period` VARCHAR(191) NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'PENDING',
    `paidDate` DATETIME(3) NULL,
    `paidVia` VARCHAR(191) NULL,
    `emailId` VARCHAR(191) NULL,
    `emailSubject` VARCHAR(191) NULL,
    `emailFrom` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `BillInstance_emailId_key`(`emailId`),
    INDEX `BillInstance_recurringBillId_idx`(`recurringBillId`),
    INDEX `BillInstance_status_idx`(`status`),
    INDEX `BillInstance_dueDate_idx`(`dueDate`),
    INDEX `BillInstance_period_idx`(`period`),
    INDEX `BillInstance_emailId_idx`(`emailId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `FounderPayment` (
    `id` VARCHAR(191) NOT NULL,
    `billInstanceId` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `amount` DECIMAL(10, 2) NOT NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'PENDING',
    `paidDate` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `FounderPayment_billInstanceId_idx`(`billInstanceId`),
    INDEX `FounderPayment_userId_idx`(`userId`),
    INDEX `FounderPayment_status_idx`(`status`),
    UNIQUE INDEX `FounderPayment_billInstanceId_userId_key`(`billInstanceId`, `userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `PushToken` (
    `id` VARCHAR(191) NOT NULL,
    `token` VARCHAR(191) NOT NULL,
    `platform` VARCHAR(191) NOT NULL,
    `deviceName` VARCHAR(191) NULL,
    `active` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `PushToken_token_key`(`token`),
    INDEX `PushToken_active_idx`(`active`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `EmailLog` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `userName` VARCHAR(191) NOT NULL,
    `fromAddress` VARCHAR(191) NOT NULL,
    `toAddress` VARCHAR(191) NOT NULL,
    `ccAddress` VARCHAR(191) NULL,
    `bccAddress` VARCHAR(191) NULL,
    `subject` VARCHAR(191) NOT NULL,
    `zohoMessageId` VARCHAR(191) NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'sent',
    `error` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `EmailLog_userId_idx`(`userId`),
    INDEX `EmailLog_fromAddress_idx`(`fromAddress`),
    INDEX `EmailLog_createdAt_idx`(`createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
