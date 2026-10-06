# DeskPortal: Support Desk and Ticket Router

DeskPortal is an enterprise-grade Support Desk and Ticket Routing system built using Spring Boot, MySQL, and a modern web interface. It streamlines support request submission, automatically routes tickets based on priority and role, and maintains complete audit logging for every ticket status change.

---

## Key Features

- **Role-Based Access Control**: Granular login and functional views for Standard Employees, Support Agents, and System Administrators/Managers.
- **Dynamic Ticket Routing**: Automated assignment rules and manual reassignment based on severity levels (CRITICAL, HIGH, MEDIUM, LOW).
- **Audit Log Tracking**: Full historical tracking for every status transition (OPEN -> IN_PROGRESS -> RESOLVED).
- **RESTful API Backend**: Clean API endpoints servicing user management, ticket lifecycles, and audit history.
- **Glassmorphic Web UI**: Responsive interface built with standard web technologies.

---

## Tech Stack

- **Backend**: Java 17, Spring Boot 3.x, Spring Data JPA, Hibernate
- **Database**: MySQL Server
- **Frontend**: HTML5, CSS3, JavaScript (ES6+), FontAwesome
- **Build Tool**: Apache Maven
- **Version Control**: Git, GitHub

---

## Repository Structure

```text
ticket-router/
├── src/
│   ├── main/
│   │   ├── java/com/supportdesk/ticketrouter/
│   │   │   ├── controller/   # REST Controllers (User, Ticket, AuditLog)
│   │   │   ├── model/        # JPA Entities and Enums
│   │   │   ├── repository/   # Spring Data JPA Repositories
│   │   │   └── service/      # Routing Logic & Service Layer
│   │   └── resources/
│   │       ├── static/       # Static Web Assets (HTML, JS, CSS)
│   │       └── application.yml # Application & Database Configurations
│   └── test/                 # Automated Test Suites
├── pom.xml                   # Maven Build File
└── .gitignore                # Version Control Exclusion Rules
