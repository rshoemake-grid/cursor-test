-- Test user for @WithMockUser(username = "testuser") - AuthenticationHelper looks up by username
INSERT INTO users (id, username, email, hashed_password, full_name, is_active, is_admin, created_at)
VALUES ('test-user-id', 'testuser', 'test@example.com', '$2a$10$dummy', 'Test User', true, false, CURRENT_TIMESTAMP);
