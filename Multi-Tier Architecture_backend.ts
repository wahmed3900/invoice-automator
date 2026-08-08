Multi-Tier Architecture_backend
// architecture/architecture-diagram.ts
export const Architecture = {
  "Presentation Layer": {
    "Next.js App": "Edge/Serverless",
    "CDN": "CloudFlare/CloudFront",
    "Load Balancer": "AWS ELB/Nginx"
  },
  "Application Layer": {
    "API Gateway": "Kong/AWS API Gateway",
    "Microservices": [
      "Auth Service",
      "Invoice Service",
      "Notification Service",
      "Payment Service",
      "Analytics Service",
      "Report Service"
    ],
    "Message Queue": "RabbitMQ/AWS SQS",
    "Cache": "Redis Cluster"
  },
  "Data Layer": {
    "Primary DB": "PostgreSQL Cluster (Read Replicas)",
    "Time-series": "TimescaleDB",
    "Search": "Elasticsearch",
    "File Storage": "AWS S3/Cloudflare R2",
    "Data Warehouse": "Snowflake/BigQuery"
  }
}