<?php
declare(strict_types=1);

/**
 * Email Service Class
 * Handles sending emails using SMTP
 * 
 * This class provides a simple interface for sending emails
 * without requiring external dependencies like PHPMailer.
 * It uses PHP's built-in mail() function with SMTP configuration.
 */
class EmailService {
    
    private array $config;
    private array $templates;
    
    public function __construct() {
        require_once __DIR__ . '/email_config.php';
        global $EMAIL_CONFIG, $EMAIL_TEMPLATES;
        
        // Ensure we have valid arrays
        $this->config = $EMAIL_CONFIG ?? [];
        $this->templates = $EMAIL_TEMPLATES ?? [];
        
        // Check if config is empty
        if (empty($this->config)) {
            throw new Exception('Email configuration not found. Please check email_config.php');
        }
        
        // Validate configuration
        $errors = validateEmailConfig();
        if (!empty($errors)) {
            throw new Exception('Email configuration errors: ' . implode(', ', $errors));
        }
    }
    
    /**
     * Send an email using SMTP
     */
    public function sendEmail(string $to, string $toName, string $subject, string $htmlBody, string $textBody = ''): bool {
        try {
            // If in test mode, just log the email
            if ($this->config['test_mode']) {
                return $this->logEmail($to, $toName, $subject, $htmlBody);
            }
            
            // Use proper SMTP implementation for Gmail and other secure servers
            return $this->sendViaSMTP($to, $toName, $subject, $htmlBody, $textBody);
            
        } catch (Exception $e) {
            error_log("Email sending error: " . $e->getMessage());
            return false;
        }
    }
    
    /**
     * Send email via proper SMTP connection with authentication
     */
    private function sendViaSMTP(string $to, string $toName, string $subject, string $htmlBody, string $textBody = ''): bool {
        // Try STARTTLS first
        $starttls_result = $this->sendViaSMTPWithSTARTTLS($to, $toName, $subject, $htmlBody, $textBody);
        
        if ($starttls_result) {
            if ($this->config['debug']) {
                error_log("Email successfully sent via STARTTLS");
            }
            return true;
        }
        
        // If STARTTLS fails, try direct SSL connection
        if ($this->config['debug']) {
            error_log("STARTTLS failed, trying direct SSL connection...");
        }
        
        $ssl_result = $this->sendViaSMTPWithSSL($to, $toName, $subject, $htmlBody, $textBody);
        
        if ($ssl_result && $this->config['debug']) {
            error_log("Email successfully sent via direct SSL");
        }
        
        return $ssl_result;
    }
    
    /**
     * Send email via SMTP with STARTTLS
     */
    private function sendViaSMTPWithSTARTTLS(string $to, string $toName, string $subject, string $htmlBody, string $textBody = ''): bool {
        $smtp_host = $this->config['smtp_host'];
        $smtp_port = (int)$this->config['smtp_port'];
        $smtp_username = $this->config['smtp_username'];
        $smtp_password = $this->config['smtp_password'];
        $from_email = $this->config['from_email'];
        $from_name = $this->config['from_name'];
        
        // Create SSL context with proper options for Gmail
        $context = stream_context_create([
            'ssl' => [
                'verify_peer' => false,
                'verify_peer_name' => false,
                'allow_self_signed' => true,
                'crypto_method' => STREAM_CRYPTO_METHOD_TLS_CLIENT
            ]
        ]);
        
        // Create socket connection
        $socket = stream_socket_client("tcp://$smtp_host:$smtp_port", $errno, $errstr, 30, STREAM_CLIENT_CONNECT, $context);
        if (!$socket) {
            error_log("SMTP connection failed: $errstr ($errno)");
            return false;
        }
        
        // Read initial response
        $response = $this->readSMTPResponse($socket);
        if ($this->config['debug']) {
            error_log("SMTP Initial: " . trim($response));
        }
        
        // Send EHLO command
        $hostname = $_SERVER['HTTP_HOST'] ?? $_SERVER['SERVER_NAME'] ?? 'localhost';
        fputs($socket, "EHLO $hostname\r\n");
        $response = $this->readSMTPResponse($socket);
        if ($this->config['debug']) {
            error_log("SMTP EHLO: " . trim($response));
        }
        
        // Start TLS if required
        if ($this->config['smtp_security'] === 'tls') {
            fputs($socket, "STARTTLS\r\n");
            $response = $this->readSMTPResponse($socket);
            if ($this->config['debug']) {
                error_log("SMTP STARTTLS: " . trim($response));
            }
            
            // Enable crypto with multiple fallback methods
            $crypto_methods = [
                STREAM_CRYPTO_METHOD_TLSv1_2_CLIENT,
                STREAM_CRYPTO_METHOD_TLSv1_3_CLIENT,
                STREAM_CRYPTO_METHOD_TLS_CLIENT
            ];
            
            $crypto_enabled = false;
            foreach ($crypto_methods as $method) {
                if (stream_socket_enable_crypto($socket, true, $method)) {
                    $crypto_enabled = true;
                    if ($this->config['debug']) {
                        error_log("TLS enabled with method: " . $method);
                    }
                    break;
                }
            }
            
            if (!$crypto_enabled) {
                error_log("Failed to enable TLS encryption with any method");
                fclose($socket);
                return false;
            }
            
            // Send EHLO again after TLS
            fputs($socket, "EHLO $hostname\r\n");
            $response = $this->readSMTPResponse($socket);
            if ($this->config['debug']) {
                error_log("SMTP EHLO after TLS: " . trim($response));
            }
        }
        
        // Authenticate
        fputs($socket, "AUTH LOGIN\r\n");
        $response = $this->readSMTPResponse($socket);
        if ($this->config['debug']) {
            error_log("SMTP AUTH LOGIN: " . trim($response));
        }
        
        // Send username
        fputs($socket, base64_encode($smtp_username) . "\r\n");
        $response = $this->readSMTPResponse($socket);
        if ($this->config['debug']) {
            error_log("SMTP Username: " . trim($response));
        }
        
        // Send password
        fputs($socket, base64_encode($smtp_password) . "\r\n");
        $response = $this->readSMTPResponse($socket);
        if ($this->config['debug']) {
            error_log("SMTP Password: " . trim($response));
        }
        
        // Check if authentication was successful
        if (!str_starts_with($response, '235')) {
            error_log("SMTP Authentication failed: " . trim($response));
            fclose($socket);
            return false;
        }
        
        // Send MAIL FROM
        fputs($socket, "MAIL FROM: <$from_email>\r\n");
        $response = $this->readSMTPResponse($socket);
        if ($this->config['debug']) {
            error_log("SMTP MAIL FROM: " . trim($response));
        }
        
        // Send RCPT TO
        fputs($socket, "RCPT TO: <$to>\r\n");
        $response = $this->readSMTPResponse($socket);
        if ($this->config['debug']) {
            error_log("SMTP RCPT TO: " . trim($response));
        }
        
        // Send DATA command
        fputs($socket, "DATA\r\n");
        $response = $this->readSMTPResponse($socket);
        if ($this->config['debug']) {
            error_log("SMTP DATA: " . trim($response));
        }
        
        // Build email headers and body
        $email_data = $this->buildEmailData($to, $toName, $subject, $htmlBody, $textBody);
        
        // Send email data
        fputs($socket, $email_data);
        fputs($socket, "\r\n.\r\n");
        $send_response = $this->readSMTPResponse($socket);
        if ($this->config['debug']) {
            error_log("SMTP Send: " . trim($send_response));
        }
        
        // Send QUIT
        fputs($socket, "QUIT\r\n");
        $quit_response = $this->readSMTPResponse($socket);
        if ($this->config['debug']) {
            error_log("SMTP QUIT: " . trim($quit_response));
        }
        
        // Close connection
        fclose($socket);
        
        // Check if email was sent successfully (check the send response, not quit response)
        $success = str_starts_with($send_response, '250');
        
        if ($this->config['debug']) {
            error_log("Email sent to {$to}: " . ($success ? 'SUCCESS' : 'FAILED'));
        }
        
        return $success;
    }
    
    /**
     * Send email via SMTP with direct SSL connection (fallback method)
     */
    private function sendViaSMTPWithSSL(string $to, string $toName, string $subject, string $htmlBody, string $textBody = ''): bool {
        $smtp_host = $this->config['smtp_host'];
        $smtp_port = 465; // Use SSL port for Gmail
        $smtp_username = $this->config['smtp_username'];
        $smtp_password = $this->config['smtp_password'];
        $from_email = $this->config['from_email'];
        $from_name = $this->config['from_name'];
        
        // Create SSL context
        $context = stream_context_create([
            'ssl' => [
                'verify_peer' => false,
                'verify_peer_name' => false,
                'allow_self_signed' => true
            ]
        ]);
        
        // Create direct SSL connection
        $socket = stream_socket_client("ssl://$smtp_host:$smtp_port", $errno, $errstr, 30, STREAM_CLIENT_CONNECT, $context);
        if (!$socket) {
            error_log("SMTP SSL connection failed: $errstr ($errno)");
            return false;
        }
        
        // Read initial response
        $response = $this->readSMTPResponse($socket);
        if ($this->config['debug']) {
            error_log("SMTP SSL Initial: " . trim($response));
        }
        
        // Send EHLO command
        fputs($socket, "EHLO " . ($_SERVER['HTTP_HOST'] ?? 'localhost') . "\r\n");
        $response = $this->readSMTPResponse($socket);
        if ($this->config['debug']) {
            error_log("SMTP SSL EHLO: " . trim($response));
        }
        
        // Authenticate
        fputs($socket, "AUTH LOGIN\r\n");
        $response = $this->readSMTPResponse($socket);
        if ($this->config['debug']) {
            error_log("SMTP SSL AUTH LOGIN: " . trim($response));
        }
        
        // Send username
        fputs($socket, base64_encode($smtp_username) . "\r\n");
        $response = $this->readSMTPResponse($socket);
        if ($this->config['debug']) {
            error_log("SMTP SSL Username: " . trim($response));
        }
        
        // Send password
        fputs($socket, base64_encode($smtp_password) . "\r\n");
        $response = $this->readSMTPResponse($socket);
        if ($this->config['debug']) {
            error_log("SMTP SSL Password: " . trim($response));
        }
        
        // Check if authentication was successful
        if (!str_starts_with($response, '235')) {
            error_log("SMTP SSL Authentication failed: " . trim($response));
            fclose($socket);
            return false;
        }
        
        // Send MAIL FROM
        fputs($socket, "MAIL FROM: <$from_email>\r\n");
        $response = $this->readSMTPResponse($socket);
        if ($this->config['debug']) {
            error_log("SMTP SSL MAIL FROM: " . trim($response));
        }
        
        // Send RCPT TO
        fputs($socket, "RCPT TO: <$to>\r\n");
        $response = $this->readSMTPResponse($socket);
        if ($this->config['debug']) {
            error_log("SMTP SSL RCPT TO: " . trim($response));
        }
        
        // Send DATA command
        fputs($socket, "DATA\r\n");
        $response = $this->readSMTPResponse($socket);
        if ($this->config['debug']) {
            error_log("SMTP SSL DATA: " . trim($response));
        }
        
        // Build email headers and body
        $email_data = $this->buildEmailData($to, $toName, $subject, $htmlBody, $textBody);
        
        // Send email data
        fputs($socket, $email_data);
        fputs($socket, "\r\n.\r\n");
        $send_response = $this->readSMTPResponse($socket);
        if ($this->config['debug']) {
            error_log("SMTP SSL Send: " . trim($send_response));
        }
        
        // Send QUIT
        fputs($socket, "QUIT\r\n");
        $quit_response = $this->readSMTPResponse($socket);
        if ($this->config['debug']) {
            error_log("SMTP SSL QUIT: " . trim($quit_response));
        }
        
        // Close connection
        fclose($socket);
        
        // Check if email was sent successfully (check the send response, not quit response)
        $success = str_starts_with($send_response, '250');
        
        if ($this->config['debug']) {
            error_log("Email sent via SSL to {$to}: " . ($success ? 'SUCCESS' : 'FAILED'));
        }
        
        return $success;
    }
    
    /**
     * Build complete email data with headers and body
     */
    private function buildEmailData(string $to, string $toName, string $subject, string $htmlBody, string $textBody = ''): string {
        $from_email = $this->config['from_email'];
        $from_name = $this->config['from_name'];
        $charset = $this->config['charset'];
        
        $data = "From: $from_name <$from_email>\r\n";
        $data .= "To: $toName <$to>\r\n";
        $data .= "Subject: $subject\r\n";
        $data .= "MIME-Version: 1.0\r\n";
        $data .= "Content-Type: text/html; charset=$charset\r\n";
        $data .= "Content-Transfer-Encoding: 8bit\r\n";
        $data .= "X-Mailer: Erbienbi Email Service\r\n";
        $data .= "X-Priority: 3\r\n";
        $data .= "\r\n";
        $data .= $htmlBody;
        
        return $data;
    }
    
    /**
     * Send new reservation notification to accommodation owner
     */
    public function sendNewReservationNotification(array $reservationData, array $ownerData): bool {
        $subject = $this->templates['new_reservation']['subject'];
        
        // Build email content
        $htmlBody = $this->buildReservationEmailHTML($reservationData, $ownerData);
        $textBody = $this->buildReservationEmailText($reservationData, $ownerData);
        
        return $this->sendEmail(
            $ownerData['email'],
            $ownerData['nombre'],
            $subject,
            $htmlBody,
            $textBody
        );
    }
    
    /**
     * Build headers for email
     */
    private function buildHeaders(string $toName): string {
        $headers = [];
        
        // From header
        $headers[] = "From: {$this->config['from_name']} <{$this->config['from_email']}>";
        
        // Reply-To header
        $headers[] = "Reply-To: {$this->config['from_email']}";
        
        // MIME version
        $headers[] = "MIME-Version: 1.0";
        
        // Content type for HTML email
        $headers[] = "Content-Type: text/html; charset={$this->config['charset']}";
        
        // Additional headers
        $headers[] = "X-Mailer: Erbienbi Email Service";
        $headers[] = "X-Priority: 3";
        
        return implode("\r\n", $headers);
    }
    
    /**
     * Build message body (supports both HTML and text)
     */
    private function buildMessageBody(string $htmlBody, string $textBody = ''): string {
        if (empty($textBody)) {
            // If no text version provided, use HTML as is
            return $htmlBody;
        }
        
        // Create multipart message
        $boundary = md5((string)time());
        
        $body = "--{$boundary}\r\n";
        $body .= "Content-Type: text/plain; charset={$this->config['charset']}\r\n";
        $body .= "Content-Transfer-Encoding: {$this->config['encoding']}\r\n\r\n";
        $body .= $textBody . "\r\n\r\n";
        
        $body .= "--{$boundary}\r\n";
        $body .= "Content-Type: text/html; charset={$this->config['charset']}\r\n";
        $body .= "Content-Transfer-Encoding: {$this->config['encoding']}\r\n\r\n";
        $body .= $htmlBody . "\r\n\r\n";
        
        $body .= "--{$boundary}--";
        
        return $body;
    }
    
    /**
     * Read SMTP response, handling multi-line responses properly
     */
    private function readSMTPResponse($socket): string {
        $response = '';
        do {
            $line = fgets($socket, 515);
            if ($line === false) {
                break;
            }
            $response .= $line;
            
            // Check if this is the last line (no continuation)
            // SMTP multi-line responses have format: "250-line1\r\n250-line2\r\n250 lastline\r\n"
            // The last line has a space after the code instead of a dash
            if (preg_match('/^\d{3} /', $line)) {
                break;
            }
        } while (true);
        
        return $response;
    }
    
    /**
     * Log email instead of sending (for test mode)
     */
    private function logEmail(string $to, string $toName, string $subject, string $htmlBody): bool {
        $logMessage = "EMAIL LOG:\n";
        $logMessage .= "To: {$toName} <{$to}>\n";
        $logMessage .= "Subject: {$subject}\n";
        $logMessage .= "Body: " . strip_tags($htmlBody) . "\n";
        $logMessage .= "---\n";
        
        error_log($logMessage);
        return true;
    }
    
    /**
     * Build HTML email for new reservation using template
     */
    private function buildReservationEmailHTML(array $reservationData, array $ownerData): string {
        $templatePath = __DIR__ . '/email_templates/new_reservation.html';
        
        // Check if template file exists
        if (!file_exists($templatePath)) {
            // Fallback to inline HTML if template file doesn't exist
            return $this->buildReservationEmailHTMLFallback($reservationData, $ownerData);
        }
        
        // Load template
        $template = file_get_contents($templatePath);
        
        if ($template === false) {
            // Fallback if template can't be read
            return $this->buildReservationEmailHTMLFallback($reservationData, $ownerData);
        }
        
        // Replace placeholders with actual data
        $replacements = [
            '{{OWNER_NAME}}'         => htmlspecialchars($ownerData['nombre']),
            '{{ACCOMMODATION_NAME}}' => htmlspecialchars($reservationData['alojamiento_nombre']),
            '{{GUEST_NAME}}'         => htmlspecialchars($reservationData['nombre']),
            '{{GUEST_LASTNAME}}'     => htmlspecialchars($reservationData['apellido']),
            '{{GUEST_EMAIL}}'        => htmlspecialchars($reservationData['email']),
            '{{GUEST_PHONE}}'        => htmlspecialchars($reservationData['telefono']),
            '{{CHECK_IN_DATE}}'      => htmlspecialchars($this->formatDate($reservationData['fecha_inicio'])),
            '{{CHECK_OUT_DATE}}'     => htmlspecialchars($this->formatDate($reservationData['fecha_fin'])),
            '{{GUEST_COUNT}}'        => htmlspecialchars((string)$reservationData['cantidad_personas']),
            '{{PRICE_PER_NIGHT}}'    => number_format($reservationData['precio_noche'], 2),
            '{{TOTAL_PRICE}}'        => number_format($reservationData['precio_total'], 2),
            '{{PAYMENT_METHOD}}'     => htmlspecialchars($reservationData['metodo_pago']),
            '{{RESERVATION_DATE}}'   => htmlspecialchars($this->formatDateTime($reservationData['fecha_reserva']))
        ];
        
        // Replace all placeholders
        $html = str_replace(array_keys($replacements), array_values($replacements), $template);
        
        return $html;
    }
    
    /**
     * Fallback HTML email builder (inline HTML)
     */
    private function buildReservationEmailHTMLFallback(array $reservationData, array $ownerData): string {
        $html = '<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Nueva Reserva - Erbienbi</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #007bff; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background-color: #f9f9f9; }
        .reservation-details { background-color: white; padding: 15px; margin: 10px 0; border-radius: 5px; }
        .detail-row { margin: 8px 0; }
        .label { font-weight: bold; color: #555; }
        .footer { padding: 20px; text-align: center; font-size: 12px; color: #666; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Nueva Reserva Recibida</h1>
        </div>
        
        <div class="content">
            <p>Estimado/a <strong>' . htmlspecialchars($ownerData['nombre']) . '</strong>,</p>
            
            <p>Te informamos que has recibido una nueva reserva para tu alojamiento <strong>"' . htmlspecialchars($reservationData['alojamiento_nombre']) . '"</strong>.</p>
            
            <div class="reservation-details">
                <h3>Detalles de la Reserva</h3>
                
                <div class="detail-row">
                    <span class="label">Huésped:</span> ' . htmlspecialchars($reservationData['nombre'] . ' ' . $reservationData['apellido']) . '
                </div>
                
                <div class="detail-row">
                    <span class="label">Email:</span> ' . htmlspecialchars($reservationData['email']) . '
                </div>
                
                <div class="detail-row">
                    <span class="label">Teléfono:</span> ' . htmlspecialchars($reservationData['telefono']) . '
                </div>
                
                <div class="detail-row">
                    <span class="label">Fecha de entrada:</span> ' . htmlspecialchars($this->formatDate($reservationData['fecha_inicio'])) . '
                </div>
                
                <div class="detail-row">
                    <span class="label">Fecha de salida:</span> ' . htmlspecialchars($this->formatDate($reservationData['fecha_fin'])) . '
                </div>
                
                <div class="detail-row">
                    <span class="label">Cantidad de personas:</span> ' . htmlspecialchars((string)$reservationData['cantidad_personas']) . '
                </div>
                
                <div class="detail-row">
                    <span class="label">Precio por noche:</span> $' . number_format($reservationData['precio_noche'], 2) . '
                </div>
                
                <div class="detail-row">
                    <span class="label">Precio total:</span> <strong>$' . number_format($reservationData['precio_total'], 2) . '</strong>
                </div>
                
                <div class="detail-row">
                    <span class="label">Método de pago:</span> ' . htmlspecialchars($reservationData['metodo_pago']) . '
                </div>
                
                <div class="detail-row">
                    <span class="label">Fecha de reserva:</span> ' . htmlspecialchars($this->formatDateTime($reservationData['fecha_reserva'])) . '
                </div>
            </div>
            
            <p>Te recomendamos contactar al huésped para confirmar los detalles y coordinar el check-in.</p>
            
            <p>Gracias por confiar en Erbienbi.</p>
        </div>
        
        <div class="footer">
            <p>Este email fue enviado automáticamente por el sistema Erbienbi.<br>
            Si tienes alguna consulta, no dudes en contactarnos.</p>
        </div>
    </div>
</body>
</html>';
        
        return $html;
    }
    
    /**
     * Format date for display
     */
    private function formatDate(string $date): string {
        $dateObj = DateTime::createFromFormat('Y-m-d', $date);
        if ($dateObj) {
            return $dateObj->format('d/m/Y');
        }
        return $date;
    }
    
    /**
     * Format datetime for display
     */
    private function formatDateTime(string $datetime): string {
        $dateObj = DateTime::createFromFormat('Y-m-d H:i:s', $datetime);
        if ($dateObj) {
            return $dateObj->format('d/m/Y H:i');
        }
        return $datetime;
    }
    
    /**
     * Build text email for new reservation
     */
    private function buildReservationEmailText(array $reservationData, array $ownerData): string {
        $text = "NUEVA RESERVA RECIBIDA - Erbienbi\n\n";
        $text .= "Estimado/a " . $ownerData['nombre'] . ",\n\n";
        $text .= "Te informamos que has recibido una nueva reserva para tu alojamiento \"" . $reservationData['alojamiento_nombre'] . "\".\n\n";
        $text .= "DETALLES DE LA RESERVA:\n";
        $text .= "------------------------\n";
        $text .= "Huésped: " . $reservationData['nombre'] . " " . $reservationData['apellido'] . "\n";
        $text .= "Email: " . $reservationData['email'] . "\n";
        $text .= "Teléfono: " . $reservationData['telefono'] . "\n";
        $text .= "Fecha de entrada: " . $reservationData['fecha_inicio'] . "\n";
        $text .= "Fecha de salida: " . $reservationData['fecha_fin'] . "\n";
        $text .= "Cantidad de personas: " . $reservationData['cantidad_personas'] . "\n";
        $text .= "Precio por noche: $" . number_format($reservationData['precio_noche'], 2) . "\n";
        $text .= "Precio total: $" . number_format($reservationData['precio_total'], 2) . "\n";
        $text .= "Método de pago: " . $reservationData['metodo_pago'] . "\n";
        $text .= "Fecha de reserva: " . $reservationData['fecha_reserva'] . "\n\n";
        $text .= "Te recomendamos contactar al huésped para confirmar los detalles y coordinar el check-in.\n\n";
        $text .= "Gracias por confiar en Erbienbi.\n\n";
        $text .= "---\n";
        $text .= "Este email fue enviado automáticamente por el sistema Erbienbi.";
        
        return $text;
    }
}
