package com.supportdesk.service;

import com.supportdesk.model.entity.AuditLog;
import com.supportdesk.model.entity.Ticket;
import com.supportdesk.model.entity.User;
import com.supportdesk.model.enums.Role;
import com.supportdesk.model.enums.Status;
import com.supportdesk.repository.AuditLogRepository;
import com.supportdesk.repository.TicketRepository;
import com.supportdesk.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class TicketService {

    private final TicketRepository ticketRepository;
    private final UserRepository userRepository;
    private final AuditLogRepository auditLogRepository;

    @Autowired
    public TicketService(TicketRepository ticketRepository, 
                         UserRepository userRepository, 
                         AuditLogRepository auditLogRepository) {
        this.ticketRepository = ticketRepository;
        this.userRepository = userRepository;
        this.auditLogRepository = auditLogRepository;
    }

    public List<Ticket> getAllTickets() {
        return ticketRepository.findAll();
    }

    @Transactional
    public Ticket createTicket(Ticket ticket) {
        Ticket savedTicket = ticketRepository.save(ticket);
        
        AuditLog log = new AuditLog();
        log.setTicketId(savedTicket.getId());
        log.setActionTaken("TICKET_CREATED");
        log.setChangedBy("SYSTEM");
        log.setTimestamp(LocalDateTime.now());
        auditLogRepository.save(log);

        return autoAssignAgent(savedTicket.getId());
    }

    @Transactional
    public Ticket autoAssignAgent(Long ticketId) {
        Ticket ticket = ticketRepository.findById(ticketId)
                .orElseThrow(() -> new RuntimeException("Ticket not found"));

        List<User> agents = userRepository.findByRole(Role.AGENT);
        if (!agents.isEmpty()) {
            User assignedAgent = agents.get(0);
            ticket.setAssignedAgent(assignedAgent);
            ticket.setStatus(Status.IN_PROGRESS);

            AuditLog log = new AuditLog();
            log.setTicketId(ticket.getId());
            log.setActionTaken("AUTO_ASSIGNED_TO_" + assignedAgent.getName());
            log.setChangedBy("SYSTEM");
            log.setTimestamp(LocalDateTime.now());
            auditLogRepository.save(log);
        }

        return ticketRepository.save(ticket);
    }
    
    @Transactional
    public Ticket assignAgentToTicket(Long ticketId, Long agentId, String updatedBy) {
        Ticket ticket = ticketRepository.findById(ticketId)
                .orElseThrow(() -> new RuntimeException("Ticket not found"));

        User agent = userRepository.findById(agentId)
                .orElseThrow(() -> new RuntimeException("Agent not found"));

        ticket.setAssignedAgent(agent);
        if (ticket.getStatus() == Status.OPEN) {
            ticket.setStatus(Status.IN_PROGRESS);
        }
        Ticket updatedTicket = ticketRepository.save(ticket);

        AuditLog log = new AuditLog();
        log.setTicketId(ticket.getId());
        log.setActionTaken("REASSIGNED_TO_" + agent.getName());
        log.setChangedBy(updatedBy);
        log.setTimestamp(LocalDateTime.now());
        auditLogRepository.save(log);

        return updatedTicket;
    }

    public Ticket updateTicketStatus(Long ticketId, Status newStatus, String updatedBy) {
        Ticket ticket = ticketRepository.findById(ticketId)
                .orElseThrow(() -> new RuntimeException("Ticket not found"));
        
        ticket.setStatus(newStatus);
        Ticket updatedTicket = ticketRepository.save(ticket);

        AuditLog log = new AuditLog();
        log.setActionTaken("STATUS_UPDATED_TO_" + newStatus);
        log.setChangedBy(updatedBy);
        log.setTicketId(ticket.getId());
        log.setTimestamp(LocalDateTime.now());
        auditLogRepository.save(log);

        return updatedTicket;
    }

    public List<Ticket> getTicketsByStatus(Status status) {
        return ticketRepository.findByStatus(status);
    }

    @Transactional
    public void deleteTicket(Long ticketId) {
        if (!ticketRepository.existsById(ticketId)) {
            throw new RuntimeException("Ticket not found");
        }
        ticketRepository.deleteById(ticketId);
    }

    public List<AuditLog> getAuditLogsByTicketId(Long ticketId) {
        return auditLogRepository.findByTicketId(ticketId);
    }
}