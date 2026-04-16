# Contributing to FitRoam

## Branch workflow

1. Branch from `dev`, never from `main`
2. Name branches: `feature/gym-search`, `fix/auth-middleware`
3. Open a PR into `dev` when ready for review
4. `main` is only updated via release PRs from `dev`

## Commit messages

Follow [Conventional Commits](https://www.conventionalcommits.org):

- `feat:` — new feature
- `fix:` — bug fix
- `docs:` — documentation only
- `refactor:` — code change with no feature or fix
- `test:` — adding or updating tests
- `chore:` — tooling, dependencies, config

## Before opening a PR

- [ ] `npm run type-check` passes with no errors
- [ ] `npm run lint` passes
- [ ] `npm run test` passes
- [ ] New feature has at least one test
- [ ] Any API change is reflected in `docs/ARCHITECTURE.md`
- [ ] Any schema change is reflected in `docs/DATABASE.md`

## Environment variables

Never commit real `.env` files. Update `.env.example` when adding new variables.
