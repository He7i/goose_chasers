# AWS Deployment Guide - Easter Hunt App

Complete step-by-step guide for deploying to AWS using ECS, RDS, S3, and CloudFront.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│ CloudFront (CDN)                                        │
│ └─ S3 Bucket (React Frontend Static Files)              │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│ Application Load Balancer (ALB)                         │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│ ECS Fargate Cluster                                     │
│ └─ Easter Hunt App Container (Node.js/Express)         │
│    - Auto-scaling (2-4 tasks)                           │
│    - Health checks                                      │
│    - Log streaming to CloudWatch                        │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│ RDS MySQL Instance                                      │
│ └─ easter_hunt Database                                 │
│    - Multi-AZ for high availability                     │
│    - Automated backups                                  │
│    - Security groups configured                         │
└─────────────────────────────────────────────────────────┘
```

## Prerequisites

- AWS Account with appropriate permissions
- AWS CLI installed and configured
- Docker installed locally
- Node.js 16+ installed
- Git repository set up

## Phase 1: Prepare AWS Resources

### 1.1 Create ECR Repository

```bash
aws ecr create-repository \
  --repository-name easter-hunt-app \
  --region us-east-1
```

Note the repository URI: `<ACCOUNT_ID>.dkr.ecr.us-east-1.amazonaws.com/easter-hunt-app`

### 1.2 Create RDS MySQL Instance

```bash
aws rds create-db-instance \
  --db-instance-identifier easter-hunt-db \
  --db-instance-class db.t3.micro \
  --engine mysql \
  --engine-version 8.0.32 \
  --master-username admin \
  --master-user-password YourStrongPassword123! \
  --allocated-storage 20 \
  --storage-type gp3 \
  --publicly-accessible false \
  --multi-az \
  --backup-retention-period 7 \
  --region us-east-1
```

Wait for instance to be available (5-10 minutes):
```bash
aws rds describe-db-instances \
  --db-instance-identifier easter-hunt-db \
  --region us-east-1
```

Get the endpoint (e.g., `easter-hunt-db.xxxxx.us-east-1.rds.amazonaws.com`).

### 1.3 Create Security Group for RDS

```bash
# Get default VPC ID
VPC_ID=$(aws ec2 describe-vpcs --filters "Name=isDefault,Values=true" --query 'Vpcs[0].VpcId' --output text)

# Create security group
SG_ID=$(aws ec2 create-security-group \
  --group-name easter-hunt-db-sg \
  --description "Security group for Easter Hunt RDS" \
  --vpc-id $VPC_ID \
  --region us-east-1 \
  --query 'GroupId' \
  --output text)

# Allow MySQL from ECS security group (we'll create this next)
echo "Security Group ID: $SG_ID"
```

### 1.4 Create S3 Bucket for Frontend

```bash
aws s3 mb s3://easter-hunt-frontend-$(date +%s) --region us-east-1

# Enable static website hosting
aws s3 website s3://easter-hunt-frontend-<TIMESTAMP>/ \
  --index-document index.html \
  --error-document index.html
```

### 1.5 Create CloudFront Distribution

```bash
# Create distribution pointing to S3 bucket
aws cloudfront create-distribution \
  --origin-domain-name easter-hunt-frontend-<TIMESTAMP>.s3.us-east-1.amazonaws.com \
  --default-root-object index.html
```

Note the distribution ID for later.

## Phase 2: Build and Push Docker Image

### 2.1 Build Docker Image

```bash
cd easter_app_v2
docker build -t easter-hunt-app:latest .
```

### 2.2 Authenticate with ECR

```bash
aws ecr get-login-password --region us-east-1 | \
  docker login --username AWS --password-stdin <ACCOUNT_ID>.dkr.ecr.us-east-1.amazonaws.com
```

### 2.3 Tag and Push Image

```bash
docker tag easter-hunt-app:latest <ACCOUNT_ID>.dkr.ecr.us-east-1.amazonaws.com/easter-hunt-app:latest

docker push <ACCOUNT_ID>.dkr.ecr.us-east-1.amazonaws.com/easter-hunt-app:latest
```

## Phase 3: Set Up ECS

### 3.1 Create ECS Cluster

```bash
aws ecs create-cluster \
  --cluster-name easter-hunt-cluster \
  --region us-east-1
```

### 3.2 Create CloudWatch Log Group

```bash
aws logs create-log-group \
  --log-group-name /ecs/easter-hunt-app \
  --region us-east-1
```

### 3.3 Create ECS Task Definition

Create file `task-definition.json`:

```json
{
  "family": "easter-hunt-app",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "256",
  "memory": "512",
  "containerDefinitions": [
    {
      "name": "easter-hunt-app",
      "image": "<ACCOUNT_ID>.dkr.ecr.us-east-1.amazonaws.com/easter-hunt-app:latest",
      "portMappings": [
        {
          "containerPort": 5000,
          "hostPort": 5000,
          "protocol": "tcp"
        }
      ],
      "environment": [
        {
          "name": "NODE_ENV",
          "value": "production"
        },
        {
          "name": "PORT",
          "value": "5000"
        },
        {
          "name": "DB_HOST",
          "value": "easter-hunt-db.xxxxx.us-east-1.rds.amazonaws.com"
        },
        {
          "name": "DB_USER",
          "value": "admin"
        },
        {
          "name": "DB_NAME",
          "value": "easter_hunt"
        },
        {
          "name": "CORS_ORIGIN",
          "value": "https://d123456.cloudfront.net"
        }
      ],
      "secrets": [
        {
          "name": "DB_PASS",
          "valueFrom": "arn:aws:secretsmanager:us-east-1:<ACCOUNT_ID>:secret:easter-hunt-db-pass"
        },
        {
          "name": "JWT_SECRET",
          "valueFrom": "arn:aws:secretsmanager:us-east-1:<ACCOUNT_ID>:secret:easter-hunt-jwt-secret"
        }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/easter-hunt-app",
          "awslogs-region": "us-east-1",
          "awslogs-stream-prefix": "ecs"
        }
      },
      "healthCheck": {
        "command": ["CMD-SHELL", "curl -f http://localhost:5000/api/health || exit 1"],
        "interval": 30,
        "timeout": 5,
        "retries": 3,
        "startPeriod": 60
      }
    }
  ],
  "executionRoleArn": "arn:aws:iam::<ACCOUNT_ID>:role/ecsTaskExecutionRole",
  "taskRoleArn": "arn:aws:iam::<ACCOUNT_ID>:role/ecsTaskRole"
}
```

Register the task definition:

```bash
aws ecs register-task-definition \
  --cli-input-json file://task-definition.json \
  --region us-east-1
```

### 3.4 Create Application Load Balancer

```bash
# Create ALB
ALB_ARN=$(aws elbv2 create-load-balancer \
  --name easter-hunt-alb \
  --subnets subnet-xxxxx subnet-yyyyy \
  --security-groups sg-xxxxx \
  --scheme internet-facing \
  --type application \
  --region us-east-1 \
  --query 'LoadBalancers[0].LoadBalancerArn' \
  --output text)

# Create target group
TG_ARN=$(aws elbv2 create-target-group \
  --name easter-hunt-tg \
  --protocol HTTP \
  --port 5000 \
  --vpc-id vpc-xxxxx \
  --target-type ip \
  --health-check-enabled \
  --health-check-path /api/health \
  --region us-east-1 \
  --query 'TargetGroups[0].TargetGroupArn' \
  --output text)

# Create listener
aws elbv2 create-listener \
  --load-balancer-arn $ALB_ARN \
  --protocol HTTP \
  --port 80 \
  --default-actions Type=forward,TargetGroupArn=$TG_ARN \
  --region us-east-1
```

### 3.5 Create ECS Service

```bash
aws ecs create-service \
  --cluster easter-hunt-cluster \
  --service-name easter-hunt-service \
  --task-definition easter-hunt-app:1 \
  --desired-count 2 \
  --launch-type FARGATE \
  --network-configuration "awsvpcConfiguration={subnets=[subnet-xxxxx,subnet-yyyyy],securityGroups=[sg-xxxxx],assignPublicIp=ENABLED}" \
  --load-balancers targetGroupArn=$TG_ARN,containerName=easter-hunt-app,containerPort=5000 \
  --region us-east-1
```

## Phase 4: Initialize Database

### 4.1 Create Database and Tables

Connect to RDS instance:

```bash
mysql -h easter-hunt-db.xxxxx.us-east-1.rds.amazonaws.com \
  -u admin \
  -p \
  < server/db/schema.sql
```

## Phase 5: Deploy Frontend

### 5.1 Build React App

```bash
cd client
npm run build
```

### 5.2 Upload to S3

```bash
aws s3 sync build/ s3://easter-hunt-frontend-<TIMESTAMP>/ \
  --delete \
  --cache-control "public, max-age=3600"
```

### 5.3 Invalidate CloudFront Cache

```bash
aws cloudfront create-invalidation \
  --distribution-id <DISTRIBUTION_ID> \
  --paths "/*"
```

## Phase 6: Configure DNS

### 6.1 Point Domain to CloudFront

In your domain registrar, create a CNAME record:

```
www.easter-hunt.example.com  CNAME  d123456.cloudfront.net
```

Or use Route 53:

```bash
aws route53 change-resource-record-sets \
  --hosted-zone-id <ZONE_ID> \
  --change-batch '{
    "Changes": [{
      "Action": "CREATE",
      "ResourceRecordSet": {
        "Name": "easter-hunt.example.com",
        "Type": "A",
        "AliasTarget": {
          "HostedZoneId": "Z2FDTNDATAQYW2",
          "DNSName": "d123456.cloudfront.net",
          "EvaluateTargetHealth": false
        }
      }
    }]
  }'
```

## Phase 7: Post-Deployment

### 7.1 Enable HTTPS

Use AWS Certificate Manager to create/import SSL certificate and update CloudFront distribution.

### 7.2 Set Up Auto-Scaling

```bash
aws application-autoscaling register-scalable-target \
  --service-namespace ecs \
  --resource-id service/easter-hunt-cluster/easter-hunt-service \
  --scalable-dimension ecs:service:DesiredCount \
  --min-capacity 2 \
  --max-capacity 4 \
  --region us-east-1

aws application-autoscaling put-scaling-policy \
  --policy-name easter-hunt-scaling \
  --service-namespace ecs \
  --resource-id service/easter-hunt-cluster/easter-hunt-service \
  --scalable-dimension ecs:service:DesiredCount \
  --policy-type TargetTrackingScaling \
  --target-tracking-scaling-policy-configuration '{
    "TargetValue": 70.0,
    "PredefinedMetricSpecification": {
      "PredefinedMetricType": "ECSServiceAverageCPUUtilization"
    },
    "ScaleOutCooldown": 60,
    "ScaleInCooldown": 300
  }' \
  --region us-east-1
```

### 7.3 Monitor with CloudWatch

```bash
# View logs
aws logs tail /ecs/easter-hunt-app --follow --region us-east-1

# Create dashboard
aws cloudwatch put-dashboard \
  --dashboard-name easter-hunt-dashboard \
  --dashboard-body file://dashboard.json
```

## Troubleshooting

### ECS Task Won't Start
- Check CloudWatch logs: `aws logs tail /ecs/easter-hunt-app --follow`
- Verify environment variables and secrets
- Check security group allows MySQL access

### Database Connection Fails
- Ensure RDS security group allows inbound on port 3306
- Verify DB_HOST is correct
- Check credentials in Secrets Manager

### Frontend Not Loading
- Verify S3 bucket policy allows CloudFront access
- Check CloudFront distribution is enabled
- Invalidate cache: `aws cloudfront create-invalidation --distribution-id <ID> --paths "/*"`

### High Latency
- Enable RDS read replicas
- Increase ECS task memory/CPU
- Enable ElastiCache for session storage

## Estimated Costs (Monthly)

- ECS Fargate (2 tasks, 256 CPU, 512 MB): ~$15
- RDS MySQL (t3.micro, 20GB): ~$20
- S3 (1GB storage): ~$0.25
- CloudFront (1TB transfer): ~$85
- ALB: ~$16
- **Total**: ~$136/month

## Rollback Procedure

If deployment fails:

```bash
# Revert to previous task definition
aws ecs update-service \
  --cluster easter-hunt-cluster \
  --service easter-hunt-service \
  --task-definition easter-hunt-app:1 \
  --region us-east-1

# Revert frontend
aws s3 sync s3://easter-hunt-frontend-backup/ s3://easter-hunt-frontend-<TIMESTAMP>/
aws cloudfront create-invalidation --distribution-id <ID> --paths "/*"
```

## Next Steps

1. Set up monitoring and alerts
2. Configure automated backups
3. Implement CI/CD pipeline (GitHub Actions)
4. Set up custom domain with SSL
5. Configure WAF for security
6. Implement rate limiting
7. Set up database replication
