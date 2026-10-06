package com.supportdesk.repository;

import com.supportdesk.model.entity.Ticket;
import com.supportdesk.model.enums.Priority;
import com.supportdesk.model.enums.Status;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface TicketRepository extends JpaRepository<Ticket, Long> {

    List<Ticket> findByStatus(Status status);

    
    List<Ticket> findByAssignedAgentId(Long agentId);

    List<Ticket> findByPriority(Priority priority);

    List<Ticket> findByStatusNotAndSlaDueAtBefore(Status status, LocalDateTime now);
    
}