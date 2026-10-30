# Engineering decisions

- Retain the existing working UI/API baseline rather than replacing it with an unverified rewrite.
- Pin frontend dependencies for reproducible builds.
- Use a single-origin FastAPI deployment to serve the React build.
- Keep PayPal demo-only until sandbox OAuth, API calls and webhook verification are implemented and tested.
- Authentication, tenant isolation, integer-minor-unit migration, signed approvals and LLM provider integration remain incomplete.
