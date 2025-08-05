# Contributing to TechOps Dashboard

Thank you for your interest in contributing to the TechOps Dashboard! This guide will help you get started with the development process and ensure your contributions align with our project standards.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Coding Standards](#coding-standards)
- [Testing Guidelines](#testing-guidelines)
- [Pull Request Process](#pull-request-process)
- [Issue Reporting](#issue-reporting)
- [Documentation](#documentation)

---

## Code of Conduct

By participating in this project, you agree to abide by our Code of Conduct:

- **Be respectful** and inclusive in all interactions
- **Be constructive** in feedback and discussions
- **Be collaborative** and help others learn and grow
- **Be professional** in all communications
- **Report** any unacceptable behavior to the maintainers

---

## Getting Started

### Prerequisites

Before contributing, ensure you have:

- **Node.js 18+** installed
- **Docker and Docker Compose** for containerized development
- **Git** for version control
- **PostgreSQL 15+** (if developing locally without Docker)
- **Code editor** with TypeScript support (VS Code recommended)

### Development Environment Setup

1. **Fork the repository**
   ```bash
   # Fork on GitHub, then clone your fork
   git clone https://github.com/YOUR_USERNAME/techops-dashboards.git
   cd techops-dashboards
   ```

2. **Set up upstream remote**
   ```bash
   git remote add upstream https://github.com/ORIGINAL_OWNER/techops-dashboards.git
   ```

3. **Install dependencies**
   ```bash
   npm run install:all
   ```

4. **Set up environment**
   ```bash
   # Copy environment files
   cp .env.example .env
   cp backend/.env.example backend/.env
   
   # Edit environment files as needed
   ```

5. **Start development environment**
   ```bash
   # Using Docker (recommended)
   docker-compose up --build
   
   # Or locally
   npm run dev
   ```

6. **Verify setup**
   - Frontend: http://localhost:8080
   - Backend API: http://localhost:8081/api/health
   - Database: localhost:5433

---

## Development Workflow

### Branch Strategy

We use a **feature branch workflow**:

- `main` - Production-ready code
- `develop` - Integration branch for features
- `feature/feature-name` - Individual feature branches
- `bugfix/bug-description` - Bug fix branches
- `hotfix/critical-fix` - Critical production fixes

### Creating a Feature Branch

```bash
# Update your local main branch
git checkout main
git pull upstream main

# Create and switch to feature branch
git checkout -b feature/your-feature-name

# Make your changes...

# Commit your changes
git add .
git commit -m "feat: add new feature description"

# Push to your fork
git push origin feature/your-feature-name
```

### Keeping Your Branch Updated

```bash
# Fetch latest changes
git fetch upstream

# Rebase your feature branch
git checkout feature/your-feature-name
git rebase upstream/main

# Force push if needed (only on your feature branch)
git push --force-with-lease origin feature/your-feature-name
```

---

## Coding Standards

### General Principles

- **Clean Code**: Write self-documenting, readable code
- **SOLID Principles**: Follow single responsibility, open/closed, etc.
- **DRY**: Don't repeat yourself
- **KISS**: Keep it simple, stupid
- **YAGNI**: You aren't gonna need it

### TypeScript/JavaScript Standards

#### Code Style

```typescript
// ✅ Good: Use descriptive names
const getUserById = async (userId: number): Promise<User | null> => {
  try {
    const user = await userRepository.findById(userId);
    return user;
  } catch (error) {
    logger.error('Failed to fetch user', { userId, error });
    throw new Error('User not found');
  }
};

// ❌ Bad: Unclear names and no error handling
const getU = (id) => {
  return db.query('SELECT * FROM users WHERE id = ?', [id]);
};
```

#### Type Definitions

```typescript
// ✅ Good: Explicit interfaces
interface CreateUserRequest {
  email: string;
  name: string;
  password: string;
  role: UserRole;
}

interface User {
  id: number;
  email: string;
  name: string;
  role: UserRole;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// ✅ Good: Use enums for constants
enum UserRole {
  ADMIN = 'admin',
  ENGINEER = 'engineer',
  USER = 'user'
}
```

#### Error Handling

```typescript
// ✅ Good: Proper error handling
try {
  const result = await riskyOperation();
  return { success: true, data: result };
} catch (error) {
  logger.error('Operation failed', { error, context });
  
  if (error instanceof ValidationError) {
    return { success: false, error: 'Invalid input data' };
  }
  
  throw error; // Re-throw unexpected errors
}
```

### React Component Standards

#### Component Structure

```typescript
// ✅ Good: Well-structured component
import React, { useState, useEffect } from 'react';
import { User } from '../types/user';
import { userService } from '../services/userService';
import { LoadingSpinner } from './LoadingSpinner';
import { ErrorMessage } from './ErrorMessage';

interface UserListProps {
  onUserSelect: (user: User) => void;
  filter?: string;
}

export const UserList: React.FC<UserListProps> = ({ onUserSelect, filter }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        const fetchedUsers = await userService.getUsers({ filter });
        setUsers(fetchedUsers);
      } catch (err) {
        setError('Failed to load users');
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [filter]);

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} />;

  return (
    <div className="user-list">
      {users.map(user => (
        <UserCard 
          key={user.id} 
          user={user} 
          onClick={() => onUserSelect(user)}
        />
      ))}
    </div>
  );
};
```

#### Hooks Usage

```typescript
// ✅ Good: Custom hook for data fetching
export const useUsers = (filter?: string) => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const fetchedUsers = await userService.getUsers({ filter });
      setUsers(fetchedUsers);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  return { users, loading, error, refetch: fetchUsers };
};
```

### Backend Standards

#### API Route Structure

```typescript
// ✅ Good: Well-structured route handler
import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import { userService } from '../services/userService';
import { logger } from '../utils/logger';

export const createUser = async (req: Request, res: Response) => {
  try {
    // Validate input
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    // Extract validated data
    const { email, name, password, role } = req.body;

    // Business logic
    const user = await userService.createUser({
      email,
      name,
      password,
      role
    });

    // Log success
    logger.info('User created successfully', { 
      userId: user.id, 
      email: user.email,
      createdBy: req.user?.id 
    });

    // Return response
    res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: { user }
    });

  } catch (error) {
    logger.error('Failed to create user', { error, body: req.body });
    
    if (error instanceof ValidationError) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }

    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};
```

#### Service Layer

```typescript
// ✅ Good: Service with proper separation of concerns
export class UserService {
  constructor(
    private userRepository: UserRepository,
    private emailService: EmailService,
    private logger: Logger
  ) {}

  async createUser(userData: CreateUserRequest): Promise<User> {
    // Validate business rules
    await this.validateUserCreation(userData);

    // Hash password
    const hashedPassword = await bcrypt.hash(userData.password, 12);

    // Create user
    const user = await this.userRepository.create({
      ...userData,
      password: hashedPassword
    });

    // Send welcome email (async)
    this.emailService.sendWelcomeEmail(user.email, user.name)
      .catch(error => this.logger.error('Failed to send welcome email', { error }));

    return user;
  }

  private async validateUserCreation(userData: CreateUserRequest): Promise<void> {
    const existingUser = await this.userRepository.findByEmail(userData.email);
    if (existingUser) {
      throw new ValidationError('Email already exists');
    }

    if (!this.isValidRole(userData.role)) {
      throw new ValidationError('Invalid user role');
    }
  }

  private isValidRole(role: string): boolean {
    return Object.values(UserRole).includes(role as UserRole);
  }
}
```

### Database Standards

```typescript
// ✅ Good: Repository pattern with proper error handling
export class UserRepository {
  constructor(private db: Pool) {}

  async findById(id: number): Promise<User | null> {
    try {
      const query = 'SELECT * FROM users WHERE id = $1 AND is_active = true';
      const result = await this.db.query(query, [id]);
      
      return result.rows[0] ? this.mapRowToUser(result.rows[0]) : null;
    } catch (error) {
      this.logger.error('Failed to find user by ID', { id, error });
      throw new DatabaseError('Failed to retrieve user');
    }
  }

  async create(userData: CreateUserData): Promise<User> {
    const client = await this.db.connect();
    
    try {
      await client.query('BEGIN');
      
      const query = `
        INSERT INTO users (email, name, password_hash, role)
        VALUES ($1, $2, $3, $4)
        RETURNING *
      `;
      
      const result = await client.query(query, [
        userData.email,
        userData.name,
        userData.password,
        userData.role
      ]);
      
      await client.query('COMMIT');
      
      return this.mapRowToUser(result.rows[0]);
    } catch (error) {
      await client.query('ROLLBACK');
      this.logger.error('Failed to create user', { userData, error });
      throw new DatabaseError('Failed to create user');
    } finally {
      client.release();
    }
  }

  private mapRowToUser(row: any): User {
    return {
      id: row.id,
      email: row.email,
      name: row.name,
      role: row.role,
      isActive: row.is_active,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at)
    };
  }
}
```

---

## Testing Guidelines

### Testing Strategy

- **Unit Tests**: Test individual functions and components
- **Integration Tests**: Test API endpoints and database interactions
- **Component Tests**: Test React components with user interactions
- **E2E Tests**: Test complete user workflows

### Frontend Testing

```typescript
// ✅ Good: Component test with React Testing Library
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { UserList } from '../UserList';
import { userService } from '../../services/userService';

// Mock the service
jest.mock('../../services/userService');
const mockUserService = userService as jest.Mocked<typeof userService>;

describe('UserList', () => {
  const mockUsers = [
    { id: 1, name: 'John Doe', email: 'john@example.com', role: 'engineer' },
    { id: 2, name: 'Jane Smith', email: 'jane@example.com', role: 'admin' }
  ];

  beforeEach(() => {
    mockUserService.getUsers.mockResolvedValue(mockUsers);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should render users after loading', async () => {
    const onUserSelect = jest.fn();
    
    render(<UserList onUserSelect={onUserSelect} />);
    
    // Should show loading initially
    expect(screen.getByText('Loading...')).toBeInTheDocument();
    
    // Wait for users to load
    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    });
    
    // Should call service
    expect(mockUserService.getUsers).toHaveBeenCalledWith({ filter: undefined });
  });

  it('should call onUserSelect when user is clicked', async () => {
    const onUserSelect = jest.fn();
    
    render(<UserList onUserSelect={onUserSelect} />);
    
    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });
    
    fireEvent.click(screen.getByText('John Doe'));
    
    expect(onUserSelect).toHaveBeenCalledWith(mockUsers[0]);
  });
});
```

### Backend Testing

```typescript
// ✅ Good: API endpoint test
import request from 'supertest';
import { app } from '../app';
import { userService } from '../services/userService';

jest.mock('../services/userService');
const mockUserService = userService as jest.Mocked<typeof userService>;

describe('POST /api/users', () => {
  const validUserData = {
    email: 'test@example.com',
    name: 'Test User',
    password: 'password123',
    role: 'engineer'
  };

  beforeEach(() => {
    mockUserService.createUser.mockResolvedValue({
      id: 1,
      ...validUserData,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    });
  });

  it('should create user with valid data', async () => {
    const response = await request(app)
      .post('/api/users')
      .send(validUserData)
      .expect(201);

    expect(response.body).toMatchObject({
      success: true,
      message: 'User created successfully',
      data: {
        user: expect.objectContaining({
          id: 1,
          email: validUserData.email,
          name: validUserData.name
        })
      }
    });

    expect(mockUserService.createUser).toHaveBeenCalledWith(validUserData);
  });

  it('should return 400 for invalid email', async () => {
    const invalidData = { ...validUserData, email: 'invalid-email' };

    const response = await request(app)
      .post('/api/users')
      .send(invalidData)
      .expect(400);

    expect(response.body).toMatchObject({
      success: false,
      message: 'Validation failed'
    });
  });
});
```

---

## Pull Request Process

### Before Submitting

1. **Run all checks locally:**
   ```bash
   npm run lint
   npm run type-check
   npm run test
   npm run build
   ```

2. **Update documentation** if needed

3. **Add tests** for new functionality

4. **Update CHANGELOG.md** if applicable

### PR Template

When creating a pull request, use this template:

```markdown
## Description
Brief description of changes made.

## Type of Change
- [ ] Bug fix (non-breaking change which fixes an issue)
- [ ] New feature (non-breaking change which adds functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] Documentation update

## Testing
- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] Manual testing completed
- [ ] New tests added for new functionality

## Checklist
- [ ] Code follows project style guidelines
- [ ] Self-review completed
- [ ] Code is commented where necessary
- [ ] Documentation updated
- [ ] No new warnings introduced

## Screenshots (if applicable)
[Add screenshots for UI changes]

## Related Issues
Closes #[issue number]
```

### Review Process

1. **Automated checks** must pass (CI/CD pipeline)
2. **Code review** by at least one maintainer
3. **Manual testing** if UI changes are involved
4. **Documentation review** if docs are updated
5. **Approval** from maintainer before merge

---

## Issue Reporting

### Bug Reports

Use this template for bug reports:

```markdown
## Bug Description
A clear description of what the bug is.

## Steps to Reproduce
1. Go to '...'
2. Click on '....'
3. Scroll down to '....'
4. See error

## Expected Behavior
What you expected to happen.

## Actual Behavior
What actually happened.

## Environment
- OS: [e.g., Windows 10, macOS 12.0]
- Browser: [e.g., Chrome 96, Firefox 95]
- Node.js version: [e.g., 18.12.0]
- Docker version: [if applicable]

## Additional Context
Any other context about the problem.

## Screenshots
[If applicable, add screenshots]
```

### Feature Requests

```markdown
## Feature Description
A clear description of the feature you'd like to see.

## Problem Statement
What problem does this feature solve?

## Proposed Solution
How would you like this feature to work?

## Alternatives Considered
What other solutions have you considered?

## Additional Context
Any other context or screenshots about the feature request.
```

---

## Documentation

### Documentation Standards

- **Clear and concise** language
- **Code examples** for complex concepts
- **Screenshots** for UI features
- **Up-to-date** information
- **Proper formatting** with Markdown

### Documentation Types

1. **README.md** - Project overview and quick start
2. **API Documentation** - Detailed API reference
3. **Code Comments** - Inline documentation
4. **Architecture Docs** - System design and architecture
5. **Deployment Guides** - Production deployment instructions

### Writing Guidelines

- Use **active voice** when possible
- Include **practical examples**
- Explain **why**, not just **how**
- Keep **sections focused** and organized
- Use **consistent terminology**

---

## Release Process

### Versioning

We follow [Semantic Versioning](https://semver.org/):

- **MAJOR** version for incompatible API changes
- **MINOR** version for backwards-compatible functionality
- **PATCH** version for backwards-compatible bug fixes

### Release Checklist

- [ ] All tests pass
- [ ] Documentation updated
- [ ] CHANGELOG.md updated
- [ ] Version bumped in package.json
- [ ] Git tag created
- [ ] Release notes written
- [ ] Docker images built and pushed
- [ ] Production deployment tested

---

## Getting Help

### Resources

- **Documentation**: Check the [README](./README.md) and [docs](./docs/) folder
- **Issues**: Search existing [GitHub issues](https://github.com/your-org/techops-dashboards/issues)
- **Discussions**: Use [GitHub Discussions](https://github.com/your-org/techops-dashboards/discussions) for questions

### Contact

- **Maintainers**: @maintainer1, @maintainer2
- **Email**: techops-dev@company.com
- **Slack**: #techops-dashboard (internal)

---

## Recognition

We appreciate all contributions! Contributors will be:

- **Listed** in the project README
- **Mentioned** in release notes for significant contributions
- **Invited** to join the maintainer team for consistent, high-quality contributions

---

**Thank you for contributing to TechOps Dashboard! 🚀**