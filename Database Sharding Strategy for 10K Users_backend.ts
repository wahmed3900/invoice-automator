Database Sharding Strategy for 10K Users_backend.ts
-- PostgreSQL Sharding Configuration
-- sharding.sql
-- Horizontal sharding by tenant_id (user_id)

-- Create partition tables
CREATE TABLE invoices_partitioned (
    id UUID,
    user_id UUID NOT NULL,
    client_id UUID,
    amount DECIMAL(10,2),
    due_date DATE,
    status VARCHAR(20),
    created_at TIMESTAMP DEFAULT NOW()
) PARTITION BY HASH (user_id);

-- Create 16 shards
CREATE TABLE invoices_p0 PARTITION OF invoices_partitioned
    FOR VALUES WITH (MODULUS 16, REMAINDER 0);
CREATE TABLE invoices_p1 PARTITION OF invoices_partitioned
    FOR VALUES WITH (MODULUS 16, REMAINDER 1);
-- ... up to p15

-- Create indexes on each partition
CREATE INDEX idx_invoices_p0_due_date ON invoices_p0(due_date);
CREATE INDEX idx_invoices_p0_user_id ON invoices_p0(user_id);