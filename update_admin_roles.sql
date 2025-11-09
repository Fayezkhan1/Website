-- Update admin roles for test users

UPDATE users SET role = 'admin', admin_role = 'validator' WHERE student_id = 'VALIDATOR001';
UPDATE users SET role = 'admin', admin_role = 'supervisor' WHERE student_id = 'SUPERVISOR001';
UPDATE users SET role = 'admin', admin_role = 'warden' WHERE student_id = 'WARDEN001';
UPDATE users SET role = 'admin', admin_role = 'dean' WHERE student_id = 'DEAN001';

-- Verify the updates
SELECT student_id, name, role, admin_role FROM users WHERE role IN ('admin', 'worker');
