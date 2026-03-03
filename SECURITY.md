# Security Policy

## Reporting Security Vulnerabilities

**Do not** open public GitHub issues for security vulnerabilities.

Instead, please email security@lumo-app.dev with:
- Description of the vulnerability
- Steps to reproduce
- Potential impact
- Suggested fix (if available)

We will:
1. Acknowledge receipt within 48 hours
2. Investigate and assess severity
3. Develop and test a fix
4. Release patch within 7 days
5. Credit you in the release notes (if desired)

## Security Best Practices

For users deploying LUMO:

1. **Use HTTPS** - Always use HTTPS in production
2. **Change Default Keys** - Update SECRET_KEY and database passwords
3. **Enable Authentication** - Require login for all features
4. **Keep Dependencies Updated** - Run `npm audit` and `pip check` regularly
5. **Database Security** - Use strong passwords, network isolation
6. **API Keys** - Rotate OpenAI keys regularly
7. **Backups** - Regular automated backups
8. **Monitoring** - Enable logging and alerts

## Supported Versions

| Version | Status | Support Until |
|---------|--------|---------------|
| 1.0.x | Active | 2025-03-03 |
| 0.9.x | End of Life | 2024-09-03 |

## Security Updates

Subscribe to updates:
- GitHub: Watch repository
- Email: Join mailing list at lumo-app.dev
- Twitter: @lumoapp

## Compliance

LUMO complies with:
- OWASP Top 10
- CWE/SANS Top 25
- PCI DSS (for payment handling)
- GDPR (for data privacy)

## Responsible Disclosure Timeline

- **Day 1**: Vulnerability reported
- **Day 1-3**: Initial assessment
- **Day 3-7**: Fix development
- **Day 7**: Security patch released
- **Day 14**: Public disclosure (if not critical)

---

Last Updated: 2024-03-03
