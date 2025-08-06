import axios from 'axios';
import { faker } from '@faker-js/faker';

// Configuration
const API_BASE_URL = 'http://localhost:3001/api';
const ADMIN_EMAIL = 'izzudin@nodeflux.io';
const ADMIN_PASSWORD = '0147258Afd@';

// Data generation settings
const COUNTS = {
  PROJECT_GROUPS: 5,
  PROJECTS_PER_GROUP: 3,
  DEPLOYMENTS_PER_PROJECT: 4,
  MAINTENANCE_REQUESTS: 15
};

class DataInjector {
  constructor() {
    this.token = null;
    this.engineers = [];
    this.projectGroups = [];
    this.projects = [];
  }

  async login() {
    try {
      console.log('🔐 Logging in as admin...');
      const response = await axios.post(`${API_BASE_URL}/auth/login`, {
        email: ADMIN_EMAIL,
        password: ADMIN_PASSWORD
      });
      
      console.log('Login response:', JSON.stringify(response.data, null, 2));
      
      // Try different possible token locations
      this.token = response.data.data?.accessToken || 
                   response.data.accessToken || 
                   response.data.token || 
                   response.data.data?.token;
      
      if (!this.token) {
        throw new Error('No access token found in response');
      }
      
      console.log('✅ Login successful');
    } catch (error) {
      console.error('❌ Login failed:');
      console.error('Status:', error.response?.status);
      console.error('Data:', error.response?.data);
      console.error('Message:', error.response?.data?.message || error.message);
      console.error('Full error:', error.code, error.errno);
      throw error;
    }
  }

  getAuthHeaders() {
    return {
      'Authorization': `Bearer ${this.token}`,
      'Content-Type': 'application/json'
    };
  }

  async fetchEngineers() {
    try {
      console.log('👥 Fetching engineers...');
      const response = await axios.get(`${API_BASE_URL}/engineers`, {
        headers: this.getAuthHeaders()
      });
      this.engineers = response.data.data || response.data;
      console.log(`✅ Found ${this.engineers.length} engineers`);
    } catch (error) {
      console.error('❌ Failed to fetch engineers:', error.response?.data?.message || error.message);
      throw error;
    }
  }

  generateProjectGroupData() {
    const categories = [
      'Web Applications', 'Mobile Apps', 'Infrastructure', 
      'Data Analytics', 'Security Tools', 'DevOps Tools',
      'API Services', 'Monitoring Systems'
    ];
    
    return {
      name: faker.helpers.arrayElement(categories) + ' ' + faker.company.buzzNoun(),
      description: faker.company.catchPhrase() + '. ' + faker.lorem.sentence()
    };
  }

  generateProjectData(groupId) {
    const projectTypes = [
      'Dashboard', 'API', 'Service', 'Portal', 'Gateway', 
      'Platform', 'System', 'Tool', 'Application', 'Interface'
    ];
    
    const techStacks = [
      'React', 'Vue.js', 'Angular', 'Node.js', 'Python', 
      'Java', 'Go', 'PHP', 'Ruby', '.NET'
    ];
    
    return {
      name: faker.company.buzzNoun() + ' ' + faker.helpers.arrayElement(projectTypes),
      description: `${faker.helpers.arrayElement(techStacks)} based ${faker.company.catchPhrase().toLowerCase()}`,
      groupId: groupId,
      repositoryUrl: `https://github.com/company/${faker.lorem.slug()}-${faker.lorem.slug()}`,
      status: faker.helpers.arrayElement(['active', 'inactive', 'maintenance']),
      assignedEngineerId: this.engineers.length > 0 ? faker.helpers.arrayElement(this.engineers).id : null
    };
  }

  generateDeploymentData(projectId) {
    const environments = ['development', 'staging', 'production'];
    const statuses = ['pending', 'running', 'completed', 'failed'];
    
    // Generate deployment date within last 30 days
    const deployedAt = faker.date.recent({ days: 30 }).toISOString();
    
    return {
      name: `Deploy ${faker.system.semver()} to ${faker.helpers.arrayElement(environments)}`,
      projectId: projectId,
      status: faker.helpers.arrayElement(statuses),
      deployedAt: deployedAt,
      engineerId: this.engineers.length > 0 ? faker.helpers.arrayElement(this.engineers).id : null,
      description: faker.lorem.paragraph(),
      services: faker.helpers.arrayElements([
        'web-server', 'database', 'cache', 'queue', 'storage', 'cdn'
      ], { min: 1, max: 3 }).join(', ')
    };
  }

  generateMaintenanceData() {
    const priorities = ['Low', 'Medium', 'High', 'Critical'];
    const categories = ['Hardware', 'Software', 'Network', 'General'];
    const statuses = ['Pending', 'In Progress', 'On Hold', 'Completed', 'Cancelled'];
    
    const companies = [
      'TechCorp Inc.', 'Digital Solutions Ltd.', 'Innovation Systems',
      'Global Tech', 'Smart Solutions', 'Future Systems'
    ];
    
    return {
      clientName: faker.person.fullName(),
      clientEmail: faker.internet.email(),
      clientPhone: faker.phone.number(),
      clientCompany: faker.helpers.arrayElement(companies),
      title: faker.lorem.words(4),
      description: faker.lorem.paragraphs(2),
      priority: faker.helpers.arrayElement(priorities),
      category: faker.helpers.arrayElement(categories),
      requestedDate: faker.date.recent({ days: 7 }).toISOString(),
      assignedEngineerId: this.engineers.length > 0 ? faker.helpers.arrayElement(this.engineers).id : null
    };
  }

  async createProjectGroups() {
    console.log('\n📁 Creating project groups...');
    
    for (let i = 0; i < COUNTS.PROJECT_GROUPS; i++) {
      try {
        const groupData = this.generateProjectGroupData();
        const response = await axios.post(`${API_BASE_URL}/project-groups`, groupData, {
          headers: this.getAuthHeaders()
        });
        
        const createdGroup = response.data.data || response.data;
        this.projectGroups.push(createdGroup);
        console.log(`✅ Created project group: ${groupData.name}`);
        
        // Small delay to avoid overwhelming the server
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (error) {
        console.error(`❌ Failed to create project group:`, error.response?.data?.message || error.message);
      }
    }
    
    console.log(`📊 Total project groups created: ${this.projectGroups.length}`);
  }

  async createProjects() {
    console.log('\n🚀 Creating projects...');
    
    for (const group of this.projectGroups) {
      for (let i = 0; i < COUNTS.PROJECTS_PER_GROUP; i++) {
        try {
          const projectData = this.generateProjectData(group.id);
          const response = await axios.post(`${API_BASE_URL}/projects`, projectData, {
            headers: this.getAuthHeaders()
          });
          
          const createdProject = response.data.data || response.data;
          this.projects.push(createdProject);
          console.log(`✅ Created project: ${projectData.name} (Group: ${group.name})`);
          
          await new Promise(resolve => setTimeout(resolve, 100));
        } catch (error) {
          console.error(`❌ Failed to create project:`, error.response?.data?.message || error.message);
        }
      }
    }
    
    console.log(`📊 Total projects created: ${this.projects.length}`);
  }

  async createDeployments() {
    console.log('\n🚀 Creating deployments...');
    let totalDeployments = 0;
    
    for (const project of this.projects) {
      for (let i = 0; i < COUNTS.DEPLOYMENTS_PER_PROJECT; i++) {
        try {
          const deploymentData = this.generateDeploymentData(project.id);
          const response = await axios.post(`${API_BASE_URL}/deployments`, deploymentData, {
            headers: this.getAuthHeaders()
          });
          
          totalDeployments++;
          console.log(`✅ Created deployment: ${deploymentData.name} (Project: ${project.name})`);
          
          await new Promise(resolve => setTimeout(resolve, 100));
        } catch (error) {
          console.error(`❌ Failed to create deployment:`, error.response?.data?.message || error.message);
        }
      }
    }
    
    console.log(`📊 Total deployments created: ${totalDeployments}`);
  }

  async createMaintenanceRequests() {
    console.log('\n🔧 Creating maintenance requests...');
    let totalMaintenance = 0;
    
    for (let i = 0; i < COUNTS.MAINTENANCE_REQUESTS; i++) {
      try {
        const maintenanceData = this.generateMaintenanceData();
        const response = await axios.post(`${API_BASE_URL}/admin/maintenance`, maintenanceData, {
          headers: this.getAuthHeaders()
        });
        
        totalMaintenance++;
        console.log(`✅ Created maintenance request: ${maintenanceData.title}`);
        
        await new Promise(resolve => setTimeout(resolve, 150));
      } catch (error) {
        console.error(`❌ Failed to create maintenance request:`, error.response?.data?.message || error.message);
      }
    }
    
    console.log(`📊 Total maintenance requests created: ${totalMaintenance}`);
  }

  async ensureAdminUser() {
    try {
      console.log('👤 Ensuring admin user exists...');
      const response = await axios.post(`${API_BASE_URL}/admin/migrate/make-admin`);
      console.log('✅ Admin user ensured');
      
      // Wait a bit for the database to process
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
      console.log('ℹ️ Admin user might already exist or endpoint not available');
    }
  }

  async tryAlternativeLogin() {
    // Try different email formats that might exist
    const alternativeEmails = [
      'izzudin@nodeflux.io'
    ];
    
    for (const email of alternativeEmails) {
      try {
        console.log(`🔐 Trying login with ${email}...`);
        const response = await axios.post(`${API_BASE_URL}/auth/login`, {
          email: email,
          password: ADMIN_PASSWORD
        });
        
        this.token = response.data.data.accessToken;
        console.log(`✅ Login successful with ${email}`);
        return true;
      } catch (error) {
        console.log(`❌ Failed with ${email}`);
      }
    }
    return false;
  }

  async run() {
    try {
      console.log('🚀 Starting data injection process...');
      console.log(`📋 Configuration:`);
      console.log(`   - Project Groups: ${COUNTS.PROJECT_GROUPS}`);
      console.log(`   - Projects per Group: ${COUNTS.PROJECTS_PER_GROUP}`);
      console.log(`   - Deployments per Project: ${COUNTS.DEPLOYMENTS_PER_PROJECT}`);
      console.log(`   - Maintenance Requests: ${COUNTS.MAINTENANCE_REQUESTS}`);
      
      await this.ensureAdminUser();
      
      // Try normal login first, then alternative emails
      try {
        await this.login();
      } catch (error) {
        console.log('🔄 Normal login failed, trying alternative emails...');
        const loginSuccess = await this.tryAlternativeLogin();
        if (!loginSuccess) {
          throw new Error('All login attempts failed');
        }
      }
      await this.fetchEngineers();
      await this.createProjectGroups();
      await this.createProjects();
      await this.createDeployments();
      await this.createMaintenanceRequests();
      
      console.log('\n🎉 Data injection completed successfully!');
      console.log('\n📊 Summary:');
      console.log(`   - Project Groups: ${this.projectGroups.length}`);
      console.log(`   - Projects: ${this.projects.length}`);
      console.log(`   - Deployments: ${this.projects.length * COUNTS.DEPLOYMENTS_PER_PROJECT}`);
      console.log(`   - Maintenance Requests: ${COUNTS.MAINTENANCE_REQUESTS}`);
      
    } catch (error) {
      console.error('\n💥 Data injection failed:', error.message);
      process.exit(1);
    }
  }
}

// Run the data injector
const injector = new DataInjector();
injector.run();

export default DataInjector;