<?php
declare(strict_types=1);

/**
 * Email Configuration
 * Configure your SMTP settings here
 */

// SMTP Configuration
global $EMAIL_CONFIG, $EMAIL_TEMPLATES;

$EMAIL_CONFIG = [
    // SMTP Server settings
    'smtp_host'     => 'smtp.gmail.com',          // SMTP server (e.g., smtp.gmail.com, smtp-mail.outlook.com)
    'smtp_port'     => 587,                       // SMTP port (587 for TLS, 465 for SSL, 25 for no encryption)
    'smtp_security' => 'tls',                     // Security protocol: 'tls', 'ssl', or '' for none
    
    // Authentication
    'smtp_username' => 'erbienbi.tma@gmail.com',                        // Your email address
    'smtp_password' => 'mvhv kqqz moes ffrz',                        // Your email password or app password
    
    // Email sender settings
    'from_email'    => 'erbienbi.tma@gmail.com',                        // Sender email (usually same as smtp_username)
    'from_name'     => 'ErBienBi - Reservas',     // Sender name
    
    // Email settings
    'charset'       => 'UTF-8',
    'encoding'      => 'base64',
    
    // Debug settings (set to true for development)
    'debug'         => false,                     // Enable SMTP debug output
    'test_mode'     => false,                     // If true, emails will be logged instead of sent
];

/**
 * Email Templates Configuration
 */
$EMAIL_TEMPLATES = [
    'new_reservation' => [
        'subject' => 'Nueva reserva recibida - ErBienBi',
        'template_file' => 'email_templates/new_reservation.html'
    ]
];

/**
 * Validate email configuration
 */
function validateEmailConfig(): array {
    global $EMAIL_CONFIG;
    
    $errors = [];
    
    if (empty($EMAIL_CONFIG['smtp_host'])) {
        $errors[] = 'SMTP host is required';
    }
    
    if (empty($EMAIL_CONFIG['smtp_username'])) {
        $errors[] = 'SMTP username is required';
    }
    
    if (empty($EMAIL_CONFIG['smtp_password'])) {
        $errors[] = 'SMTP password is required';
    }
    
    if (empty($EMAIL_CONFIG['from_email'])) {
        $errors[] = 'From email is required';
    }
    
    if (!filter_var($EMAIL_CONFIG['from_email'], FILTER_VALIDATE_EMAIL)) {
        $errors[] = 'From email is not valid';
    }
    
    return $errors;
}
