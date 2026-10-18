# Contributing to YUKTHI

## Branching Strategy
- **`main`**: Production-ready code.
- **`dev`**: Active development branch. All feature branches merge here first.
- **Feature branches**: Created from `dev`, named `feature/short-description` (e.g., `feature/scam-checker-ui`).
*(Note: To be adapted to the repository's actual configuration once initialized).*

## Commit Message Conventions
- Use descriptive commit messages (e.g., `feat: add scam checker rule validation`).
- Reference issue numbers if applicable.

## Pull Request Procedure
1. Develop on `dev` or a feature branch created from `dev`.
2. Push changes to GitHub.
3. Open a pull request targeting the `dev` branch.
4. Review changes, run tests, and merge only after approval.
5. For releases, open a PR from `dev` to `main`.

## Code Review Checklist
- Code follows project style guidelines.
- Tests are written for new functionality.
- Documentation is updated.
- No secrets or credentials are included.

## Testing Requirements
- Unit tests must be provided for all business logic.
- Run the full test suite locally before submitting a PR.

## Documentation Update Requirements
- Any changes to core modules or APIs must be reflected in the `docs/` folder.

## Secret-Handling Rules
- **Never commit credentials, `.env` files containing secrets, or private financial data.**
- Use `.env.example` to document required environment variables with safe placeholders.
