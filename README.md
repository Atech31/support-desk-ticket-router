DeskPortal: Support Desk and Ticket RouterDeskPortal is an enterprise-grade Support Desk and Ticket Routing system built using Spring Boot, MySQL, and a modern web interface. It streamlines support request submission, automatically routes tickets based on priority and role, and maintains complete audit logging for every ticket status change.Key FeaturesRole-Based Access Control: Granular login and functional views for Standard Employees, Support Agents, and System Administrators/Managers.Dynamic Ticket Routing: Automated assignment rules and manual reassignment based on severity levels (CRITICAL, HIGH, MEDIUM, LOW).Audit Log Tracking: Full historical tracking for every status transition (OPEN -> IN_PROGRESS -> RESOLVED).RESTful API Backend: Clean API endpoints servicing user management, ticket lifecycles, and audit history.Glassmorphic Web UI: Responsive interface built with standard web technologies.Tech StackBackend: Java 17, Spring Boot 3.x, Spring Data JPA, HibernateDatabase: MySQL ServerFrontend: HTML5, CSS3, JavaScript (ES6+), FontAwesomeBuild Tool: Apache MavenVersion Control: Git, GitHubRepository Structureticket-router/
├── src/
│   ├── main/
│   │   ├── java/com/supportdesk/ticketrouter/
│   │   │   ├── controller/      # REST Controllers (User, Ticket, AuditLog)
│   │   │   ├── model/           # JPA Entities and Enums
│   │   │   ├── repository/      # Spring Data JPA Repositories
│   │   │   └── service/         # Routing Logic & Service Layer
│   │   └── resources/
│   │       ├── static/          # Static Web Assets (HTML, JS, CSS)
│   │       └── application.yml  # Application & Database Configurations
│   └── test/                    # Automated Test Suites
├── pom.xml                      # Maven Build File
└── .gitignore                   # Version Control Exclusion Rules
Getting StartedPrerequisitesJava Development Kit (JDK) 17 or higherApache Maven 3.8+MySQL Server 8.0+ running on port 3306Database SetupOpen your MySQL client and create a new database:CREATE DATABASE support_desk_db;
Configure your credentials in src/main/resources/application.yml:spring:
  datasource:
    url: jdbc:mysql://localhost:3306/support_desk_db?useSSL=false&serverTimezone=UTC
    username: YOUR_MYSQL_USERNAME
    password: YOUR_MYSQL_PASSWORD
  jpa:
    hibernate:
      ddl-auto: update
    show-sql: true
Running the ApplicationNavigate to the project root directory and start the Spring Boot server:Using Maven Wrapper:./mvnw spring-boot:run
Or building and executing the JAR package:mvn clean package
java -jar target/ticket-router-0.0.1-SNAPSHOT.jar
The server will start at http://localhost:8081.API ReferenceUser Controller (/api/users)MethodEndpointDescriptionGET/api/usersFetch list of registered usersPOST/api/usersRegister a new user (EMPLOYEE, AGENT, MANAGER)Ticket Controller (/api/tickets)MethodEndpointDescriptionGET/api/ticketsRetrieve all support ticketsPOST/api/ticketsCreate a new ticketPUT/api/tickets/{id}Update status or assignment of an existing ticketAudit Log Controller (/api/audit-logs)MethodEndpointDescriptionGET/api/audit-logsRetrieve chronological ticket status logsContribution WorkflowFork the repository.Create a feature branch: git checkout -b feature/NewFeatureCommit changes: git commit -m "Add NewFeature"Push to branch: git push origin feature/NewFeatureOpen a Pull Request.
