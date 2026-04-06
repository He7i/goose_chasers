-- Easter Hunt Database Schema

CREATE TABLE IF NOT EXISTS easter_teams (
    team_id INT AUTO_INCREMENT PRIMARY KEY,
    team_name VARCHAR(100) NOT NULL UNIQUE,
    current_hint_id INT DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS qr_codes (
    qr_id INT AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(255) NOT NULL UNIQUE,
    location VARCHAR(100),
    qr_code_data LONGBLOB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS hints (
    hint_id INT AUTO_INCREMENT PRIMARY KEY,
    qr_id INT NOT NULL,
    hint_image LONGBLOB,
    egg_image LONGBLOB,
    solution_qr_id INT,
    assign_team_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (qr_id) REFERENCES qr_codes(qr_id) ON DELETE CASCADE,
    FOREIGN KEY (solution_qr_id) REFERENCES qr_codes(qr_id) ON DELETE SET NULL,
    FOREIGN KEY (assign_team_id) REFERENCES easter_teams(team_id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS found (
    id INT AUTO_INCREMENT PRIMARY KEY,
    team_id INT NOT NULL,
    hint_id INT NOT NULL,
    found_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_team_hint (team_id, hint_id),
    FOREIGN KEY (team_id) REFERENCES easter_teams(team_id) ON DELETE CASCADE,
    FOREIGN KEY (hint_id) REFERENCES hints(hint_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS admin_users (
    admin_id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_team_name ON easter_teams(team_name);
CREATE INDEX idx_qr_code ON qr_codes(code);
CREATE INDEX idx_hint_qr ON hints(qr_id);
CREATE INDEX idx_found_team ON found(team_id);
CREATE INDEX idx_found_hint ON found(hint_id);
