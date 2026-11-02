# Git Commit Strategy — Zenbil

This document explains how commits are structured in this project.
Following this strategy builds a professional GitHub history.

---

## Commit Message Format

Every commit follows this format:

```
type: short description (max 72 characters)

Optional longer explanation if needed.
```

---

## Commit Types

| Type | When to use | Example |
|---|---|---|
| `feat` | Adding a new feature | `feat: add product star ratings` |
| `fix` | Fixing a bug | `fix: progress bar red on completed orders` |
| `docs` | Updating documentation | `docs: add API endpoints to README` |
| `style` | UI/CSS changes only | `style: improve mobile navbar spacing` |
| `refactor` | Improving code without changing behavior | `refactor: extract checkout logic to service` |
| `test` | Adding or updating tests | `test: add checkout stock validation tests` |
| `chore` | Setup, config, dependencies | `chore: add push script and git credentials` |
| `perf` | Performance improvements | `perf: add database index on products.shop_id` |

---

## Real Examples From This Project

```
feat: add shop type system and grouped homepage
feat: add product reviews and star ratings system
feat: add shopping cart and multi-seller order system
fix: progress bar shows all green when order completed
fix: single seller orders show confirmed not partial
docs: update README with full architecture and setup guide
chore: setup auto-push script and permanent git credentials
```

---

## How to Push a New Feature

After making changes, run these three commands:

```bash
cd ~/myweb/zenbil
git add .
git commit -m "feat: describe what you added"
git push origin main
```

Or use the push script:
```bash
bash push.sh "feat: describe what you added"
```

---

## Branch Strategy (for larger features)

For features that take more than one session:

```bash
# Create a branch
git checkout -b feature/payment-integration

# Work on the feature, commit as you go
git add .
git commit -m "feat: add Telebirr payment initiation endpoint"

git add .
git commit -m "feat: add payment status webhook handler"

# When done, merge back to main
git checkout main
git merge feature/payment-integration
git push origin main

# Clean up
git branch -d feature/payment-integration
```

---

## What Makes a Good Commit

**Good:**
```
feat: add verified buyer check for product reviews

Only customers with a completed order containing the product
can submit a review. This prevents fake reviews and builds
trust with customers.
```

**Bad:**
```
update stuff
fixed it
changes
```

A good commit message answers: what changed and why.

---

## Frequency Goal

- At least one commit per development session
- Each session = one green box on the contribution graph
- Aim for small, focused commits rather than one large commit
