-- Clear existing service packages
DELETE FROM ServicePackage;

-- Web Development Packages
INSERT INTO ServicePackage (id, name, slug, category, price, priceDisplay, billingType, shortDesc, description, features, isPopular, isActive, sortOrder, badge, estimatedWeeks, createdAt, updatedAt)
VALUES
(UUID(), 'Starter', 'web-starter', 'WEB_DEVELOPMENT', 2500.00, '$2,500', 'one_time',
'Perfect for small businesses and startups',
'A professional website to establish your online presence. Includes responsive design, basic SEO optimization, and fast hosting setup.',
'["Up to 5 pages", "Responsive design", "Basic SEO", "Contact form", "Fast hosting setup", "1 month support"]',
0, 1, 1, NULL, 2, NOW(), NOW()),

(UUID(), 'Professional', 'web-professional', 'WEB_DEVELOPMENT', 5000.00, '$5,000', 'one_time',
'Advanced features for growing businesses',
'A feature-rich website with custom design, CMS integration, and e-commerce capabilities. Perfect for businesses ready to scale.',
'["Up to 15 pages", "Custom design", "Advanced SEO", "CMS integration", "E-commerce ready", "Analytics setup", "3 months support"]',
1, 1, 2, 'MOST POPULAR', 4, NOW(), NOW()),

(UUID(), 'Enterprise', 'web-enterprise', 'WEB_DEVELOPMENT', NULL, 'Custom', 'one_time',
'Full-scale web applications',
'Custom-built web applications with unlimited pages, advanced integrations, and dedicated support. Perfect for large organizations.',
'["Unlimited pages", "Custom features", "Advanced integrations", "Performance optimization", "Security hardening", "Dedicated support", "12 months support"]',
0, 1, 3, NULL, 8, NOW(), NOW()),

-- iOS App Packages
(UUID(), 'Basic', 'ios-basic', 'IOS_APP', 8000.00, '$8,000', 'one_time',
'Simple iOS app for startups',
'A native iOS application with essential features. Perfect for MVPs and proof of concept.',
'["Up to 5 screens", "Native iOS design", "Basic authentication", "Push notifications", "App Store submission", "1 month support"]',
0, 1, 1, NULL, 6, NOW(), NOW()),

(UUID(), 'Standard', 'ios-standard', 'IOS_APP', 15000.00, '$15,000', 'one_time',
'Full-featured iOS application',
'A comprehensive iOS app with custom UI, backend integration, and advanced features.',
'["Up to 15 screens", "Custom UI/UX design", "User authentication", "API integration", "In-app purchases", "Analytics integration", "3 months support"]',
1, 1, 2, 'MOST POPULAR', 10, NOW(), NOW()),

(UUID(), 'Enterprise', 'ios-enterprise', 'IOS_APP', NULL, 'Custom', 'one_time',
'Complex enterprise iOS solutions',
'Enterprise-grade iOS applications with complex features, integrations, and ongoing support.',
'["Unlimited screens", "Complex integrations", "Offline functionality", "Enterprise security", "Custom backend", "Dedicated support", "12 months support"]',
0, 1, 3, NULL, 16, NOW(), NOW()),

-- Android App Packages
(UUID(), 'Basic', 'android-basic', 'ANDROID_APP', 7500.00, '$7,500', 'one_time',
'Simple Android app for startups',
'A native Android application with essential features. Perfect for MVPs and proof of concept.',
'["Up to 5 screens", "Material Design UI", "Basic authentication", "Push notifications", "Play Store submission", "1 month support"]',
0, 1, 1, NULL, 6, NOW(), NOW()),

(UUID(), 'Standard', 'android-standard', 'ANDROID_APP', 14000.00, '$14,000', 'one_time',
'Full-featured Android application',
'A comprehensive Android app with custom UI, backend integration, and advanced features.',
'["Up to 15 screens", "Custom UI/UX design", "User authentication", "API integration", "In-app purchases", "Analytics integration", "3 months support"]',
1, 1, 2, 'MOST POPULAR', 10, NOW(), NOW()),

(UUID(), 'Enterprise', 'android-enterprise', 'ANDROID_APP', NULL, 'Custom', 'one_time',
'Complex enterprise Android solutions',
'Enterprise-grade Android applications with complex features, integrations, and ongoing support.',
'["Unlimited screens", "Complex integrations", "Offline functionality", "Enterprise security", "Custom backend", "Dedicated support", "12 months support"]',
0, 1, 3, NULL, 16, NOW(), NOW()),

-- Cross-Platform App Packages
(UUID(), 'Starter', 'cross-platform-starter', 'CROSS_PLATFORM_APP', 12000.00, '$12,000', 'one_time',
'iOS & Android from one codebase',
'A cross-platform mobile app using React Native. Deploy to both iOS and Android from a single codebase.',
'["Up to 8 screens", "iOS & Android", "Shared codebase", "Basic authentication", "Push notifications", "Store submissions", "2 months support"]',
0, 1, 1, NULL, 8, NOW(), NOW()),

(UUID(), 'Professional', 'cross-platform-professional', 'CROSS_PLATFORM_APP', 22000.00, '$22,000', 'one_time',
'Feature-rich cross-platform app',
'A comprehensive cross-platform app with custom design, advanced features, and backend integration.',
'["Up to 20 screens", "iOS & Android", "Custom UI/UX design", "API integration", "In-app purchases", "Offline support", "Analytics", "4 months support"]',
1, 1, 2, 'BEST VALUE', 12, NOW(), NOW()),

(UUID(), 'Enterprise', 'cross-platform-enterprise', 'CROSS_PLATFORM_APP', NULL, 'Custom', 'one_time',
'Enterprise cross-platform solutions',
'Enterprise-grade cross-platform applications with complex features and dedicated support.',
'["Unlimited screens", "iOS & Android", "Complex integrations", "Enterprise security", "Custom backend", "Performance optimization", "Dedicated support", "12 months support"]',
0, 1, 3, NULL, 20, NOW(), NOW()),

-- Desktop App Packages
(UUID(), 'Basic', 'desktop-basic', 'DESKTOP_APP', 10000.00, '$10,000', 'one_time',
'Simple desktop application',
'A cross-platform desktop application using Electron. Works on Windows, macOS, and Linux.',
'["Single platform", "Basic UI/UX", "Local data storage", "Auto-updates", "Installer package", "1 month support"]',
0, 1, 1, NULL, 6, NOW(), NOW()),

(UUID(), 'Professional', 'desktop-professional', 'DESKTOP_APP', 20000.00, '$20,000', 'one_time',
'Full-featured desktop application',
'A feature-rich desktop application with cloud sync, API integration, and multi-platform support.',
'["Windows & macOS", "Custom UI/UX design", "Cloud synchronization", "API integration", "Database support", "Auto-updates", "3 months support"]',
1, 1, 2, 'MOST POPULAR', 10, NOW(), NOW()),

(UUID(), 'Enterprise', 'desktop-enterprise', 'DESKTOP_APP', NULL, 'Custom', 'one_time',
'Enterprise desktop solutions',
'Enterprise-grade desktop applications with advanced features, security, and dedicated support.',
'["All platforms", "Complex integrations", "Enterprise security", "Custom backend", "License management", "Dedicated support", "12 months support"]',
0, 1, 3, NULL, 16, NOW(), NOW()),

-- 3D Printing Packages
(UUID(), 'Single Print', '3d-single-print', 'THREE_D_PRINTING', 25.00, 'From $25', 'one_time',
'One-off custom 3D prints',
'Perfect for prototypes, gifts, or single custom items. Upload your STL file and we will bring it to life.',
'["Any STL file accepted", "Multiple materials", "Various colors", "Quality finishing", "Fast turnaround", "Shipping included"]',
0, 1, 1, NULL, NULL, NOW(), NOW()),

(UUID(), 'Small Batch', '3d-small-batch', 'THREE_D_PRINTING', 200.00, 'From $200', 'one_time',
'Small production runs',
'Ideal for small businesses, Etsy sellers, or limited edition items. Consistent quality across all units.',
'["10-50 identical units", "Bulk pricing discount", "Consistent quality", "Multiple materials", "Custom packaging", "Priority support"]',
1, 1, 2, 'POPULAR', NULL, NOW(), NOW()),

(UUID(), 'Production Run', '3d-production-run', 'THREE_D_PRINTING', NULL, 'Custom Quote', 'one_time',
'Large-scale manufacturing',
'Full production runs for businesses. Volume discounts, quality assurance, and dedicated project management.',
'["50+ units", "Volume discounts", "Quality assurance", "Dedicated manager", "Custom materials", "Flexible scheduling", "White-label packaging"]',
0, 1, 3, NULL, 4, NOW(), NOW());
