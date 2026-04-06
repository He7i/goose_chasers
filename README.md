# Easter Hunt App v2.0

A modern React + Node.js/Express Easter egg hunt game with admin dashboard, QR code scanning, and real-time leaderboard.

## Features

- 🥚 **Player Dashboard**: QR code scanning, hint display, leaderboard tracking
- 🔧 **Admin Dashboard**: Manage hints, QR codes, teams, and settings
- 🏆 **Real-time Leaderboard**: Live team rankings
- 🏁 **Race Modal**: Popup when team reaches 10 hints
- 📱 **Responsive Design**: Works on desktop and mobile
- 🐳 **Docker Ready**: Easy deployment to AWS ECS

## Tech Stack

- **Frontend**: React 18, Material-UI (MUI), React Router
- **Backend**: Node.js, Express, MySQL
- **Deployment**: Docker, AWS ECS, S3, RDS
- **QR Scanning**: html5-qrcode

## Local Development

### Prerequisites

- Node.js 16+
- MySQL 8.0+
- Docker (optional, for containerized development)

### Setup

1. **Clone and install dependencies**:
```bash
cd easter_app_v2
npm install
cd client && npm install && cd ..
```

2. **Create `.env` file** (copy from `.env.example`):
```bash
cp .env.example .env
```

3. **Update `.env` with your database credentials**:
```
DB_HOST=localhost
DB_USER=root
DB_PASS=your_password
DB_NAME=easter_hunt
JWT_SECRET=your_secret_key
```

4. **Create database and tables**:
```bash
mysql -u root -p easter_hunt < server/db/schema.sql
```

5. **Start development servers**:
```bash
npm run dev
```

This starts:
- Backend on `http://localhost:5000`
- Frontend on `http://localhost:3000`

## Docker Development

```bash
docker-compose up
```

This starts:
- MySQL on `localhost:3306`
- App on `http://localhost:5000`

## Project Structure

```
easter_app_v2/
├── server/                 # Node.js/Express backend
│   ├── index.js           # Main server file
│   ├── db/
│   │   ├── connection.js  # MySQL connection pool
│   │   └── schema.sql     # Database schema
│   └── routes/            # API endpoints
│       ├── auth.js        # Login/register
│       ├── hints.js       # Hint endpoints
│       ├── qrcodes.js     # QR code endpoints
│       ├── teams.js       # Team endpoints
│       ├── found.js       # Found hints tracking
│       └── admin.js       # Admin operations
├── client/                # React frontend
│   ├── public/
│   │   └── index.html
│   └── src/
│       ├── App.js
│       ├── index.js
│       ├── pages/
│       │   ├── LoginPage.js
│       │   ├── PlayerDashboard.js
│       │   └── AdminDashboard.js
│       └── components/
│           └── QRScanner.js
├── Dockerfile             # Multi-stage Docker build
├── docker-compose.yml     # Local development compose
└── package.json           # Root dependencies
```

## API Endpoints

### Authentication
- `POST /api/auth/login` - Login team
- `POST /api/auth/register` - Register new team
- `GET /api/auth/verify` - Verify JWT token

### Hints
- `GET /api/hints/current/:teamId` - Get current hint
- `GET /api/hints/image/:hintId` - Get hint image
- `GET /api/hints/egg/:hintId` - Get egg image

### QR Codes
- `GET /api/qrcodes/all` - Get all QR codes
- `GET /api/qrcodes/image/:qrId` - Get QR code image

### Teams
- `GET /api/teams/:teamId` - Get team info
- `GET /api/teams/:teamId/found` - Get team's found hints
- `GET /api/teams/leaderboard/all` - Get leaderboard

### Found Hints
- `POST /api/found/record` - Record a found hint

### Admin
- `POST /api/admin/hints/add` - Add new hint
- `POST /api/admin/hints/:hintId/image` - Update hint image
- `POST /api/admin/hints/:hintId/egg` - Update egg image
- `DELETE /api/admin/hints/:hintId` - Delete hint
- `GET /api/admin/hints` - Get all hints
- `POST /api/admin/qrcodes/add` - Add QR code
- `DELETE /api/admin/qrcodes/:qrId` - Delete QR code
- `GET /api/admin/teams` - Get all teams

## AWS Deployment

### Prerequisites
- AWS Account
- AWS CLI configured
- ECR repository created
- RDS MySQL instance
- S3 bucket for static files
- ECS cluster and task definition

### Step 1: Build and Push Docker Image

```bash
# Build image
docker build -t easter-hunt-app:latest .

# Tag for ECR
docker tag easter-hunt-app:latest <AWS_ACCOUNT_ID>.dkr.ecr.<REGION>.amazonaws.com/easter-hunt-app:latest

# Push to ECR
aws ecr get-login-password --region <REGION> | docker login --username AWS --password-stdin <AWS_ACCOUNT_ID>.dkr.ecr.<REGION>.amazonaws.com
docker push <AWS_ACCOUNT_ID>.dkr.ecr.<REGION>.amazonaws.com/easter-hunt-app:latest
```

### Step 2: Create RDS MySQL Instance

```bash
aws rds create-db-instance \
  --db-instance-identifier easter-hunt-db \
  --db-instance-class db.t3.micro \
  --engine mysql \
  --master-username admin \
  --master-user-password <STRONG_PASSWORD> \
  --allocated-storage 20 \
  --publicly-accessible false
```

### Step 3: Create ECS Task Definition

Create `task-definition.json`:
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
      "image": "<AWS_ACCOUNT_ID>.dkr.ecr.<REGION>.amazonaws.com/easter-hunt-app:latest",
      "portMappings": [
        {
          "containerPort": 5000,
          "hostPort": 5000,
          "protocol": "tcp"
        }
      ],
      "environment": [
        {
          "name": "DB_HOST",
          "value": "<RDS_ENDPOINT>"
        },
        {
          "name": "DB_USER",
          "value": "admin"
        },
        {
          "name": "DB_PASS",
          "value": "<RDS_PASSWORD>"
        },
        {
          "name": "DB_NAME",
          "value": "easter_hunt"
        },
        {
          "name": "NODE_ENV",
          "value": "production"
        },
        {
          "name": "JWT_SECRET",
          "value": "<GENERATE_STRONG_SECRET>"
        }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/easter-hunt-app",
          "awslogs-region": "<REGION>",
          "awslogs-stream-prefix": "ecs"
        }
      }
    }
  ]
}
```

Register task definition:
```bash
aws ecs register-task-definition --cli-input-json file://task-definition.json
```

### Step 4: Create ECS Service

```bash
aws ecs create-service \
  --cluster easter-hunt-cluster \
  --service-name easter-hunt-service \
  --task-definition easter-hunt-app \
  --desired-count 2 \
  --launch-type FARGATE \
  --network-configuration "awsvpcConfiguration={subnets=[subnet-xxx],securityGroups=[sg-xxx],assignPublicIp=ENABLED}" \
  --load-balancers targetGroupArn=arn:aws:elasticloadbalancing:...,containerName=easter-hunt-app,containerPort=5000
```

### Step 5: Deploy React Frontend to S3 + CloudFront

```bash
# Build React app
cd client
npm run build

# Upload to S3
aws s3 sync build/ s3://easter-hunt-frontend/

# Invalidate CloudFront cache
aws cloudfront create-invalidation --distribution-id <DISTRIBUTION_ID> --paths "/*"
```

### Step 6: Configure API Endpoint

Update `client/src/App.js` to point to your ECS load balancer:
```javascript
axios.defaults.baseURL = 'https://api.easter-hunt.example.com';
```

## Environment Variables

### Server
- `PORT` - Server port (default: 5000)
- `NODE_ENV` - Environment (development/production)
- `DB_HOST` - MySQL host
- `DB_USER` - MySQL user
- `DB_PASS` - MySQL password
- `DB_NAME` - Database name
- `DB_PORT` - MySQL port (default: 3306)
- `JWT_SECRET` - JWT signing secret
- `CORS_ORIGIN` - CORS allowed origin
- `MAX_FILE_SIZE` - Max upload size (default: 5MB)

### Client
- `REACT_APP_API_URL` - Backend API URL

## Troubleshooting

### Database Connection Issues
- Ensure MySQL is running
- Check `DB_HOST`, `DB_USER`, `DB_PASS` in `.env`
- Verify database exists: `mysql -u root -p -e "SHOW DATABASES;"`

### QR Scanner Not Working
- Check browser permissions for camera access
- Ensure HTTPS in production (required for camera access)
- Test with `http://localhost:3000` in development

### Image Upload Issues
- Check file size (max 5MB)
- Verify `hint_image`, `egg_image` columns are `LONGBLOB` type
- Run migration if needed: `migration_fix_blob.sql`

## License

MIT
