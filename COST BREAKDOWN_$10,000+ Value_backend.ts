COST BREAKDOWN_$10,000+ Value_backend
// infrastructure/costs.ts
export const MonthlyCosts = {
  // Infrastructure (Cloud)
  "AWS Infrastructure": {
    "EC2 (Auto-scaling)": "$2,500",
    "RDS (PostgreSQL)": "$1,200",
    "ElastiCache (Redis)": "$800",
    "S3 (Storage)": "$400",
    "Load Balancer": "$300",
    "CloudFront (CDN)": "$500",
    "Route53": "$200",
    "Total": "$5,900"
  },
  
  // Services
  "Third-party Services": {
    "Kafka (Confluent)": "$1,000",
    "ClickHouse": "$500",
    "Elasticsearch": "$600",
    "Stripe": "$0 (transaction-based)",
    "Resend (Email)": "$500",
    "Twilio (SMS)": "$300",
    "Sentry": "$200",
    "Logtail": "$300",
    "Total": "$3,400"
  },
  
  // Development & Maintenance
  "DevOps & Support": {
    "Database Administrator": "$2,000",
    "DevOps Engineer": "$3,000",
    "System Monitoring": "$500",
    "Backup & Recovery": "$400",
    "Security Audits": "$1,000",
    "Total": "$6,900"
  },
  
  "Total Monthly": "$16,200",
  "Annual Total": "$194,400"
};

// Value delivered
export const ValueProposition = {
  "ROI": {
    "Late Payment Recovery": "$50,000/month saved",
    "Time Saved (10K users)": "2,000 hours/month",
    "Productivity Gain": "$100,000/month value",
    "Customer Retention": "$30,000/month value",
    "Total Monthly Value": "$180,000"
  }
};