export const mockData = {
  projectGroups: [
    {
      id: '1',
      name: 'Internal Tools',
      description: 'Internal applications and automation tools',
      createdAt: '2024-01-15T00:00:00Z',
    },
    {
      id: '2',
      name: 'Client A',
      description: 'All projects related to Client A deliverables',
      createdAt: '2024-02-01T00:00:00Z',
    },
    {
      id: '3',
      name: 'Automation Lab',
      description: 'Experimental automation and testing projects',
      createdAt: '2024-01-20T00:00:00Z',
    },
  ],

  engineers: [
    { id: '1', name: 'Alex Johnson', email: 'alex.johnson@company.com' },
    { id: '2', name: 'Sarah Chen', email: 'sarah.chen@company.com' },
    { id: '3', name: 'Mike Rodriguez', email: 'mike.rodriguez@company.com' },
    { id: '4', name: 'Emily Davis', email: 'emily.davis@company.com' },
  ],

  projects: [
    {
      id: '1',
      name: 'Task Management API',
      environment: 'Production',
      engineerId: '1',
      groupId: '1',
      createdAt: '2024-01-16T00:00:00Z',
    },
    {
      id: '2',
      name: 'User Dashboard',
      environment: 'Staging',
      engineerId: '2',
      groupId: '1',
      createdAt: '2024-01-18T00:00:00Z',
    },
    {
      id: '3',
      name: 'E-commerce Frontend',
      environment: 'Production',
      engineerId: '3',
      groupId: '2',
      createdAt: '2024-02-02T00:00:00Z',
    },
    {
      id: '4',
      name: 'Payment Gateway',
      environment: 'Development',
      engineerId: '2',
      groupId: '2',
      createdAt: '2024-02-05T00:00:00Z',
    },
    {
      id: '5',
      name: 'CI/CD Pipeline',
      environment: 'Production',
      engineerId: '4',
      groupId: '3',
      createdAt: '2024-01-22T00:00:00Z',
    },
    {
      id: '6',
      name: 'Load Testing Suite',
      environment: 'Development',
      engineerId: '1',
      groupId: '3',
      createdAt: '2024-01-25T00:00:00Z',
    },
  ],

  deployments: [
    {
      id: '1',
      projectId: '1',
      deployedAt: '2024-01-20T14:30:00Z',
      status: 'Success',
      notes: 'Deployed v2.1.0 with new authentication features. All tests passing.',
    },
    {
      id: '2',
      projectId: '1',
      deployedAt: '2024-01-25T09:15:00Z',
      status: 'Success',
      notes: 'Hotfix for rate limiting issue. Monitoring for 24h.',
    },
    {
      id: '3',
      projectId: '2',
      deployedAt: '2024-01-22T16:45:00Z',
      status: 'Failed',
      notes: 'Database migration failed. Rolling back and investigating.',
    },
    {
      id: '4',
      projectId: '2',
      deployedAt: '2024-01-23T10:20:00Z',
      status: 'Success',
      notes: 'Fixed migration issue and deployed successfully.',
    },
    {
      id: '5',
      projectId: '3',
      deployedAt: '2024-02-10T11:00:00Z',
      status: 'Success',
      notes: 'New product catalog feature deployed to production.',
    },
    {
      id: '6',
      projectId: '4',
      deployedAt: '2024-02-12T08:30:00Z',
      status: 'Pending',
      notes: 'Deployment in progress. Waiting for payment provider approval.',
    },
    {
      id: '7',
      projectId: '5',
      deployedAt: '2024-01-28T13:15:00Z',
      status: 'Success',
      notes: 'New pipeline configuration deployed. Build time reduced by 40%.',
    },
    {
      id: '8',
      projectId: '6',
      deployedAt: '2024-02-01T15:45:00Z',
      status: 'Success',
      notes: 'Load testing environment setup complete. Ready for performance testing.',
    },
  ],

  services: [
    { id: '1', name: 'Docker' },
    { id: '2', name: 'Kubernetes' },
    { id: '3', name: 'PostgreSQL' },
    { id: '4', name: 'Redis' },
    { id: '5', name: 'Nginx' },
    { id: '6', name: 'PM2' },
    { id: '7', name: 'MongoDB' },
    { id: '8', name: 'ElasticSearch' },
    { id: '9', name: 'RabbitMQ' },
    { id: '10', name: 'Jenkins' },
    { id: '11', name: 'GitHub Actions' },
    { id: '12', name: 'AWS Lambda' },
  ],

  deploymentServices: [
    { deploymentId: '1', serviceId: '1' },
    { deploymentId: '1', serviceId: '3' },
    { deploymentId: '1', serviceId: '5' },
    { deploymentId: '2', serviceId: '1' },
    { deploymentId: '2', serviceId: '3' },
    { deploymentId: '3', serviceId: '1' },
    { deploymentId: '3', serviceId: '3' },
    { deploymentId: '3', serviceId: '7' },
    { deploymentId: '4', serviceId: '1' },
    { deploymentId: '4', serviceId: '3' },
    { deploymentId: '5', serviceId: '2' },
    { deploymentId: '5', serviceId: '4' },
    { deploymentId: '6', serviceId: '12' },
    { deploymentId: '7', serviceId: '10' },
    { deploymentId: '7', serviceId: '11' },
    { deploymentId: '8', serviceId: '1' },
    { deploymentId: '8', serviceId: '8' },
  ],

  scripts: [
    {
      id: '1',
      deploymentId: '1',
      title: 'API Deployment Script',
      content: `#!/bin/bash
echo "Starting API deployment..."

# Build Docker image
docker build -t task-api:v2.1.0 .

# Stop existing container
docker stop task-api-prod || true
docker rm task-api-prod || true

# Run new container
docker run -d --name task-api-prod \\
  -p 3000:3000 \\
  --env-file .env.prod \\
  task-api:v2.1.0

echo "API deployment completed successfully"`,
    },
    {
      id: '2',
      deploymentId: '2',
      title: 'Hotfix Deployment',
      content: `#!/bin/bash
# Quick hotfix deployment for rate limiting

# Pull latest changes
git pull origin hotfix/rate-limiting

# Build and deploy
npm run build
pm2 restart api --update-env

# Verify deployment
curl -f http://localhost:3000/health || exit 1
echo "Hotfix deployed successfully"`,
    },
    {
      id: '3',
      deploymentId: '4',
      title: 'Dashboard Deployment with Migration',
      content: `#!/bin/bash
echo "Deploying dashboard with database migration..."

# Backup database
pg_dump dashboard_db > backup_$(date +%Y%m%d_%H%M%S).sql

# Run migrations
npm run migrate:up

# Build frontend
npm run build

# Deploy to server
rsync -av dist/ user@server:/var/www/dashboard/

echo "Dashboard deployment completed"`,
    },
    {
      id: '4',
      deploymentId: '5',
      title: 'Kubernetes E-commerce Deployment',
      content: `#!/bin/bash
# Deploy e-commerce frontend to Kubernetes

# Apply configuration
kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/configmap.yaml
kubectl apply -f k8s/deployment.yaml
kubectl apply -f k8s/service.yaml

# Wait for rollout
kubectl rollout status deployment/ecommerce-frontend -n production

# Verify deployment
kubectl get pods -n production | grep ecommerce-frontend

echo "E-commerce frontend deployed successfully"`,
    },
    {
      id: '5',
      deploymentId: '7',
      title: 'CI/CD Pipeline Configuration',
      content: `# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          
      - name: Install dependencies
        run: npm ci
        
      - name: Run tests
        run: npm test
        
      - name: Build application
        run: npm run build
        
      - name: Deploy to server
        run: |
          echo "Deploying to production server..."
          # Deployment commands here`,
    },
  ],
};