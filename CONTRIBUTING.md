# Contributing to LUMO

Thank you for your interest in contributing to LUMO! This guide will help you get started.

## 🚀 Getting Started

1. Fork the repository
2. Clone your fork:
   ```bash
   git clone https://github.com/yourusername/eraser.git
   cd eraser
   ```
3. Create a feature branch:
   ```bash
   git checkout -b feature/amazing-feature
   ```
4. Make your changes
5. Commit and push:
   ```bash
   git add .
   git commit -m "Add amazing feature"
   git push origin feature/amazing-feature
   ```
6. Open a Pull Request

## 📋 Development Setup

Follow the [Local Development](README.md#-quick-start) section in README.md

## 🎯 Contribution Areas

### Frontend
- UI/UX improvements
- Performance optimization
- Accessibility enhancements
- New drawing tools
- Keyboard shortcuts

### Backend
- API improvements
- WebSocket optimization
- Database optimization
- AI features enhancement
- Security improvements

### DevOps
- Docker improvements
- CI/CD pipeline
- Deployment automation
- Monitoring setup

### Documentation
- API documentation
- User guides
- Deployment guides
- Code comments

## ✅ Code Standards

### Python (Backend)
- Follow PEP 8 style guide
- Use type hints
- Write docstrings
- Test your code

```python
def create_room(name: str) -> Room:
    """
    Create a new whiteboard room.
    
    Args:
        name: Room name
        
    Returns:
        Created room object
    """
    # Implementation
```

### TypeScript (Frontend)
- Strict mode enabled
- Use interfaces for props
- Component documentation
- Unit tests

```typescript
interface DrawingProps {
  width: number;
  height: number;
  onDraw: (data: DrawingObject) => void;
}

export function Drawing({ width, height, onDraw }: DrawingProps) {
  // Implementation
}
```

## 🧪 Testing

### Frontend Tests
```bash
cd frontend
npm test
npm run test:coverage
```

### Backend Tests
```bash
cd backend
pytest
pytest --cov=app
```

## 📝 Commit Messages

Use conventional commits:

```
feat: Add new drawing tool
fix: Fix cursor synchronization issue
docs: Update deployment guide
style: Format code
refactor: Optimize database queries
test: Add unit tests
```

## 🔍 Pull Request Process

1. Update README.md if needed
2. Add tests for new features
3. Ensure all tests pass
4. Update CHANGELOG.md
5. Request review from maintainers
6. Address review feedback

## 🐛 Bug Reports

Include:
- Description of the bug
- Steps to reproduce
- Expected behavior
- Actual behavior
- Screenshots if applicable
- Environment details

## 💡 Feature Requests

Include:
- Clear description
- Use cases/motivation
- Proposed implementation
- Possible alternatives
- Additional context

## 📚 Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [FastAPI Tutorial](https://fastapi.tiangolo.com)
- [Socket.IO Docs](https://socket.io/docs)
- [PostgreSQL Docs](https://www.postgresql.org/docs)

## 🏆 Recognition

Contributors will be:
- Added to CONTRIBUTORS.md
- Mentioned in release notes
- Thanked in README

## ❓ Questions?

- Open a discussion on GitHub
- Check existing issues
- Review documentation
- Contact maintainers

---

Happy contributing! 🎉
