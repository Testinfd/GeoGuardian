# Contributing to GeoGuardian

Thank you for your interest in contributing to **GeoGuardian**! 🌍

We believe that open-source collaboration is key to solving the world's most pressing environmental challenges. This document provides guidelines for contributing to the project.

---

## 📋 Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [How Can I Contribute?](#how-can-i-contribute)
- [Development Workflow](#development-workflow)
- [Coding Standards](#coding-standards)
- [Commit Guidelines](#commit-guidelines)
- [Pull Request Process](#pull-request-process)
- [Testing Requirements](#testing-requirements)
- [Documentation](#documentation)

---

## Code of Conduct

### Our Pledge

We are committed to providing a welcoming and inclusive environment for all contributors, regardless of:
- Experience level
- Gender identity and expression
- Sexual orientation
- Disability
- Personal appearance
- Body size
- Race, ethnicity, or nationality
- Age
- Religion or lack thereof

### Expected Behavior

- **Be respectful**: Treat all community members with respect
- **Be collaborative**: Work together towards common goals
- **Be constructive**: Provide helpful, actionable feedback
- **Be patient**: Understand that everyone is learning
- **Be inclusive**: Welcome newcomers and help them get started

### Unacceptable Behavior

- Harassment, discrimination, or offensive comments
- Personal attacks or trolling
- Publishing others' private information
- Any conduct that would be inappropriate in a professional setting

---

## Getting Started

### 1. Fork the Repository

```bash
# Fork on GitHub, then clone your fork
git clone https://github.com/YOUR_USERNAME/geoguardian.git
cd geoguardian
```

### 2. Set Up Development Environment

#### Backend Setup
```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements_enhanced.txt

# Configure environment
cp env.example .env
# Edit .env with your API keys

# Run backend
uvicorn app.main:app --reload
```

#### Frontend Setup
```bash
cd frontend

# Install dependencies
npm install

# Configure environment
cp .env.example .env.local
# Edit .env.local with your keys

# Run frontend
npm run dev
```

### 3. Create a Branch

```bash
# Create a descriptive branch name
git checkout -b feature/your-feature-name
# or
git checkout -b fix/issue-description
```

---

## How Can I Contribute?

### 🐛 Report Bugs

If you find a bug, please create an issue with:
- **Clear title**: Describe the bug briefly
- **Description**: Detailed explanation of the issue
- **Steps to reproduce**: How to reproduce the bug
- **Expected behavior**: What should happen
- **Actual behavior**: What actually happens
- **Environment**: OS, browser, versions
- **Screenshots**: If applicable

**Bug Report Template**:
```markdown
**Bug Description**
A clear description of the bug.

**To Reproduce**
Steps to reproduce:
1. Go to '...'
2. Click on '...'
3. See error

**Expected Behavior**
What you expected to happen.

**Screenshots**
If applicable, add screenshots.

**Environment**
- OS: [e.g., Windows 10, macOS 12]
- Browser: [e.g., Chrome 96]
- GeoGuardian Version: [e.g., 1.0.0]
```

### ✨ Suggest Features

For feature requests, create an issue with:
- **Feature description**: What you'd like to see
- **Use case**: Why this feature is valuable
- **Proposed solution**: How it might work
- **Alternatives considered**: Other approaches

**Feature Request Template**:
```markdown
**Feature Description**
A clear description of the feature.

**Problem It Solves**
What problem does this address?

**Proposed Solution**
How would you implement this?

**Alternatives Considered**
What other approaches did you consider?

**Additional Context**
Any other information or screenshots.
```

### 📖 Improve Documentation

Documentation improvements are always welcome:
- Fix typos or grammatical errors
- Clarify confusing sections
- Add examples or tutorials
- Update outdated information
- Translate documentation

### 💻 Submit Code

Before starting major work:
1. Check if an issue exists for the feature/bug
2. Comment on the issue to claim it
3. Discuss your approach if it's a major change
4. Wait for maintainer feedback before proceeding

---

## Development Workflow

### 1. Make Your Changes

**Backend (Python)**
- Follow PEP 8 style guide
- Add type hints to all functions
- Write docstrings for classes and methods
- Keep functions focused and small
- Add unit tests for new functionality

**Frontend (TypeScript)**
- Use TypeScript for all new files
- Follow existing component patterns
- Use Tailwind CSS for styling
- Ensure responsive design
- Add JSDoc comments for complex functions

### 2. Test Your Changes

**Backend Tests**
```bash
cd backend

# Run specific tests
python test_api_endpoints.py
python test_real_satellite_data.py

# Test your specific changes
python test_your_feature.py
```

**Frontend Tests**
```bash
cd frontend

# Type checking
npm run type-check

# Linting
npm run lint

# Build verification
npm run build
```

### 3. Commit Your Changes

Follow our [commit guidelines](#commit-guidelines):

```bash
git add .
git commit -m "feat: add hotspot visualization component"
```

### 4. Push and Create PR

```bash
git push origin feature/your-feature-name
```

Then create a Pull Request on GitHub.

---

## Coding Standards

### Backend (Python)

#### Style Guide
- Follow **PEP 8**
- Use **type hints** for all function parameters and return values
- Maximum line length: **88 characters** (Black formatter)
- Use **descriptive variable names**
- Avoid abbreviations unless common (e.g., `aoi`, `api`)

#### Example
```python
from typing import List, Dict, Optional
from datetime import datetime

def calculate_spectral_index(
    nir_band: np.ndarray,
    red_band: np.ndarray,
    index_type: str = "ndvi"
) -> Dict[str, float]:
    """
    Calculate spectral index from satellite bands.
    
    Args:
        nir_band: Near-infrared band array
        red_band: Red band array
        index_type: Type of index to calculate (default: "ndvi")
        
    Returns:
        Dictionary containing index statistics
        
    Raises:
        ValueError: If bands have different shapes
    """
    if nir_band.shape != red_band.shape:
        raise ValueError("Band shapes must match")
        
    # Calculate index
    ndvi = (nir_band - red_band) / (nir_band + red_band + 1e-10)
    
    return {
        "mean": float(np.mean(ndvi)),
        "std": float(np.std(ndvi)),
        "min": float(np.min(ndvi)),
        "max": float(np.max(ndvi))
    }
```

### Frontend (TypeScript)

#### Style Guide
- Use **TypeScript** for all new code
- Follow **ESLint** and **Prettier** rules
- Use **functional components** with hooks
- Prefer **const** over **let**
- Use **descriptive component names** (PascalCase)

#### Example
```typescript
interface SpectralIndexProps {
  name: string
  value: number
  color: string
  description?: string
}

export default function SpectralIndexCard({
  name,
  value,
  color,
  description
}: SpectralIndexProps) {
  const [expanded, setExpanded] = useState(false)
  
  return (
    <Card className="p-4 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <h3 className="font-medium text-gray-900">{name}</h3>
        <Badge
          variant="default"
          style={{ backgroundColor: color }}
        >
          {value.toFixed(3)}
        </Badge>
      </div>
      
      {description && expanded && (
        <p className="text-sm text-gray-600 mt-2">
          {description}
        </p>
      )}
    </Card>
  )
}
```

### Component Structure

**React Component Template**:
```typescript
// 1. Imports
import React, { useState, useEffect } from 'react'
import { Card, Badge } from '@/components/ui'

// 2. Types
interface ComponentProps {
  // ...
}

// 3. Component
export default function ComponentName({ prop1, prop2 }: ComponentProps) {
  // 4. State
  const [state, setState] = useState()
  
  // 5. Effects
  useEffect(() => {
    // ...
  }, [])
  
  // 6. Handlers
  const handleClick = () => {
    // ...
  }
  
  // 7. Render
  return (
    <div>
      {/* ... */}
    </div>
  )
}
```

---

## Commit Guidelines

### Commit Message Format

Use **Conventional Commits** format:

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types
- **feat**: New feature
- **fix**: Bug fix
- **docs**: Documentation changes
- **style**: Code style changes (formatting, no code change)
- **refactor**: Code refactoring
- **test**: Adding or updating tests
- **chore**: Maintenance tasks

### Examples
```bash
feat(analysis): add temporal trend forecasting
fix(auth): resolve token refresh issue
docs(readme): update installation instructions
style(frontend): apply consistent spacing
refactor(backend): simplify spectral analyzer
test(api): add endpoint integration tests
chore(deps): update dependencies
```

### Scope (Optional)
- `backend` - Backend changes
- `frontend` - Frontend changes
- `api` - API changes
- `db` - Database changes
- `docs` - Documentation
- `test` - Testing

---

## Pull Request Process

### Before Submitting

**Checklist**:
- [ ] Code follows style guidelines
- [ ] All tests pass
- [ ] New tests added for new features
- [ ] Documentation updated
- [ ] No linter errors
- [ ] TypeScript compiles without errors
- [ ] Branch is up to date with main

### PR Description Template

```markdown
## Description
Brief description of changes.

## Type of Change
- [ ] Bug fix (non-breaking change)
- [ ] New feature (non-breaking change)
- [ ] Breaking change (fix or feature that would cause existing functionality to change)
- [ ] Documentation update

## Related Issue
Closes #(issue number)

## Changes Made
- Change 1
- Change 2
- Change 3

## Testing
Describe how you tested your changes.

## Screenshots (if applicable)
Add screenshots for UI changes.

## Checklist
- [ ] My code follows the style guidelines
- [ ] I have performed a self-review
- [ ] I have commented my code where needed
- [ ] I have updated the documentation
- [ ] My changes generate no new warnings
- [ ] I have added tests
- [ ] All tests pass locally
```

### Review Process

1. **Automated Checks**: CI/CD will run tests and linting
2. **Code Review**: Maintainers will review your code
3. **Feedback**: Address any requested changes
4. **Approval**: Once approved, your PR will be merged

---

## Testing Requirements

### Backend Testing

**Required Tests**:
- Unit tests for new algorithms
- Integration tests for API endpoints
- Real data validation for analysis features

**Example Test**:
```python
def test_ndvi_calculation():
    """Test NDVI calculation with known values."""
    nir = np.array([[0.8, 0.9]])
    red = np.array([[0.2, 0.1]])
    
    result = calculate_ndvi(nir, red)
    
    assert result['mean'] > 0.6
    assert result['min'] >= -1.0
    assert result['max'] <= 1.0
```

### Frontend Testing

**Required**:
- TypeScript type checking (no errors)
- ESLint validation (no errors)
- Build verification (successful build)

**Running Tests**:
```bash
# Type checking
npm run type-check

# Linting
npm run lint

# Build test
npm run build
```

---

## Documentation

### Code Documentation

**Backend (Python)**:
- Docstrings for all public functions and classes
- Type hints for all parameters and return values
- Inline comments for complex logic

**Frontend (TypeScript)**:
- JSDoc comments for complex functions
- TypeScript interfaces for all props
- Inline comments for non-obvious code

### Documentation Files

When adding features, update:
- **README.md** - If it affects main features
- **docs/** - Relevant documentation files
- **CHANGELOG.md** - Add your changes (if exists)

---

## Need Help?

### Getting Support

- **Questions**: Open a GitHub Discussion
- **Bugs**: Create a GitHub Issue
- **Feature Ideas**: Open a Feature Request Issue
- **General Help**: Check documentation first

### Community Resources

- **Documentation**: [docs/README.md](./docs/README.md)
- **Setup Guide**: [docs/setup/DEPLOYMENT_INSTRUCTIONS.md](./docs/setup/DEPLOYMENT_INSTRUCTIONS.md)
- **GitHub Issues**: Search existing issues
- **GitHub Discussions**: Ask questions

---

## Recognition

All contributors will be:
- Listed in the project contributors
- Credited in release notes
- Mentioned in project documentation

Thank you for contributing to **GeoGuardian**! 🌍

Your efforts help make environmental monitoring accessible to everyone.

---

<div align="center">

**🌍 Building a Sustainable Future Together**

[Back to README](./README.md) • [Documentation](./docs/README.md) • [Get Started](./docs/setup/DEPLOYMENT_INSTRUCTIONS.md)

</div>

