-- CreateTable
CREATE TABLE `users` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `uuid` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `password_hash` VARCHAR(191) NOT NULL,
    `role` ENUM('SUPER_ADMIN', 'SALES_STAFF', 'RENTAL_STAFF') NOT NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    `deleted_at` DATETIME(3) NULL,
    `created_by_id` INTEGER NULL,

    UNIQUE INDEX `users_uuid_key`(`uuid`),
    UNIQUE INDEX `users_email_key`(`email`),
    INDEX `users_role_is_active_deleted_at_idx`(`role`, `is_active`, `deleted_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `vehicles` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `slug` VARCHAR(191) NOT NULL,
    `make` VARCHAR(191) NOT NULL,
    `model` VARCHAR(191) NOT NULL,
    `year` INTEGER NOT NULL,
    `color` VARCHAR(191) NOT NULL,
    `vin` VARCHAR(191) NULL,
    `plate_number` VARCHAR(191) NULL,
    `chassis_number` VARCHAR(191) NULL,
    `engine_number` VARCHAR(191) NULL,
    `type` ENUM('SALE', 'RENTAL', 'BOTH') NOT NULL,
    `status` ENUM('AVAILABLE', 'SOLD', 'RENTED', 'MAINTENANCE') NOT NULL DEFAULT 'AVAILABLE',
    `is_featured` BOOLEAN NOT NULL DEFAULT false,
    `is_new_arrival` BOOLEAN NOT NULL DEFAULT true,
    `mileage` INTEGER NULL,
    `transmission` ENUM('MANUAL', 'AUTOMATIC', 'CVT') NULL,
    `fuel_type` ENUM('GASOLINE', 'DIESEL', 'HYBRID', 'ELECTRIC') NULL,
    `description` TEXT NULL,
    `meta_title` VARCHAR(191) NULL,
    `meta_description` TEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    `deleted_at` DATETIME(3) NULL,
    `created_by_id` INTEGER NULL,

    UNIQUE INDEX `vehicles_slug_key`(`slug`),
    UNIQUE INDEX `vehicles_vin_key`(`vin`),
    UNIQUE INDEX `vehicles_plate_number_key`(`plate_number`),
    UNIQUE INDEX `vehicles_chassis_number_key`(`chassis_number`),
    UNIQUE INDEX `vehicles_engine_number_key`(`engine_number`),
    INDEX `vehicles_type_idx`(`type`),
    INDEX `vehicles_status_idx`(`status`),
    INDEX `vehicles_status_type_deleted_at_idx`(`status`, `type`, `deleted_at`),
    INDEX `vehicles_status_is_featured_deleted_at_idx`(`status`, `is_featured`, `deleted_at`),
    INDEX `vehicles_mileage_idx`(`mileage`),
    INDEX `vehicles_transmission_idx`(`transmission`),
    INDEX `vehicles_fuel_type_idx`(`fuel_type`),
    FULLTEXT INDEX `vehicles_make_model_idx`(`make`, `model`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `vehicle_images` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `vehicle_id` INTEGER NOT NULL,
    `cloudinary_url` VARCHAR(191) NOT NULL,
    `cloudinary_public_id` VARCHAR(191) NOT NULL,
    `is_primary` BOOLEAN NOT NULL DEFAULT false,
    `sort_order` INTEGER NOT NULL DEFAULT 0,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    `created_by_id` INTEGER NULL,

    UNIQUE INDEX `vehicle_images_cloudinary_public_id_key`(`cloudinary_public_id`),
    INDEX `vehicle_images_vehicle_id_is_primary_idx`(`vehicle_id`, `is_primary`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `vehicle_inspections` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `vehicle_id` INTEGER NOT NULL,
    `inspection_date` DATETIME(3) NOT NULL,
    `inspector_name` VARCHAR(191) NOT NULL,
    `engine_status` ENUM('PASS', 'FAIL', 'NEEDS_ATTENTION') NOT NULL,
    `transmission_status` ENUM('PASS', 'FAIL', 'NEEDS_ATTENTION') NOT NULL,
    `suspension_status` ENUM('PASS', 'FAIL', 'NEEDS_ATTENTION') NOT NULL,
    `electrical_status` ENUM('PASS', 'FAIL', 'NEEDS_ATTENTION') NOT NULL,
    `ac_status` ENUM('PASS', 'FAIL', 'NEEDS_ATTENTION') NOT NULL,
    `tires_status` ENUM('PASS', 'FAIL', 'NEEDS_ATTENTION') NOT NULL,
    `interior_status` ENUM('PASS', 'FAIL', 'NEEDS_ATTENTION') NOT NULL,
    `exterior_status` ENUM('PASS', 'FAIL', 'NEEDS_ATTENTION') NOT NULL,
    `general_notes` TEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    `deleted_at` DATETIME(3) NULL,
    `created_by_id` INTEGER NULL,

    INDEX `vehicle_inspections_vehicle_id_idx`(`vehicle_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `sales_listings` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `vehicle_id` INTEGER NOT NULL,
    `price` DECIMAL(15, 2) NOT NULL,
    `previous_owners` INTEGER NOT NULL DEFAULT 0,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    `deleted_at` DATETIME(3) NULL,
    `created_by_id` INTEGER NULL,

    UNIQUE INDEX `sales_listings_vehicle_id_key`(`vehicle_id`),
    INDEX `sales_listings_price_idx`(`price`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `rental_listings` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `vehicle_id` INTEGER NOT NULL,
    `daily_rate` DECIMAL(15, 2) NOT NULL,
    `weekly_rate` DECIMAL(15, 2) NULL,
    `deposit_amount` DECIMAL(15, 2) NOT NULL,
    `is_long_term_eligible` BOOLEAN NOT NULL DEFAULT false,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    `deleted_at` DATETIME(3) NULL,
    `created_by_id` INTEGER NULL,

    UNIQUE INDEX `rental_listings_vehicle_id_key`(`vehicle_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `leads` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `lead_reference_id` VARCHAR(191) NOT NULL,
    `vehicle_id` INTEGER NOT NULL,
    `assigned_to_id` INTEGER NULL,
    `customer_name` VARCHAR(191) NOT NULL,
    `customer_phone` VARCHAR(191) NOT NULL,
    `customer_email` VARCHAR(191) NULL,
    `type` ENUM('SALES_INQUIRY', 'TEST_DRIVE_REQUEST', 'MAKE_OFFER', 'RENTAL_INQUIRY', 'LONG_TERM_QUOTE') NOT NULL,
    `offered_price` DECIMAL(15, 2) NULL,
    `source` ENUM('ORGANIC', 'GOOGLE_ADS', 'FACEBOOK', 'INSTAGRAM', 'DIRECT', 'WHATSAPP', 'REFERRAL') NULL,
    `status` ENUM('NEW', 'CONTACTED', 'NEGOTIATING', 'TEST_DRIVE_SCHEDULED', 'WON', 'LOST') NOT NULL DEFAULT 'NEW',
    `message` TEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    `deleted_at` DATETIME(3) NULL,
    `created_by_id` INTEGER NULL,

    UNIQUE INDEX `leads_lead_reference_id_key`(`lead_reference_id`),
    INDEX `leads_vehicle_id_idx`(`vehicle_id`),
    INDEX `leads_assigned_to_id_idx`(`assigned_to_id`),
    INDEX `leads_assigned_to_id_status_deleted_at_idx`(`assigned_to_id`, `status`, `deleted_at`),
    INDEX `leads_status_idx`(`status`),
    INDEX `leads_customer_email_idx`(`customer_email`),
    INDEX `leads_source_idx`(`source`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `lead_followups` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `lead_id` INTEGER NOT NULL,
    `user_id` INTEGER NOT NULL,
    `note_text` TEXT NOT NULL,
    `interaction_date` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    `deleted_at` DATETIME(3) NULL,

    INDEX `lead_followups_lead_id_idx`(`lead_id`),
    INDEX `lead_followups_user_id_idx`(`user_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `rental_bookings` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `rental_listing_id` INTEGER NOT NULL,
    `customer_name` VARCHAR(191) NOT NULL,
    `customer_phone` VARCHAR(191) NOT NULL,
    `customer_email` VARCHAR(191) NOT NULL,
    `identity_number` VARCHAR(191) NULL,
    `license_image_url` VARCHAR(191) NULL,
    `start_date` DATETIME(3) NOT NULL,
    `end_date` DATETIME(3) NOT NULL,
    `payment_method_id` INTEGER NOT NULL,
    `total_price` DECIMAL(15, 2) NOT NULL,
    `status` ENUM('PENDING_PAYMENT', 'CONFIRMED', 'ACTIVE', 'COMPLETED', 'CANCELLED', 'OVERDUE') NOT NULL DEFAULT 'PENDING_PAYMENT',
    `whatsapp_opt_in` BOOLEAN NOT NULL DEFAULT false,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    `deleted_at` DATETIME(3) NULL,
    `created_by_id` INTEGER NULL,

    INDEX `rental_bookings_rental_listing_id_idx`(`rental_listing_id`),
    INDEX `rental_bookings_rental_listing_id_status_start_date_end_date_idx`(`rental_listing_id`, `status`, `start_date`, `end_date`),
    INDEX `rental_bookings_payment_method_id_idx`(`payment_method_id`),
    INDEX `rental_bookings_start_date_end_date_idx`(`start_date`, `end_date`),
    INDEX `rental_bookings_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `blackout_dates` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `vehicle_id` INTEGER NOT NULL,
    `start_date` DATETIME(3) NOT NULL,
    `end_date` DATETIME(3) NOT NULL,
    `reason` ENUM('MAINTENANCE', 'ADMIN_BLOCK') NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    `deleted_at` DATETIME(3) NULL,
    `created_by_id` INTEGER NULL,

    INDEX `blackout_dates_vehicle_id_idx`(`vehicle_id`),
    INDEX `blackout_dates_start_date_end_date_idx`(`start_date`, `end_date`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `vehicle_analytics` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `vehicle_id` INTEGER NOT NULL,
    `view_count` INTEGER NOT NULL DEFAULT 0,
    `inquiry_count` INTEGER NOT NULL DEFAULT 0,
    `offer_count` INTEGER NOT NULL DEFAULT 0,
    `rental_request_count` INTEGER NOT NULL DEFAULT 0,
    `last_updated` DATETIME(3) NOT NULL,

    UNIQUE INDEX `vehicle_analytics_vehicle_id_key`(`vehicle_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `audit_logs` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `user_id` INTEGER NULL,
    `action` ENUM('CREATE', 'UPDATE', 'DELETE', 'RESTORE') NOT NULL,
    `module_name` VARCHAR(191) NOT NULL,
    `record_id` INTEGER NOT NULL,
    `previous_value` JSON NULL,
    `new_value` JSON NULL,
    `timestamp` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `audit_logs_module_name_record_id_idx`(`module_name`, `record_id`),
    INDEX `audit_logs_user_id_idx`(`user_id`),
    INDEX `audit_logs_timestamp_idx`(`timestamp`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `payment_methods` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `type` VARCHAR(191) NOT NULL,
    `instructions` TEXT NOT NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    `deleted_at` DATETIME(3) NULL,
    `created_by_id` INTEGER NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `testimonials` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `author_name` VARCHAR(191) NOT NULL,
    `author_title` VARCHAR(191) NULL,
    `rating` INTEGER NOT NULL,
    `quote_text` TEXT NOT NULL,
    `is_published` BOOLEAN NOT NULL DEFAULT false,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    `deleted_at` DATETIME(3) NULL,
    `created_by_id` INTEGER NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `homepage_content` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `key` VARCHAR(191) NOT NULL,
    `value` JSON NOT NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    `deleted_at` DATETIME(3) NULL,
    `created_by_id` INTEGER NULL,

    UNIQUE INDEX `homepage_content_key_key`(`key`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `vehicle_images` ADD CONSTRAINT `vehicle_images_vehicle_id_fkey` FOREIGN KEY (`vehicle_id`) REFERENCES `vehicles`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `vehicle_inspections` ADD CONSTRAINT `vehicle_inspections_vehicle_id_fkey` FOREIGN KEY (`vehicle_id`) REFERENCES `vehicles`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `sales_listings` ADD CONSTRAINT `sales_listings_vehicle_id_fkey` FOREIGN KEY (`vehicle_id`) REFERENCES `vehicles`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `rental_listings` ADD CONSTRAINT `rental_listings_vehicle_id_fkey` FOREIGN KEY (`vehicle_id`) REFERENCES `vehicles`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `leads` ADD CONSTRAINT `leads_vehicle_id_fkey` FOREIGN KEY (`vehicle_id`) REFERENCES `vehicles`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `leads` ADD CONSTRAINT `leads_assigned_to_id_fkey` FOREIGN KEY (`assigned_to_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `lead_followups` ADD CONSTRAINT `lead_followups_lead_id_fkey` FOREIGN KEY (`lead_id`) REFERENCES `leads`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `lead_followups` ADD CONSTRAINT `lead_followups_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `rental_bookings` ADD CONSTRAINT `rental_bookings_rental_listing_id_fkey` FOREIGN KEY (`rental_listing_id`) REFERENCES `rental_listings`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `rental_bookings` ADD CONSTRAINT `rental_bookings_payment_method_id_fkey` FOREIGN KEY (`payment_method_id`) REFERENCES `payment_methods`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `blackout_dates` ADD CONSTRAINT `blackout_dates_vehicle_id_fkey` FOREIGN KEY (`vehicle_id`) REFERENCES `vehicles`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `vehicle_analytics` ADD CONSTRAINT `vehicle_analytics_vehicle_id_fkey` FOREIGN KEY (`vehicle_id`) REFERENCES `vehicles`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
